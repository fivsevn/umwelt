import { lensWarpNdc, SCOPE_LENS_STRENGTH } from "./lens-pass.mjs";
import { resolvePixelGrid, pixelGridBufferSize, pixelGridSize } from "./pixel-grid.mjs";

export function outdoorRasterSize(width, height, grid = resolvePixelGrid()) {
  return pixelGridBufferSize(width, height, grid);
}

export function rasterCellCentre(point, grid = resolvePixelGrid(), width, height) {
  if (width && height) {
    const size = pixelGridSize(width, height, grid);
    return point.map((value, axis) =>
      (Math.floor(value / [width, height][axis] * size.output[axis] / grid.pixelStep) + .5) * grid.pixelStep / size.output[axis] * [width, height][axis]);
  }
  return point.map(value => (Math.floor(value / grid.cssPixelStep) + .5) * grid.cssPixelStep);
}

export function outdoorSampleNdc(point, width, height, lens = false, grid = resolvePixelGrid()) {
  const size = pixelGridSize(width, height, grid),
    centre = point.map((value, axis) => (Math.floor(value / [width, height][axis] * size.output[axis] / grid.pixelStep) + .5) * grid.pixelStep),
    ndc = [centre[0] / size.output[0] * 2 - 1, 1 - centre[1] / size.output[1] * 2];
  if (!lens) return ndc;
  const warped = lensWarpNdc(ndc, size.output[0] / size.output[1]).map(value => Math.max(-1, Math.min(1, value))),
    sourcePoint = [(warped[0] * .5 + .5) * size.output[0], (.5 - warped[1] * .5) * size.output[1]],
    sourceCentre = sourcePoint.map((value, axis) =>
      (Math.max(0, Math.min(size.source[axis] - 1, Math.floor(value / grid.pixelStep))) + .5) * grid.pixelStep);
  // The lens samples the nearest offscreen pixel after warping as well.
  return [sourceCentre[0] / size.output[0] * 2 - 1, 1 - sourceCentre[1] / size.output[1] * 2];
}

// Add only the incomplete right/bottom display cells to the offscreen frustum.
// Camera pose, FOV, logical aspect and every complete screen pixel stay fixed.
export function paddedRasterProjection(T, projection, size) {
  const sx = size.output[0] / size.padded[0], sy = size.output[1] / size.padded[1];
  return new T.Matrix4().set(sx, 0, 0, sx - 1, 0, sy, 0, 1 - sy, 0, 0, 1, 0, 0, 0, 0, 1).multiply(projection);
}

export function createOutdoorRasterPass(T, renderer) {
  let target, scene, camera, material, geometry, size = null, lens = false;
  const canvas = renderer.domElement;
  function release() {
    target?.dispose(); material?.dispose(); geometry?.dispose();
    target = scene = camera = material = geometry = null;
  }
  const restore = () => { renderer.shadowMap.needsUpdate = true; };
  // Three restores its WebGL state; lazily recreate this pass's GPU resources.
  canvas?.addEventListener?.("webglcontextlost", release);
  canvas?.addEventListener?.("webglcontextrestored", restore);
  return {
    render(world, viewCamera, width, height, scope = false, grid = resolvePixelGrid()) {
      size = outdoorRasterSize(width, height, grid); lens = scope;
      if (!target) {
        target = new T.WebGLRenderTarget(...size.source, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true });
        target.texture.generateMipmaps = false;
        target.texture.colorSpace = T.LinearSRGBColorSpace;
        material = new T.ShaderMaterial({
          uniforms: {
            rasterSource: { value: target.texture }, rasterOutput: { value: new T.Vector2(...size.output) },
            rasterPadded: { value: new T.Vector2(...size.padded) }, rasterStep: { value: grid.pixelStep },
            rasterLens: { value: 0 },
          },
          depthTest: false, depthWrite: false, toneMapped: false,
          vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
          fragmentShader: `
            uniform sampler2D rasterSource; uniform vec2 rasterOutput; uniform vec2 rasterPadded;
            uniform float rasterStep; uniform float rasterLens;
            void main(){
              vec2 topPixel = vec2(gl_FragCoord.x, rasterOutput.y - gl_FragCoord.y);
              vec2 centre = (floor(topPixel / rasterStep) + .5) * rasterStep;
              vec2 p = vec2(centre.x / rasterOutput.x * 2. - 1., 1. - centre.y / rasterOutput.y * 2.);
              if (rasterLens > 0.) {
                vec2 radial = p * vec2(rasterOutput.x / rasterOutput.y, 1.);
                p = clamp(p * (1. + rasterLens * dot(radial, radial)), -1., 1.);
              }
              vec2 sourceUv = vec2((p.x * .5 + .5) * rasterOutput.x / rasterPadded.x,
                1. - (.5 - p.y * .5) * rasterOutput.y / rasterPadded.y);
              gl_FragColor = texture2D(rasterSource, sourceUv);
              #include <colorspace_fragment>
              // Work on display colour after its single linear-to-sRGB
              // conversion. Keep black, bright lamps and already vivid
              // colours stable; gently separate the painted midtones.
              vec3 ink = gl_FragColor.rgb;
              float value = dot(ink, vec3(.2126, .7152, .0722));
              float middle = smoothstep(.06, .22, value) * (1. - smoothstep(.82, 1., value));
              float chroma = max(max(ink.r, ink.g), ink.b) - min(min(ink.r, ink.g), ink.b);
              ink = mix(vec3(value), ink, 1. + .24 * (1. - chroma) * middle);
              float shaped = value + .16 * (value - .42) * 4. * value * (1. - value) * middle;
              gl_FragColor.rgb = clamp(ink * (shaped / max(value, .00001)), 0., 1.);
            }`,
        });
        scene = new T.Scene(); camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        geometry = new T.PlaneGeometry(2, 2);
        scene.add(new T.Mesh(geometry, material));
      }
      if (target.width !== size.source[0] || target.height !== size.source[1]) target.setSize(...size.source);
      material.uniforms.rasterOutput.value.set(...size.output);
      material.uniforms.rasterPadded.value.set(...size.padded);
      material.uniforms.rasterStep.value = grid.pixelStep;
      material.uniforms.rasterLens.value = scope ? SCOPE_LENS_STRENGTH : 0;
      const previous = renderer.getRenderTarget(), autoReset = renderer.info.autoReset,
        projection = viewCamera.projectionMatrix.clone(), inverse = viewCamera.projectionMatrixInverse.clone();
      renderer.info.autoReset = false; renderer.info.reset();
      try {
        viewCamera.projectionMatrix.copy(paddedRasterProjection(T, projection, size));
        viewCamera.projectionMatrixInverse.copy(viewCamera.projectionMatrix).invert();
        renderer.setRenderTarget(target); renderer.render(world, viewCamera);
        // Restore before presenting: hit rays and DOM overlays use the original
        // logical camera, with only their sample point aligned to the display grid.
        viewCamera.projectionMatrix.copy(projection); viewCamera.projectionMatrixInverse.copy(inverse);
        renderer.setRenderTarget(previous); renderer.render(scene, camera);
      } finally {
        viewCamera.projectionMatrix.copy(projection); viewCamera.projectionMatrixInverse.copy(inverse);
        renderer.setRenderTarget(previous); renderer.info.autoReset = autoReset;
      }
    },
    dispose() {
      release(); canvas?.removeEventListener?.("webglcontextlost", release);
      canvas?.removeEventListener?.("webglcontextrestored", restore);
    },
    get stats() {
      const grid = size || resolvePixelGrid();
      return { pixelStep: grid.pixelStep, cssPixelStep: grid.cssPixelStep, pixelRatio: grid.pixelRatio, targetCssPixelStep: grid.targetCssPixelStep,
        sourceBuffer: target ? [target.width, target.height] : null, outputBuffer: size?.output.slice() || null,
        passes: target ? 1 : 0, clippedEdge: "right/bottom incomplete cells", lens: lens ? SCOPE_LENS_STRENGTH : 0 };
    },
    get lensStats() { return { strength: SCOPE_LENS_STRENGTH, buffer: target ? [target.width, target.height] : null, passes: target && lens ? 1 : 0 }; },
  };
}
