/**
 * The particle shader. One draw call for the whole stage, GLSL ES 3.00.
 *
 * There are no vertex attributes at all: particle i is `gl_VertexID`, which
 * addresses its texel in the shape textures (position, colour) and seeds its
 * random numbers. Every particle reads where it is in shape A and in shape B and
 * blends between them by `uMix`, so swapping which shapes A and B are is a
 * uniform change — nothing is re-uploaded while scrolling.
 */

// Simplex noise, 3D — Ian McEwan / Ashima Arts (MIT). Used for the drift, the
// mid-morph swirl and the scroll turbulence.
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 snoise3(vec3 p){
  return vec3(snoise(p),snoise(p+vec3(31.4,-17.2,9.1)),snoise(p+vec3(-7.7,23.3,-41.9)));
}
`;

export const vertexShader = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D uPosA;
uniform highp sampler2D uPosB;
uniform highp sampler2D uColA;
uniform highp sampler2D uColB;
uniform int uTexW;
uniform float uFocal;    // 1 / tan(fov / 2)
uniform float uAspect;
uniform vec3 uCenterA;
uniform vec3 uCenterB;
uniform float uModeA;
uniform float uModeB;
uniform float uSizeA;
uniform float uSizeB;
uniform float uPulseA;
uniform float uPulseB;
uniform float uMix;
uniform float uTime;
uniform float uIntro;
uniform float uTurb;
uniform float uDpr;
uniform float uCamZ;
uniform float uMotion;   // 0 under reduced motion: no drift, swirl or cursor
uniform vec2 uMouse;     // stage px
uniform float uMouseR;   // radius of the push, px
uniform float uMouseF;   // 0–1, rises while the pointer moves

out vec4 vCol;
out float vGlow;

// Four stable random numbers per particle, from its index.
vec4 hash4(uint n){
  uvec4 v = uvec4(n) * uvec4(1664525u, 22695477u, 134775813u, 1103515245u) + uvec4(1013904223u, 1u, 12345u, 2531011u);
  v ^= v >> 16u; v *= 0x7feb352du; v ^= v >> 15u; v *= 0x846ca68bu; v ^= v >> 16u;
  return vec4(v) / 4294967295.0;
}

${SNOISE}

mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s, 0.,1.,0., s,0.,c);}
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);}

// Per-shape idle motion. Applied in the shape's own space, before its centre.
vec3 animate(vec3 p, float mode, float t){
  if (mode > 0.5 && mode < 1.5) {
    // spin — the knot turns slowly and nods.
    p = rotX(0.5 + sin(t * 0.13) * 0.18) * rotY(t * 0.16) * p;
    p += snoise3(p * 0.006 + t * 0.12) * 6.0 * uMotion;
  } else if (mode > 1.5 && mode < 2.5) {
    // drift — free particles churn on a noise field: restless, never settled.
    p += snoise3(p * 0.0024 + vec3(0., 0., t * 0.11)) * 150.0 * uMotion;
  } else if (mode > 2.5) {
    // swell — the sea.
    float sea = step(p.z, 200.) * step(-3600., p.z) * step(p.y, -10.);
    p.y += sea * (sin(p.x * 0.0045 + t * 0.7) * 10.0
         + sin(p.z * 0.006 - t * 0.9) * 14.0
         + snoise(vec3(p.xz * 0.002, t * 0.15)) * 16.0) * uMotion;
  }
  return p;
}

float pulse(float flow, float strength, float t){
  if (flow < 0.0 || strength <= 0.0) return 0.0;
  float id = floor(flow);
  float along = fract(flow);
  float head = fract(t * 0.32 + id * 0.377);
  float d = along - head;
  d = d - floor(d + 0.5);                  // wrap to [-0.5, 0.5]
  // A bright head with a short tail behind it.
  float tail = (1.0 - clamp(-d / 0.11, 0.0, 1.0)) * step(d, 0.0);
  float front = (1.0 - clamp(d / 0.012, 0.0, 1.0)) * step(0.0, d) * step(d, 0.012);
  float g = max(tail * tail, front);
  return g * strength;
}

void main(){
  ivec2 ref = ivec2(gl_VertexID % uTexW, gl_VertexID / uTexW);
  vec4 aRand = hash4(uint(gl_VertexID));
  vec4 a = texelFetch(uPosA, ref, 0);
  vec4 b = texelFetch(uPosB, ref, 0);
  vec4 ca = texelFetch(uColA, ref, 0);
  vec4 cb = texelFetch(uColB, ref, 0);

  // Staggered ease: each particle starts its trip at its own moment, so a morph
  // reads as a flock turning rather than a crossfade.
  float S = 0.65;
  float e = clamp(uMix * (1.0 + S) - aRand.x * S, 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e);
  if (uMotion < 0.5) e = step(0.5, uMix);

  vec3 pa = animate(a.xyz, uModeA, uTime) + uCenterA;
  vec3 pb = animate(b.xyz, uModeB, uTime) + uCenterB;
  vec3 p = mix(pa, pb, e);

  // En route, particles swirl — the arc is what makes a morph feel physical.
  float arc = sin(e * 3.14159) * uMotion;
  if (arc > 0.001) {
    p += snoise3(p * 0.003 + aRand.yzw * 4.0 + uTime * 0.05) * arc * (90.0 + 160.0 * aRand.y);
  }

  // Scroll speed stirs everything up a little.
  if (uTurb > 0.01) p += snoise3(p * 0.004 + uTime * 0.3) * uTurb * 46.0 * uMotion;

  // Intro: particles leave a single point and find their place.
  float ie = clamp(uIntro * 1.7 - aRand.w * 0.7, 0.0, 1.0);
  ie = 1.0 - pow(1.0 - ie, 3.0);
  p = mix(vec3(aRand.yz - 0.5, 0.0) * 6.0, p, ie);

  // The cursor parts the particles.
  vec2 d = p.xy - uMouse;
  float dist = length(d);
  float push = exp(-(dist * dist) / (uMouseR * uMouseR)) * uMouseF * uMotion;
  p.xy += (dist > 0.001 ? d / dist : vec2(0.0)) * push * uMouseR * 0.55;
  p.z += push * 60.0;

  // Camera at (0, 0, uCamZ) looking down -z; 1 unit at z = 0 is 1 CSS px.
  vec3 mv = vec3(p.xy, p.z - uCamZ);
  const float near = 1.0;
  const float far = 12000.0;
  gl_Position = vec4(
    mv.x * uFocal / uAspect,
    mv.y * uFocal,
    mv.z * (far + near) / (near - far) + 2.0 * far * near / (near - far),
    -mv.z
  );

  float glow = max(pulse(a.w, uPulseA, uTime) * (1.0 - e), pulse(b.w, uPulseB, uTime) * e);
  float size = mix(uSizeA, uSizeB, e) * (1.0 + glow * 1.4) * (0.85 + aRand.z * 0.3);
  gl_PointSize = size * uDpr * (uCamZ / -mv.z);

  vec4 col = mix(ca, cb, e);
  col.rgb = mix(col.rgb, vec3(1.0, 0.29, 0.11), glow);
  col.a = max(col.a, glow) * ie;
  col.a *= 1.0 + push * 0.6;
  vCol = col;
  vGlow = glow;
}
`;

export const fragmentShader = /* glsl */ `#version 300 es
precision mediump float;
uniform float uOpacity;
in vec4 vCol;
in float vGlow;
out vec4 outColor;

void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = 1.0 - smoothstep(0.32, 0.5, d);
  // A soft halo on pulsing particles.
  a += vGlow * (1.0 - smoothstep(0.0, 0.5, d)) * 0.5;
  float alpha = a * vCol.a * uOpacity;
  if (alpha < 0.01) discard;
  outColor = vec4(vCol.rgb * alpha, alpha);
}
`;
