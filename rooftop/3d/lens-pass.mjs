export const SCOPE_LENS_STRENGTH = .008;

export function lensWarpNdc(point, aspect = 1, strength = SCOPE_LENS_STRENGTH) {
  const radius2 = (point[0] * aspect) ** 2 + point[1] ** 2, scale = 1 + strength * radius2;
  return [point[0] * scale, point[1] * scale];
}

export function lensUnwarpNdc(point, aspect = 1, strength = SCOPE_LENS_STRENGTH) {
  const distance = Math.hypot(point[0] * aspect, point[1]);
  if (!distance) return [0, 0];
  let radius = distance;
  for (let i = 0; i < 5; i++) radius -= (radius + strength * radius ** 3 - distance) / (1 + 3 * strength * radius ** 2);
  return point.map(value => value * radius / distance);
}

export function createScopeLensPass(T, renderer) {
  let target, scene, camera, material;
  return {
    render(world, viewCamera, width, height) {
      if (!target) {
        target = new T.WebGLRenderTarget(width, height, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true });
        target.texture.colorSpace = T.LinearSRGBColorSpace;
        material = new T.ShaderMaterial({
          uniforms: { lensSource: { value: target.texture }, lensAspect: { value: width / height }, lensStrength: { value: SCOPE_LENS_STRENGTH } },
          depthTest: false, depthWrite: false, toneMapped: false,
          vertexShader: "varying vec2 lensUv; void main(){lensUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
          fragmentShader: `uniform sampler2D lensSource; uniform float lensAspect; uniform float lensStrength; varying vec2 lensUv;
            void main(){vec2 p=lensUv*2.-1.;vec2 radial=p*vec2(lensAspect,1.);vec2 q=p*(1.+lensStrength*dot(radial,radial));
              gl_FragColor=texture2D(lensSource,clamp(q*.5+.5,0.,1.));
              #include <colorspace_fragment>
            }`,
        });
        scene = new T.Scene(); camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), material));
      }
      if (target.width !== width || target.height !== height) target.setSize(width, height);
      material.uniforms.lensAspect.value = width / height;
      const previous = renderer.getRenderTarget(), autoReset = renderer.info.autoReset;
      renderer.info.autoReset = false;
      renderer.info.reset();
      try {
        renderer.setRenderTarget(target); renderer.render(world, viewCamera);
        renderer.setRenderTarget(previous); renderer.render(scene, camera);
      } finally {
        renderer.setRenderTarget(previous); renderer.info.autoReset = autoReset;
      }
    },
    get stats() { return { strength: SCOPE_LENS_STRENGTH, buffer: target ? [target.width, target.height] : null, passes: target ? 1 : 0 }; },
  };
}
