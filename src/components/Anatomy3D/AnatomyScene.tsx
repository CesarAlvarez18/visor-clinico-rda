import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Box3, Group, MathUtils, Vector3, type Object3D, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { BodySystemId } from '../../rules/config/bodySystems'
import type { BodyState } from '../../rules/types'
import { computeSystemAnchors } from './anchors'
import { AnatomyModel } from './AnatomyModel'
import { buildProceduralAnatomy } from './proceduralAnatomy'
import { SystemLabels } from './SystemLabels'

export const MODEL_URL = '/models/anatomy.glb'
const FIGURE_HEIGHT = 1.77
const BACKGROUND = '#020626'
// Encuadre frontal de cuerpo completo, con margen.
const TARGET: [number, number, number] = [0, 0.95, 0]
const FRAME_WIDTH = 1.2
const FRAME_HEIGHT = 2.05

const isCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

/** Lleva cualquier fuente (GLB o procedural) a la escala de la escena: estatura fija, pies en y = 0, centrado. */
function normalizeModel(scene: Object3D): Group {
  const wrapper = new Group()
  const box = new Box3().setFromObject(scene)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const scale = FIGURE_HEIGHT / (size.y || 1)
  scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
  scene.scale.setScalar(scale)
  wrapper.add(scene)
  return wrapper
}

/**
 * Encuadre frontal de cuerpo completo, recalculado con el aspecto del
 * lienzo y reaplicado cuando cambia `resetSignal` ("Vista frontal", CA-17).
 * Fija la cámara y el objetivo de los controles directamente en vez de
 * depender de `OrbitControls.reset()`, que puede guardar el estado inicial
 * antes de que este ajuste corra y volver a un encuadre incorrecto.
 */
function CameraRig({ resetSignal, controlsRef }: { resetSignal?: number; controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((state) => state.camera as PerspectiveCamera)
  const aspect = useThree((state) => state.size.width / state.size.height)

  const applyFrontalView = useCallback(() => {
    const halfFov = Math.tan(MathUtils.degToRad(camera.fov / 2))
    const distance = Math.max(FRAME_HEIGHT, FRAME_WIDTH / aspect) / (2 * halfFov)
    camera.up.set(0, 1, 0)
    camera.position.set(TARGET[0], TARGET[1], TARGET[2] + distance)
    camera.lookAt(...TARGET)
    camera.updateProjectionMatrix()
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(...TARGET)
      controls.update()
    }
  }, [camera, aspect, controlsRef])

  // Encuadre inicial y cada vez que cambia el aspecto del lienzo. Se aplica
  // una segunda vez en el siguiente cuadro: `OrbitControls` hace su propia
  // inicialización al montarse (después de este efecto, ya que aparece
  // luego en el árbol) y puede pisar la posición de la cámara con la que
  // trae el lienzo por defecto.
  useEffect(() => {
    applyFrontalView()
    const frame = requestAnimationFrame(applyFrontalView)
    return () => cancelAnimationFrame(frame)
  }, [applyFrontalView])

  // "Vista frontal": solo cuando el médico lo pide explícitamente, no en el primer render.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    applyFrontalView()
    // Solo debe reaccionar a un cambio explícito de resetSignal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal])

  return null
}

interface ModelSourceProps {
  bodyState: BodyState
  highlightedId?: BodySystemId
  selectedId?: BodySystemId
  onHover?: (systemId: BodySystemId | undefined, clientX?: number, clientY?: number) => void
  onSelect?: (systemId: BodySystemId) => void
}

/** Modelo más sus rótulos de nivel, con las anclas calculadas una sola vez por fuente. */
function ModelWithLabels({ source, bodyState, ...rest }: ModelSourceProps & { source: Object3D }) {
  const anchors = useMemo(() => computeSystemAnchors(source), [source])
  return (
    <>
      <AnatomyModel source={source} bodyState={bodyState} {...rest} />
      <SystemLabels bodyState={bodyState} anchors={anchors} />
    </>
  )
}

function GltfModel(props: ModelSourceProps) {
  // Meshopt (sin Draco): Drei lo decodifica sin depender de un CDN externo.
  const { scene } = useGLTF(MODEL_URL, false, true)
  const source = useMemo(() => normalizeModel(scene.clone(true)), [scene])
  return <ModelWithLabels source={source} {...props} />
}

function ProceduralModel(props: ModelSourceProps) {
  const source = useMemo(() => normalizeModel(buildProceduralAnatomy()), [])
  return <ModelWithLabels source={source} {...props} />
}

export interface AnatomySceneProps extends ModelSourceProps {
  source: 'model' | 'procedural'
  /** Cambiar este valor (p. ej. incrementar un contador) vuelve al encuadre inicial. */
  resetSignal?: number
}

export function AnatomyScene({ source, resetSignal, ...modelProps }: AnatomySceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const touch = isCoarsePointer()

  return (
    <Canvas
      camera={{ position: [0, 0.95, 3.4], fov: 32, near: 0.1, far: 50 }}
      dpr={touch ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.28} />
      <directionalLight position={[3, 4, 5]} intensity={0.6} color="#cfe8ff" />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#6f8cff" />

      <Suspense fallback={null}>{source === 'model' ? <GltfModel {...modelProps} /> : <ProceduralModel {...modelProps} />}</Suspense>

      <CameraRig resetSignal={resetSignal} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        target={TARGET}
        enablePan={false}
        enableDamping
        minDistance={1.4}
        maxDistance={7}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.7}
      />

      <EffectComposer multisampling={touch ? 0 : 4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={1.8} radius={0.7} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
