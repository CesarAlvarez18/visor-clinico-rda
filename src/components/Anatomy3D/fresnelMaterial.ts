import { AdditiveBlending, Color, FrontSide, ShaderMaterial } from 'three'

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fresnel: 0 donde la superficie mira a la cámara, 1 en el borde de la silueta.
// uPower afina el contorno; uIntensity lo lleva por encima de 1.0 (HDR) para
// que supere el luminanceThreshold del Bloom.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uCoreOpacity;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vViewDir)));
    float fresnel = pow(1.0 - facing, uPower);
    vec3 color = uColor * (uCoreOpacity + fresnel * uIntensity);
    float alpha = clamp(uCoreOpacity + fresnel, 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`

export interface FresnelOptions {
  color: string
  power: number
  intensity: number
  coreOpacity: number
  opacity: number
}

export function createFresnelMaterial({ color, power, intensity, coreOpacity, opacity }: FresnelOptions): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new Color(color) },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uCoreOpacity: { value: coreOpacity },
      uOpacity: { value: opacity },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: FrontSide,
    toneMapped: false,
  })
}
