import { gsap } from "@/lib/gsap";
import { isMobile } from "./layout";
import { fill, program, texture, upload, type Uniforms } from "./gl";
import { fragmentShader, vertexShader } from "./shaders";
import {
  calm,
  field,
  flow,
  hello,
  knot,
  noise,
  schema,
  seed,
  surface,
  type ShapeData,
} from "./shapes";

/**
 * The particle stage: one fixed, full-screen WebGL canvas that the whole site
 * draws its story on.
 *
 * A module singleton rather than React state: it outlives page changes, and
 * code outside React (the preloader, the scroll provider) talks to it.
 *
 * Driving it: something (the home story) calls `set(from, to, mix)` as the page
 * scrolls. The stage never reads scroll itself.
 */

export type ShapeId =
  | "seed"
  | "knot"
  | "noise"
  | "schema"
  | "flow"
  | "surface"
  | "calm"
  | "hello"
  | "field";

type Slot = { pos: WebGLTexture; col: WebGLTexture; data: ShapeData };

/** Vertical field of view. Wide enough for depth, narrow enough to stay calm. */
const FOV = 35;

type Listener = () => void;

const DISPLAY_VAR = "--font-display-family";

class Stage {
  /** Particles per shape. Set once at init from the device. */
  n = 0;
  private tw = 0;
  private th = 0;

  private canvas?: HTMLCanvasElement;
  private gl?: WebGL2RenderingContext;
  private prog?: WebGLProgram;
  private vao?: WebGLVertexArrayObject;
  private locations = new Map<string, WebGLUniformLocation | null>();
  private dpr = 1;
  private lost = false;
  private u: Uniforms = {
    uPosA: { type: "t", value: null, unit: 0 },
    uPosB: { type: "t", value: null, unit: 1 },
    uColA: { type: "t", value: null, unit: 2 },
    uColB: { type: "t", value: null, unit: 3 },
    uTexW: { type: "i", value: 1 },
    uFocal: { type: "f", value: 1 / Math.tan((FOV * Math.PI) / 360) },
    uAspect: { type: "f", value: 1 },
    uCenterA: { type: "v3", value: [0, 0, 0] },
    uCenterB: { type: "v3", value: [0, 0, 0] },
    uModeA: { type: "f", value: 0 },
    uModeB: { type: "f", value: 0 },
    uSizeA: { type: "f", value: 1 },
    uSizeB: { type: "f", value: 1 },
    uPulseA: { type: "f", value: 0 },
    uPulseB: { type: "f", value: 0 },
    uMix: { type: "f", value: 0 },
    uTime: { type: "f", value: 0 },
    uIntro: { type: "f", value: 0 },
    uTurb: { type: "f", value: 0 },
    uDpr: { type: "f", value: 1 },
    uCamZ: { type: "f", value: 1 },
    uMotion: { type: "f", value: 1 },
    uMouse: { type: "v2", value: [99999, 99999] },
    uMouseR: { type: "f", value: 130 },
    uMouseF: { type: "f", value: 0 },
    uOpacity: { type: "f", value: 0 },
  };
  /** Typed accessors, so the rest of the class reads `this.f.uMix = …`. */
  private f = new Proxy({} as Record<string, number>, {
    get: (_, k: string) => this.u[k].value as number,
    set: (_, k: string, v: number) => {
      this.u[k].value = v;
      return true;
    },
  });
  private slots = new Map<ShapeId, Slot>();
  private family = "sans-serif";
  private w = 0;
  private h = 0;

  /** What is on screen: shape `from` blending into shape `to` by `mix`. */
  private from: ShapeId = "seed";
  private to: ShapeId = "seed";
  mix = 0;

  /** Set while a page transition owns the stage; scroll-driven `set` is ignored. */
  private locked = false;
  private reduced = false;
  private mouse = {
    x: -99999,
    y: -99999,
    tx: -99999,
    ty: -99999,
    f: 0,
    tf: 0,
    last: 0,
  };
  private turb = 0;
  private turbTarget = 0;
  private visible = 0;
  private idle = false;

  ready = false;
  failed = false;
  progress = 0;
  /** Flips once the intro has played. A page that mounts later skips it. */
  introduced = false;
  private listeners = new Set<Listener>();

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private report(p: number) {
    this.progress = Math.max(this.progress, p);
    this.emit();
  }

  /**
   * Build the GL program and every shape. Resolves when the stage can draw the
   * whole story; rejects (and sets `failed`) when WebGL is unavailable.
   */
  async init(canvas: HTMLCanvasElement) {
    if (this.gl || this.failed) return;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl || !(await this.setup(gl))) {
      this.failed = true;
      document.documentElement.setAttribute("data-nogl", "");
      this.report(1);
      throw new Error("WebGL2 unavailable");
    }
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);

    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const phone = isMobile(this.w) || matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency ?? 8;
    // One texel per particle: 32k on a capable desktop, 18k on a modest one,
    // 8k on phones.
    [this.tw, this.th] = phone
      ? [128, 64]
      : cores <= 4
        ? [192, 96]
        : [256, 128];
    this.n = this.tw * this.th;
    this.dpr = Math.min(window.devicePixelRatio, phone ? 1.75 : 2);
    this.f.uDpr = this.dpr;
    this.f.uMotion = this.reduced ? 0 : 1;
    this.u.uTexW.value = this.tw;

    this.size();
    this.report(0.1);

    // The display face, for "Say hello." next/font hashes the family name, so it
    // is read back from the CSS variable rather than hard-coded.
    const fam = getComputedStyle(document.documentElement)
      .getPropertyValue(DISPLAY_VAR)
      .trim();
    if (fam) this.family = fam;
    const fontReady = document.fonts
      .load(`600 100px ${this.family}`)
      .catch(() => undefined)
      .then(() => this.report(this.progress + 0.1));

    await fontReady;

    // One shape per task, so building the story never blocks input for long.
    const steps = this.steps();
    for (let i = 0; i < steps.length; i++) {
      steps[i]();
      if (i === 1) this.apply();
      this.report(0.2 + ((i + 1) / steps.length) * 0.8);
      await yieldTask();
    }
    this.apply();
    this.ready = true;

    gsap.ticker.add(this.tick);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
    this.emit();
  }

  // -------------------------------------------------------------------------
  // Shapes
  // -------------------------------------------------------------------------

  private slot(id: ShapeId, data: ShapeData) {
    const gl = this.gl!;
    const existing = this.slots.get(id);
    if (existing) {
      fill(gl, existing.pos, this.tw, this.th, data.pos);
      fill(gl, existing.col, this.tw, this.th, data.col);
      existing.data = data;
      return;
    }
    this.slots.set(id, {
      pos: texture(gl, this.tw, this.th, data.pos),
      col: texture(gl, this.tw, this.th, data.col),
      data,
    });
  }

  /** Compile the program and set fixed state. False if the GPU says no. */
  private async setup(gl: WebGL2RenderingContext) {
    try {
      this.gl = gl;
      this.prog = await program(gl, vertexShader, fragmentShader);
      this.vao = gl.createVertexArray()!;
      this.locations.clear();
      return true;
    } catch (e) {
      console.warn(e);
      this.gl = undefined;
      return false;
    }
  }

  /** Every shape, as separate steps — in story order, so the first are ready first. */
  private steps() {
    const { n, w, h } = this;
    return [
      () => this.slot("seed", seed(n)),
      () => this.slot("knot", knot(n, w, h)),
      () => this.slot("noise", noise(n, w, h)),
      () => this.slot("schema", schema(n, w, h)),
      () => this.slot("flow", flow(n, w, h)),
      () => this.slot("surface", surface(n, w, h)),
      () => this.slot("field", field(n, w, h)),
      () => this.slot("calm", calm(n, w, h)),
      () => this.slot("hello", hello(n, w, h, this.family)),
    ];
  }

  private build() {
    this.steps().forEach((step) => step());
  }

  /** Push the current from/to/mix into the uniforms. */
  private apply() {
    const a = this.slots.get(this.from);
    const b = this.slots.get(this.to);
    if (!a || !b) return;
    const u = this.u;
    u.uPosA.value = a.pos;
    u.uColA.value = a.col;
    u.uPosB.value = b.pos;
    u.uColB.value = b.col;
    u.uCenterA.value = a.data.center;
    u.uCenterB.value = b.data.center;
    this.f.uModeA = a.data.mode;
    this.f.uModeB = b.data.mode;
    this.f.uSizeA = a.data.size;
    this.f.uSizeB = b.data.size;
    this.f.uPulseA = a.data.pulse;
    this.f.uPulseB = b.data.pulse;
    this.f.uMix = this.mix;
  }

  /** Scroll-driven: show `from` blending into `to` by `mix` (0–1). */
  set(from: ShapeId, to: ShapeId, mix: number) {
    if (this.locked) return;
    this.from = from;
    this.to = to;
    this.mix = Math.min(1, Math.max(0, mix));
    this.apply();
  }

  /** Stage-scroll turbulence, from Lenis's velocity (px per frame). */
  setVelocity(v: number) {
    this.turbTarget = Math.min(Math.abs(v) / 30, 1.6);
  }

  /** Fade the stage in (a page is using it) or out (it is not). */
  show(on = true, duration = 0.8) {
    if (on) this.locked = false;
    gsap.to(this, {
      visible: on ? 1 : 0,
      duration,
      ease: "power2.out",
      overwrite: true,
    });
  }

  /**
   * The first-load intro: every particle starts at one point and flies to the
   * hero knot. Returns the tween so the caller can sequence copy against it.
   */
  intro() {
    this.introduced = true;
    if (!this.gl || this.reduced) {
      this.f.uIntro = 1;
      return gsap.timeline();
    }
    return gsap.fromTo(
      this.u.uIntro,
      { value: 0 },
      { value: 1, duration: 2.6, ease: "none" },
    );
  }

  /** Skip the intro (a page that mounts after it already played). */
  skipIntro() {
    this.f.uIntro = 1;
    this.introduced = true;
  }

  // -------------------------------------------------------------------------
  // Loop
  // -------------------------------------------------------------------------

  private tick = (time: number) => {
    const gl = this.gl;
    if (!gl || !this.prog || this.lost) return;

    this.f.uOpacity = this.visible;
    if (this.visible <= 0.001) {
      // Clear once so nothing lingers, then stop paying for frames.
      if (!this.idle) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.idle = true;
      }
      return;
    }
    this.idle = false;

    if (!this.reduced) this.f.uTime = time;
    const m = this.mouse;
    m.x += (m.tx - m.x) * 0.14;
    m.y += (m.ty - m.y) * 0.14;
    // The push swells while the pointer moves and settles to a gentle presence.
    m.tf = performance.now() - m.last < 140 ? 1 : 0.45;
    m.f += (m.tf - m.f) * 0.06;
    this.u.uMouse.value = [m.x - this.w / 2, this.h / 2 - m.y];
    this.f.uMouseF = m.f;

    this.turb += (this.turbTarget - this.turb) * 0.08;
    this.turbTarget *= 0.92;
    this.f.uTurb = this.turb;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao!);
    // Premultiplied output, added: dense areas glow.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    upload(gl, this.prog, this.u, this.locations);
    gl.drawArrays(gl.POINTS, 0, this.n);
  };

  private size() {
    const c = this.canvas;
    if (!c) return;
    c.width = Math.round(this.w * this.dpr);
    c.height = Math.round(this.h * this.dpr);
    // In px, not 100vh: on phones 100vh is the *large* viewport, and the
    // projection is built from innerHeight.
    c.style.width = `${this.w}px`;
    c.style.height = `${this.h}px`;
    // Place the camera so 1 unit at z = 0 is exactly 1 CSS px.
    this.f.uCamZ = this.h / 2 / Math.tan((FOV * Math.PI) / 360);
    this.f.uAspect = this.w / this.h;
    this.f.uMouseR = Math.min(this.w, this.h) * 0.14;
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };

  /** A restored context has nothing in it: rebuild the program and every shape. */
  private onRestored = async () => {
    const gl = this.canvas?.getContext("webgl2");
    if (!gl || !(await this.setup(gl))) return;
    this.slots.clear();
    this.lost = false;
    this.build();
    this.apply();
  };

  private resizeTimer = 0;
  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Phones resize by a few dozen px whenever the URL bar shows or hides;
    // re-laying every shape for that would hitch the scroll it happens during.
    const big = w !== this.w || Math.abs(h - this.h) > 140;
    this.w = w;
    this.h = h;
    this.size();
    if (!big) return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.build();
      this.apply();
    }, 150);
  };

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const m = this.mouse;
    if (m.last === 0) {
      m.x = e.clientX;
      m.y = e.clientY;
    }
    m.tx = e.clientX;
    m.ty = e.clientY;
    m.last = performance.now();
  };

  private onLeave = () => {
    this.mouse.tf = 0;
    this.mouse.last = 0;
    this.mouse.tx = this.mouse.ty = this.mouse.x = this.mouse.y = -99999;
  };
}

/** Hand the main thread back between chunks of work. */
function yieldTask() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const stage = new Stage();

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __stage: Stage }).__stage = stage;
}
