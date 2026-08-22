/**
 * The liquid carousel's shader pair (plan §7).
 *
 * One plate = one subdivided plane in *pixel* units — the scene's camera is
 * placed so that 1 world unit is 1 CSS pixel at z = 0, which means every number
 * in here is a real on-screen distance and the WebGL plates line up with the DOM
 * links layered over them without a projection round-trip.
 *
 * Two things make it read as liquid rather than as a spinning card:
 *
 *   1. the plate *bows* — a half-sine across its width pushes the middle away
 *      from the direction of travel while the edges stay put, so the plate
 *      trails behind itself the way a sheet in water would; and
 *   2. the sample point splits per channel along the same curve, so the fastest
 *      part of the bend fringes red one way and blue the other.
 *
 * Both are driven by one signed velocity uniform that comes from the shared
 * store (lib/velocity.ts), so the plates, the DOM skew and the marquee all agree
 * on how fast the track is moving.
 *
 * No text is ever drawn in here — titles, indices and categories stay DOM text
 * in the overlay (plan §7, rule 1). The shader only ever sees the cover image.
 */

/** Plane subdivisions. Enough that the bow is a curve and not a crease. */
export const LIQUID_SEGMENTS = { x: 40, y: 28 } as const;

/**
 * The ring's shape. Shared by both layers: the shader positions the plates with
 * these and the DOM overlay reproduces the same perspective, so the title stays
 * welded to the picture it names.
 */
export const RING = {
  /** px a plate rises toward the camera when hovered. */
  lift: 30,
  /** px the outermost plates fall back — the ring's depth. */
  depth: 74,
  /** rad the outermost plates turn away. */
  turn: 0.2,
  /** px the outer plates arc upward, so the row isn't a flat line. */
  arc: 12,
  /** Fraction of full contrast a plate carries before you hover it. */
  presence: 0.66,
  /** Distance-from-centre range over which a plate dissolves out. */
  fade: [0.82, 1.28] as const,
  /** Seconds for hover to reach full. */
  hoverEase: 0.12,
} as const;

export const liquidVertexShader = /* glsl */ `
  #define PI 3.141592653589793

  uniform float uVelocity;   // signed, roughly -1..1
  uniform float uBend;       // peak z displacement in px at full velocity
  uniform float uHover;      // 0..1
  uniform float uLift;       // px the plate rises toward the camera on hover

  varying vec2  vUv;
  varying float vBow;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Half-sine across the width: zero at both edges, one in the middle.
    float bow = sin(uv.x * PI);

    // The middle lags behind the direction of travel.
    pos.z -= bow * uVelocity * uBend;

    // ...and pinches vertically as it goes, which is the part that stops this
    // reading as a plate on a hinge. Squared so it stays subtle until it's fast.
    float speed = abs(uVelocity);
    pos.y *= 1.0 - bow * speed * speed * 0.22;

    // Hover brings the plate forward. Perspective does the scaling for us.
    pos.z += uHover * uLift;

    vBow = bow * uVelocity;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const liquidFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2  uCover;     // uv scale that turns "stretch" into "cover"
  uniform vec3  uPaper;     // page background, for the resting wash
  uniform float uSplit;     // peak per-channel uv offset
  uniform float uHover;     // 0..1
  uniform float uPresence;  // resting contrast floor
  uniform float uOpacity;   // fades the plate at the edges of the track

  varying vec2  vUv;
  varying float vBow;

  void main() {
    // Cover-fit about the centre, so a 3:2 photo in a 4:3 plate crops rather
    // than squashes.
    vec2 uvCover = (vUv - 0.5) * uCover + 0.5;

    // Chromatic split along the direction of travel, weighted by the bow — the
    // fringe is widest exactly where the plate is deforming most.
    vec2 shift = vec2(uSplit * vBow, 0.0);

    float r = texture2D(uTexture, uvCover + shift).r;
    vec4  g = texture2D(uTexture, uvCover);
    float b = texture2D(uTexture, uvCover - shift).b;

    vec3 colour = vec3(r, g.g, b);

    // At rest the plates sit back into the paper; hover brings one to full
    // strength. The whole band stays a background element until you touch it.
    colour = mix(uPaper, colour, uPresence + (1.0 - uPresence) * uHover);

    gl_FragColor = vec4(colour, uOpacity);
  }
`;

/**
 * Camera field of view, degrees. Shared: the scene builds its camera from this
 * and the DOM overlay uses the same number to work out how much perspective
 * scaling to apply to the text sitting on each plate, so the two never drift.
 */
export const CAMERA_FOV = 45;

/**
 * Distance the camera has to sit back for 1 world unit to be 1 CSS pixel at
 * z = 0 — the whole reason every measurement in the shader is in pixels.
 */
export function cameraDistance(viewportHeight: number, fov = CAMERA_FOV) {
  return viewportHeight / 2 / Math.tan((fov * Math.PI) / 360);
}

export type TrackLayout = {
  /** Plate size in px. */
  width: number;
  height: number;
  /** Centre-to-centre distance between plates, px. */
  pitch: number;
  /** Full width of the ring, px. Always wider than the viewport. */
  span: number;
  /** One entry per rendered plate, holding the index of the slide it shows. */
  plates: number[];
};

/**
 * Work out the plate size and how many plates the ring needs.
 *
 * The ring has to be wider than the viewport plus a plate, or the wrap point
 * would be on-screen and plates would visibly pop from one edge to the other. On
 * a wide display six plates may not be enough to cover that, so the slides are
 * repeated until they are — which is also what makes the loop read as endless
 * rather than as a list that happens to rejoin.
 */
export function measureTrack(
  viewportWidth: number,
  count: number,
  aspect: number,
  gap: number,
): TrackLayout {
  const compact = viewportWidth < 768;
  const width = Math.min(
    Math.max(viewportWidth * (compact ? 0.74 : 0.4), 240),
    620,
  );
  const height = width / aspect;
  const pitch = width + gap;

  const needed = viewportWidth + pitch * 2;
  const copies = Math.max(1, Math.ceil(needed / (pitch * count)));

  const plates: number[] = [];
  for (let copy = 0; copy < copies; copy++) {
    for (let i = 0; i < count; i++) plates.push(i);
  }

  return { width, height, pitch, span: pitch * plates.length, plates };
}

/** Hermite ramp between two edges — the JS twin of GLSL's smoothstep. */
export function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * `#rrggbb` → raw 0..1 components.
 *
 * Deliberately not `new THREE.Color(hex)`: with colour management on, that
 * converts sRGB to linear, and this canvas renders with `linear` + `flat` output
 * so that what the WebP holds is what lands on screen — matching the DOM exactly.
 * Converting here would make the plates' resting wash a different paper from the
 * page's.
 */
export function parseHexRgb(
  hex: string,
  fallback: readonly [number, number, number],
): [number, number, number] {
  const value = hex.trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [...fallback];
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

/**
 * uv scale for a cover-fit crop. Returns `[u, v]` multipliers < 1 on the axis
 * that has to be cropped.
 */
export function coverScale(
  planeAspect: number,
  imageAspect: number,
): [number, number] {
  return imageAspect > planeAspect
    ? [planeAspect / imageAspect, 1]
    : [1, imageAspect / planeAspect];
}

/**
 * Wrap `value` into `[-span / 2, span / 2)`.
 *
 * This is what makes the track infinite: a plate that leaves one side re-enters
 * on the other. `span` is the full width of the ring of plates, which is always
 * wider than the viewport, so the seam happens off-screen.
 */
export function wrapSigned(value: number, span: number) {
  const half = span / 2;
  return ((((value + half) % span) + span) % span) - half;
}
