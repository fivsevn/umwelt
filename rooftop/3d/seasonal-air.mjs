import { SEASONS, seasonalParticle, seasonalStrength } from "../seasons.mjs";
// Four cached, tiny point buffers. Pixel silhouettes are shader code, never
// image textures. The existing scene depth hides particles behind walls/objects.
export function createSeasonalAir(T, scene, renderer) {
  const viewport = new T.Vector2(), color = new T.Color();
  const groups = SEASONS.map(s => {
    const positions = new Float32Array(s.count * 3);
    const colors = new Float32Array(s.count * 3);
    const sizes = new Float32Array(s.count), kinds = new Float32Array(s.count), angles = new Float32Array(s.count);
    const geometry = new T.BufferGeometry();
    for (const [key, data, size] of [["position",positions,3],["pigment",colors,3],["diameter",sizes,1],["kind",kinds,1],["angle",angles,1]]) {
      geometry.setAttribute(key, new T.BufferAttribute(data, size).setUsage(T.DynamicDrawUsage));
    }
    for (let i = 0; i < s.count; i++) {
      const p = seasonalParticle(s.id, i, 0);
      color.set(p.color); color.toArray(colors, i * 3);
      sizes[i] = p.size; kinds[i] = p.kind;
    }
    const uniforms = { strength: {value: 0}, viewportHeight: {value: 800} };
    const material = new T.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false,
      vertexShader: `attribute vec3 pigment; attribute float diameter; attribute float kind; attribute float angle;
        uniform float viewportHeight; varying vec3 ink; varying float shape; varying float turn;
        void main(){ vec4 eye=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*eye;
        float scale=projectionMatrix[3][3]>.5?.5:1.0/max(1.0,-eye.z);
        gl_PointSize=clamp(diameter*viewportHeight*projectionMatrix[1][1]*scale,1.0,16.0);
        ink=pigment;shape=kind;turn=angle; }`,
      fragmentShader: `uniform float strength; varying vec3 ink; varying float shape; varying float turn;
        void main(){ vec2 q=gl_PointCoord-.5; float c=cos(turn),s=sin(turn); q=mat2(c,-s,s,c)*q;
        vec2 p=floor((q+.5)*7.0)-3.0; vec2 a=abs(p); bool mark;
        if(shape<.5) mark=(a.x<=1.0&&a.y<=2.0)||(a.x<=2.0&&a.y<=1.0);
        else if(shape<1.5) mark=(a.x<1.0&&a.y<=1.0)||(a.x<=2.0&&a.y<1.0);
        else if(shape<2.5) mark=a.x+a.y*.62<2.6;
        else if(shape<3.5) mark=(a.x<=1.0&&a.y<=2.0)||(a.y<=1.0&&a.x<=2.0);
        else mark=a.x+a.y<3.3;
        if(!mark)discard;
        vec3 col=ink; if(shape>1.5&&shape<2.5&&a.x<1.0)col*=.72;
        gl_FragColor=vec4(col,strength*(shape<.5?.62:shape<1.5?.8:.84));
        #include <colorspace_fragment>
        }`,
    });
    const points = new T.Points(geometry, material);
    points.frustumCulled = false; points.visible = false; scene.add(points);
    return {...s, points, geometry, uniforms, positions, colors, sizes, kinds, angles};
  });
  let stats = {};
  return {
    update(name, state, time, reduced) {
      renderer.getDrawingBufferSize(viewport);
      let count = 0; const effects = [];
      for (const g of groups) {
        const strength = name === "room" ? 0 : seasonalStrength(state, g.id);
        g.points.visible = strength > .01;
        if (!g.points.visible) continue;
        g.uniforms.strength.value = strength;
        g.uniforms.viewportHeight.value = viewport.y;
        // South balcony is narrower; particles remain close to its actual roof.
        const spanX = name === "south" ? 12 : 27, spanZ = name === "south" ? 24 : 25;
        for (let i = 0; i < g.count; i++) {
          const p = seasonalParticle(g.id, i, time, state.wind, reduced), j = i * 3;
          g.positions[j] = (p.x - .5) * spanX;
          g.positions[j + 1] = .18 + p.y * (g.id === "summer" ? 10 : 12);
          g.positions[j + 2] = (p.z - .5) * spanZ;
          g.angles[i] = p.angle;
        }
        g.geometry.attributes.position.needsUpdate = true;
        g.geometry.attributes.angle.needsUpdate = true;
        count += g.count; effects.push({season:g.id, effect:g.effect, count:g.count, strength});
      }
      stats = { season: state.season, count, effects, sample: groups.filter(g=>g.points.visible).map(g=>Array.from(g.positions.slice(0,6))) };
    },
    get stats() { return stats; },
  };
}
