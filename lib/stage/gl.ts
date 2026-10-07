/**
 * The handful of WebGL2 calls the stage needs: one program, a few textures, one
 * draw. Written directly rather than through a 3D library because the stage is
 * a single `drawArrays(POINTS)` — a scene graph would be ~190 KB of JavaScript to
 * issue it.
 */

export type Uniform =
  | { type: "f"; value: number }
  | { type: "i"; value: number }
  | { type: "v2"; value: [number, number] }
  | { type: "v3"; value: [number, number, number] }
  | { type: "t"; value: WebGLTexture | null; unit: number };

export type Uniforms = Record<string, Uniform>;

function shader(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

/**
 * Compile and link without stalling the main thread where the driver allows it
 * (KHR_parallel_shader_compile): asking for COMPILE_STATUS straight away blocks
 * until the GPU finishes, so poll the non-blocking completion flag first.
 */
export async function program(
  gl: WebGL2RenderingContext,
  vs: string,
  fs: string,
) {
  const ext = gl.getExtension("KHR_parallel_shader_compile");
  const v = shader(gl, gl.VERTEX_SHADER, vs);
  const f = shader(gl, gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (ext) {
    while (!gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR)) {
      await new Promise((r) => setTimeout(r, 16));
    }
  }
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = [
      gl.getShaderInfoLog(v),
      gl.getShaderInfoLog(f),
      gl.getProgramInfoLog(p),
    ]
      .filter(Boolean)
      .join("\n");
    throw new Error(`Particle shader failed: ${log}`);
  }
  gl.deleteShader(v);
  gl.deleteShader(f);
  return p;
}

/** Upload every uniform. ~25 calls a frame; cheaper than tracking dirtiness. */
export function upload(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  uniforms: Uniforms,
  locations: Map<string, WebGLUniformLocation | null>,
) {
  for (const name in uniforms) {
    let loc = locations.get(name);
    if (loc === undefined) {
      loc = gl.getUniformLocation(prog, name);
      locations.set(name, loc);
    }
    if (loc === null) continue;
    const u = uniforms[name];
    switch (u.type) {
      case "f":
        gl.uniform1f(loc, u.value);
        break;
      case "i":
        gl.uniform1i(loc, u.value);
        break;
      case "v2":
        gl.uniform2f(loc, u.value[0], u.value[1]);
        break;
      case "v3":
        gl.uniform3f(loc, u.value[0], u.value[1], u.value[2]);
        break;
      case "t":
        gl.activeTexture(gl.TEXTURE0 + u.unit);
        gl.bindTexture(gl.TEXTURE_2D, u.value);
        gl.uniform1i(loc, u.unit);
        break;
    }
  }
}

/** A w×h RGBA texture read with texelFetch: float (positions) or bytes (colour). */
export function texture(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  data: Float32Array | Uint8Array,
) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  fill(gl, t, w, h, data);
  return t;
}

export function fill(
  gl: WebGL2RenderingContext,
  t: WebGLTexture,
  w: number,
  h: number,
  data: Float32Array | Uint8Array,
) {
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  if (data instanceof Float32Array) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      w,
      h,
      0,
      gl.RGBA,
      gl.FLOAT,
      data,
    );
  } else {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data,
    );
  }
}
