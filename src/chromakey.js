/**
 * Chroma Key Shader — A-Frame Custom Material
 * Phase 3, Feature A: Green Screen Hologram for Target 1 (Uncle Memorial)
 *
 * Pipeline (in order):
 *   1. Sample video texture (with fallback 1x1 texture to prevent WebGL crash before video frames arrive)
 *   2. Chroma key: distance from keyColor (#00FF00) → compute alpha with smoothstep
 *   3. Green Despill: color.g = min(color.g, max(color.r, color.b))
 *   4. Fresnel Rim Glow: cyan/gold emission at silhouette edges
 *   5. Output: discard pixels where alpha < 0.05
 */

export function registerChromakeyShader() {
  const AF = typeof AFRAME !== 'undefined' ? AFRAME : (typeof window !== 'undefined' ? window.AFRAME : null);
  if (!AF || !AF.registerShader) return;
  if (AF.shaders && AF.shaders.chromakey) return;

  AF.registerShader('chromakey', {
    schema: {
      src:            { type: 'map',   is: 'uniform' },
      keyColor:       { type: 'color', is: 'uniform', default: '#00FF00' },
      colorThreshold: { type: 'float', is: 'uniform', default: 0.4 },
      smoothness:     { type: 'float', is: 'uniform', default: 0.08 },
      rimStrength:    { type: 'float', is: 'uniform', default: 0.35 },
    },

    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv       = uv;
        vNormal   = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir  = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,

    fragmentShader: /* glsl */`
      uniform sampler2D src;
      uniform vec3  keyColor;
      uniform float colorThreshold;
      uniform float smoothness;
      uniform float rimStrength;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        // 1. Sample video texture
        vec4 texColor = texture2D(src, vUv);
        vec3 color    = texColor.rgb;

        // 2. Chroma key — distance from key color in RGB space
        float dist  = distance(color, keyColor);
        float alpha = smoothstep(
          colorThreshold - smoothness,
          colorThreshold + smoothness,
          dist
        );

        // Discard near-transparent pixels early (saves fill-rate on iOS)
        if (alpha < 0.05) discard;

        // 3. Green Despill — kills residual green halo on edges
        color.g = min(color.g, max(color.r, color.b));

        // 4. Fresnel Rim Glow
        float rimFactor = 1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0);
        rimFactor = pow(rimFactor, 2.5);

        vec3 cyanColor = vec3(0.0,  0.898, 1.0);
        vec3 goldColor = vec3(1.0,  0.8,   0.267);
        vec3 rimColor  = mix(cyanColor, goldColor, step(0.5, vUv.y));

        vec3 rimEmission = rimColor * rimFactor * rimStrength;

        // 5. Final composite
        gl_FragColor = vec4(color + rimEmission, alpha);
      }
    `,

    init(data) {
      const THREE = AF.THREE || window.THREE;
      // Fallback 1x1 transparent texture prevents WebGL INVALID_OPERATION / context loss
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 2;
      fallbackCanvas.height = 2;
      const defaultTexture = new THREE.CanvasTexture(fallbackCanvas);

      let initialTexture = defaultTexture;
      if (data.src && data.src.isTexture) {
        initialTexture = data.src;
      } else if (data.src && data.src.tagName === 'VIDEO') {
        initialTexture = new THREE.VideoTexture(data.src);
        initialTexture.minFilter = THREE.LinearFilter;
        initialTexture.magFilter = THREE.LinearFilter;
      }

      this.material = new THREE.ShaderMaterial({
        uniforms: {
          src:            { value: initialTexture },
          keyColor:       { value: new THREE.Color(data.keyColor) },
          colorThreshold: { value: data.colorThreshold },
          smoothness:     { value: data.smoothness },
          rimStrength:    { value: data.rimStrength },
        },
        vertexShader:   this.vertexShader,
        fragmentShader: this.fragmentShader,
        transparent:    true,
        side:           THREE.DoubleSide,
        depthWrite:     false,
      });

      return this.material;
    },

    update(data) {
      if (!this.material) return;
      const THREE = AF.THREE || window.THREE;

      if (data.src) {
        if (data.src.isTexture) {
          this.material.uniforms.src.value = data.src;
        } else if (data.src.tagName === 'VIDEO') {
          const videoTex = new THREE.VideoTexture(data.src);
          videoTex.minFilter = THREE.LinearFilter;
          videoTex.magFilter = THREE.LinearFilter;
          this.material.uniforms.src.value = videoTex;
        }
      }
      if (data.keyColor) this.material.uniforms.keyColor.value.set(data.keyColor);
      if (typeof data.colorThreshold === 'number') this.material.uniforms.colorThreshold.value = data.colorThreshold;
      if (typeof data.smoothness === 'number') this.material.uniforms.smoothness.value = data.smoothness;
      if (typeof data.rimStrength === 'number') this.material.uniforms.rimStrength.value = data.rimStrength;
    },
  });
}

// Auto-register immediately if AFRAME is available, or when it loads
if (typeof AFRAME !== 'undefined') {
  registerChromakeyShader();
} else if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', registerChromakeyShader);
  window.addEventListener('load', registerChromakeyShader);
}
