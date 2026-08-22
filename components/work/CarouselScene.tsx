/* eslint-disable react-hooks/immutability --
 * Every violation in this file is the same one, and it is the point of the file:
 * react-three-fiber's objects are GPU handles, not React values. Configuring a
 * texture's anisotropy after it loads, placing the camera, and writing shader
 * uniforms sixty times a second are all mutations of things `useLoader`,
 * `useThree` and `useMemo` handed back — and none of them can be lifted into the
 * hook that made them, because the values they're set to only exist per frame.
 * Nothing here feeds a render: the mutations go to WebGL, and this component's
 * output (one mesh per plate) is unaffected by any of them.
 */
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_FOV,
  cameraDistance,
  coverScale,
  LIQUID_SEGMENTS,
  liquidFragmentShader,
  liquidVertexShader,
  parseHexRgb,
  RING,
  smoothstep,
  wrapSigned,
  type TrackLayout,
} from "@/lib/gl/liquid";
import type { TrackState } from "@/lib/gl/track";
import { CAROUSEL, VELOCITY } from "@/lib/tokens";

/** Paper, if the CSS custom property can't be read. */
const PAPER_FALLBACK = [0.957, 0.945, 0.918] as const;

type CarouselSceneProps = {
  sources: readonly string[];
  layout: TrackLayout;
  track: React.RefObject<TrackState>;
  /** Hands the root's `advance` up to the physics tick, which owns the frame. */
  bindAdvance: (advance: ((time: number) => void) | null) => void;
};

/**
 * The WebGL half of the liquid carousel.
 *
 * It renders nothing but the cover plates: one subdivided plane each, deformed by
 * the shared track velocity. Everything a person reads — title, index, category —
 * is DOM text in the overlay above (plan §7, rule 1), and every position in here
 * is in CSS pixels so the two layers stay locked together.
 *
 * This root runs with `frameloop="never"`. It draws only when the physics tick
 * calls the `advance` it publishes through `bindAdvance`, which keeps the whole
 * site on the one GSAP ticker that already drives Lenis and the velocity store.
 */
export default function CarouselScene({
  sources,
  layout,
  track,
  bindAdvance,
}: CarouselSceneProps) {
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const advance = useThree((state) => state.advance);

  const urls = useMemo(() => [...sources], [sources]);
  const textures = useLoader(THREE.TextureLoader, urls);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const paper = useMemo(() => {
    const declared = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--paper");
    return parseHexRgb(declared, PAPER_FALLBACK);
  }, []);

  // One geometry for every plate: a unit plane, scaled to pixel size per frame.
  // Subdivided mostly along x, because that's the axis the bow travels down.
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1, 1, LIQUID_SEGMENTS.x, LIQUID_SEGMENTS.y),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy();
    for (const texture of textures) texture.anisotropy = anisotropy;
  }, [textures, gl]);

  // A material per *plate*, not per slide: on a wide display the same cover
  // appears more than once around the ring, and each of those copies needs its
  // own hover and edge-fade values.
  const materials = useMemo(
    () =>
      layout.plates.map((slide) => {
        const texture = textures[slide];
        const image = texture.image as { width: number; height: number };
        const cover = coverScale(
          CAROUSEL.aspect,
          image.width / image.height || CAROUSEL.aspect,
        );

        return new THREE.ShaderMaterial({
          vertexShader: liquidVertexShader,
          fragmentShader: liquidFragmentShader,
          transparent: true,
          // A hard bow can turn the outer plates far enough to show their backs.
          side: THREE.DoubleSide,
          uniforms: {
            uTexture: { value: texture },
            uCover: { value: new THREE.Vector2(cover[0], cover[1]) },
            uPaper: { value: new THREE.Vector3(paper[0], paper[1], paper[2]) },
            uVelocity: { value: 0 },
            uBend: { value: CAROUSEL.bend },
            uSplit: { value: CAROUSEL.split },
            uHover: { value: 0 },
            uLift: { value: RING.lift },
            uPresence: { value: RING.presence },
            uOpacity: { value: 1 },
          },
        });
      }),
    [layout.plates, textures, paper],
  );

  useEffect(
    () => () => {
      for (const material of materials) material.dispose();
    },
    [materials],
  );

  // 1 unit = 1 px at z = 0. R3F owns the aspect and the projection matrix; the
  // distance is ours, and it has to be redone whenever the canvas resizes.
  useLayoutEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = CAMERA_FOV;
    perspective.position.set(0, 0, cameraDistance(size.height));
    perspective.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
  }, [camera, size.height]);

  useLayoutEffect(() => {
    bindAdvance((time) => advance(time, false));
    return () => bindAdvance(null);
  }, [advance, bindAdvance]);

  useFrame(() => {
    const state = track.current;
    if (!state) return;

    const { width, height, pitch, span } = layout;

    // Signed and normalised on the shared store's scale — so a flick here bends
    // the plates by the same amount it skews the DOM rows below.
    const velocity = Math.max(
      -1,
      Math.min(1, state.velocity / VELOCITY.norm.carousel),
    );

    // How far from centre a plate can be before it's off the board.
    const reach = size.width / 2 + width / 2;

    for (let i = 0; i < layout.plates.length; i++) {
      const mesh = meshes.current[i];
      const material = materials[i];
      if (!mesh || !material) continue;

      const x = wrapSigned(i * pitch - state.offset, span);
      const away = Math.abs(x / reach);
      const hover = state.hoverEase[i] ?? 0;

      mesh.position.set(
        x,
        away * RING.arc,
        -away * RING.depth + hover * RING.lift,
      );
      mesh.rotation.y = (-x / reach) * RING.turn;
      mesh.scale.set(width, height, 1);

      material.uniforms.uVelocity.value = velocity;
      material.uniforms.uHover.value = hover;
      // Dissolve past the edges rather than clip: the plate that's leaving fades
      // out instead of being cut off by the canvas.
      material.uniforms.uOpacity.value =
        1 - smoothstep(RING.fade[0], RING.fade[1], away);
    }
  });

  return (
    <>
      {layout.plates.map((slide, i) => (
        <mesh
          key={`${slide}-${i}`}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          geometry={geometry}
          material={materials[i]}
          // Nothing in here is a pointer target — hover comes from the DOM
          // overlay, which needs no raycast and can't fall out of sync with it.
          raycast={() => null}
        />
      ))}
    </>
  );
}
