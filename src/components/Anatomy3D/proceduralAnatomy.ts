import {
  CapsuleGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from 'three'

// Anatomía de marcador de posición hecha con primitivas, para poder construir
// y probar la conexión al RDA mientras no exista public/models/anatomy.glb.
// Usa el mismo contrato de nombres que se espera del GLB real: un grupo
// `skin`, un grupo `skeleton` (todo el esqueleto salvo los huesos largos de
// brazos y piernas) y un grupo `system:<id>` por cada sistema con estructura
// propia (ver classifyMesh.ts). Así la conexión al RDA se construye y prueba
// antes de tener el modelo real.
// Medidas en metros, pies en y = 0, estatura ≈ 1.77. No es anatómicamente exacta.

type Point = [x: number, y: number, z: number]

const UP = new Vector3(0, 1, 0)

function mesh(name: string, geometry: BufferGeometry, position: Point = [0, 0, 0], scale: Point = [1, 1, 1]): Mesh {
  const result = new Mesh(geometry)
  result.name = name
  result.position.set(...position)
  result.scale.set(...scale)
  return result
}

/** Cápsula orientada de `from` a `to`. */
function segment(name: string, from: Point, to: Point, radius: number): Mesh {
  const start = new Vector3(...from)
  const direction = new Vector3(...to).sub(start)
  const result = new Mesh(new CapsuleGeometry(radius, direction.length(), 6, 16))
  result.name = name
  result.position.copy(start).addScaledVector(direction, 0.5)
  result.quaternion.setFromUnitVectors(UP, direction.clone().normalize())
  return result
}

function tube(name: string, points: Point[], radius: number): Mesh {
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)))
  return mesh(name, new TubeGeometry(curve, points.length * 12, radius, 8))
}

const mirror = ([x, y, z]: Point): Point => [-x, y, z]

/** Construye un grupo con nombre y agrega la pieza y su espejo respecto al plano sagital. */
function pairedGroup(name: string, build: (side: 'l' | 'r', flip: (point: Point) => Point) => Mesh[]): Group {
  const group = new Group()
  group.name = name
  group.add(...build('l', (point) => point), ...build('r', mirror))
  return group
}

function namedGroup(name: string, ...children: (Mesh | Group)[]): Group {
  const group = new Group()
  group.name = name
  group.add(...children)
  return group
}

// Articulaciones del lado izquierdo del cuerpo (x positivo).
const SHOULDER: Point = [0.2, 1.4, 0]
const ELBOW: Point = [0.27, 1.1, 0]
const WRIST: Point = [0.3, 0.84, 0.03]
const HAND: Point = [0.31, 0.75, 0.04]
const HIP: Point = [0.09, 0.9, 0]
const KNEE: Point = [0.1, 0.5, 0]
const ANKLE: Point = [0.1, 0.08, 0]
const TOE: Point = [0.1, 0.03, 0.15]

function buildSkin(): Group {
  const skin = new Group()
  skin.name = 'skin'
  // Cabeza, cuello y tronco como un solo sólido de revolución, aplanado en Z.
  const profile: [radius: number, y: number][] = [
    [0, 0.83], [0.12, 0.86], [0.172, 0.95], [0.15, 1.08], [0.168, 1.24], [0.18, 1.36], [0.14, 1.45],
    [0.058, 1.5], [0.052, 1.56], [0.084, 1.6], [0.1, 1.68], [0.086, 1.74], [0, 1.77],
  ]
  const trunk = new LatheGeometry(new CatmullRomCurve3(profile.map(([r, y]) => new Vector3(r, y, 0))).getPoints(64).map((p) => new Vector2(Math.max(p.x, 0), p.y)), 48)
  skin.add(mesh('skin_trunk', trunk, [0, 0, 0], [1, 1, 0.62]))
  const limbs = pairedGroup('skin_limbs', (side, flip) => [
    mesh(`skin_shoulder_${side}`, new SphereGeometry(0.06, 24, 16), flip(SHOULDER)),
    segment(`skin_upper_arm_${side}`, flip(SHOULDER), flip(ELBOW), 0.043),
    segment(`skin_forearm_${side}`, flip(ELBOW), flip(WRIST), 0.034),
    segment(`skin_hand_${side}`, flip(WRIST), flip(HAND), 0.032),
    segment(`skin_thigh_${side}`, flip(HIP), flip(KNEE), 0.074),
    segment(`skin_calf_${side}`, flip(KNEE), flip(ANKLE), 0.05),
    segment(`skin_foot_${side}`, flip(ANKLE), flip(TOE), 0.036),
  ])
  skin.add(limbs)
  return skin
}

/** Esqueleto axial y huesos que no son "largos" (cráneo, columna, costillas, pelvis, manos, pies). */
function buildSkeleton(): Group {
  const skeleton = new Group()
  skeleton.name = 'skeleton'
  skeleton.add(mesh('skeleton_skull', new SphereGeometry(0.08, 24, 16), [0, 1.675, 0], [1, 1.12, 1.05]))
  skeleton.add(mesh('skeleton_jaw', new SphereGeometry(0.05, 16, 12), [0, 1.6, 0.025], [1, 0.7, 1]))

  const vertebra = new CylinderGeometry(0.017, 0.017, 0.02, 10)
  for (let i = 0; i < 24; i++) {
    const t = i / 23
    // Curvatura suave: lordosis lumbar y cifosis torácica.
    skeleton.add(mesh(`skeleton_vertebra_${i}`, vertebra, [0, 0.93 + t * 0.62, -0.045 + Math.sin(t * Math.PI * 2) * 0.012]))
  }

  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const radius = 0.095 + Math.sin(t * Math.PI * 0.85) * 0.05
    const rib = mesh(`skeleton_rib_${i}`, new TorusGeometry(radius, 0.0055, 6, 40), [0, 1.37 - t * 0.25, 0], [1, 0.66, 1])
    rib.rotation.x = Math.PI / 2 + 0.22
    skeleton.add(rib)
  }
  skeleton.add(segment('skeleton_sternum', [0, 1.2, 0.085], [0, 1.37, 0.075], 0.01))

  const pelvis = mesh('skeleton_pelvis', new TorusGeometry(0.115, 0.02, 8, 32), [0, 0.94, 0], [1, 0.62, 1.6])
  pelvis.rotation.x = Math.PI / 2 - 0.25
  skeleton.add(pelvis)

  skeleton.add(
    pairedGroup('skeleton_shoulder_girdle', (side, flip) => [segment(`skeleton_clavicle_${side}`, flip([0.015, 1.41, 0.05]), flip([0.19, 1.42, 0]), 0.008)]),
  )
  skeleton.add(pairedGroup('skeleton_hands', (side, flip) => [segment(`skeleton_hand_${side}`, flip(WRIST), flip(HAND), 0.012)]))
  skeleton.add(pairedGroup('skeleton_knees', (side, flip) => [mesh(`skeleton_patella_${side}`, new SphereGeometry(0.022, 12, 8), flip([0.1, 0.5, 0.03]))]))
  skeleton.add(pairedGroup('skeleton_feet', (side, flip) => [segment(`skeleton_foot_${side}`, flip(ANKLE), flip(TOE), 0.013)]))
  return skeleton
}

/** Huesos largos de brazos y piernas: el musculoesquelético se pinta sobre ellos (CA-10). */
function buildMusculoskeletal(): Group {
  return pairedGroup('system:musculoskeletal', (side, flip) => [
    segment(`humerus_${side}`, flip(SHOULDER), flip(ELBOW), 0.012),
    segment(`radius_${side}`, flip(ELBOW), flip(WRIST), 0.009),
    segment(`femur_${side}`, flip(HIP), flip(KNEE), 0.017),
    segment(`tibia_${side}`, flip(KNEE), flip(ANKLE), 0.014),
  ])
}

function buildCardiovascular(): Group {
  const cardiovascular = new Group()
  cardiovascular.name = 'system:cardiovascular'
  const heart: Point = [0.025, 1.27, 0.03]
  cardiovascular.add(mesh('heart', new SphereGeometry(0.048, 24, 16), heart, [1, 1.15, 0.9]))
  cardiovascular.add(tube('aorta', [heart, [0.03, 1.36, 0.01], [0, 1.33, -0.02], [0, 1.15, -0.02], [0, 0.98, -0.01]], 0.011))
  cardiovascular.add(
    pairedGroup('cardiovascular_limbs', (side, flip) => [
      tube(`carotid_${side}`, [flip([0.02, 1.36, 0.01]), flip([0.03, 1.5, 0.01]), flip([0.045, 1.6, 0.01]), flip([0.05, 1.7, 0])], 0.006),
      tube(`artery_arm_${side}`, [flip([0.02, 1.36, 0.01]), flip([0.12, 1.4, 0.01]), flip(SHOULDER), flip(ELBOW), flip(WRIST), flip(HAND)], 0.006),
      tube(`artery_leg_${side}`, [[0, 0.98, -0.01], flip([0.07, 0.9, 0.01]), flip(KNEE), flip(ANKLE), flip([0.1, 0.04, 0.1])], 0.008),
    ]),
  )
  return cardiovascular
}

function buildRespiratory(): Group {
  const lungs = pairedGroup('respiratory_lungs', (side, flip) => [mesh(`lung_${side}`, new SphereGeometry(0.058, 24, 16), flip([0.078, 1.29, 0]), [1, 1.6, 0.95])])
  const trachea = segment('trachea', [0, 1.46, 0.015], [0, 1.57, 0.02], 0.017)
  return namedGroup('system:respiratory', trachea, lungs)
}

function buildNervous(): Group {
  const brain = mesh('brain', new SphereGeometry(0.068, 24, 16), [0, 1.69, 0], [1, 0.9, 1.1])
  const spinalCord = tube('spinal_cord', [[0, 1.6, -0.03], [0, 1.3, -0.045], [0, 1.0, -0.05], [0, 0.93, -0.045]], 0.007)
  const nerves = pairedGroup('peripheral_nerves', (side, flip) => [
    tube(`nerve_arm_${side}`, [flip([0.02, 1.34, -0.01]), flip([0.12, 1.38, -0.005]), flip(SHOULDER), flip(ELBOW), flip(WRIST), flip(HAND)], 0.0035),
    tube(`nerve_leg_${side}`, [[0, 0.96, -0.03], flip([0.08, 0.88, -0.005]), flip(KNEE), flip(ANKLE), flip([0.1, 0.04, 0.09])], 0.0045),
  ])
  return namedGroup('system:nervous', brain, spinalCord, nerves)
}

function buildDigestive(): Group {
  const esophagus = tube('esophagus', [[0, 1.46, -0.01], [0, 1.3, -0.015], [0, 1.15, 0.01]], 0.012)
  const stomach = mesh('stomach', new SphereGeometry(0.045, 24, 16), [0.06, 1.13, 0.03], [1.1, 1.2, 0.9])
  // Asas intestinales: un tubo en zigzag dentro del abdomen.
  const loops: Point[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    loops.push([Math.sin(i * 1.9) * 0.085 * (1 - t * 0.3), 1.07 - t * 0.15, 0.03 + Math.cos(i * 2.7) * 0.02])
  }
  const intestine = tube('intestine', loops, 0.017)
  return namedGroup('system:digestive', esophagus, stomach, intestine)
}

function buildHepatic(): Group {
  const liver = mesh('liver', new SphereGeometry(0.06, 24, 16), [-0.055, 1.15, 0.02], [1.5, 0.75, 1])
  const gallbladder = mesh('gallbladder', new SphereGeometry(0.015, 12, 8), [-0.03, 1.09, 0.045])
  return namedGroup('system:hepatic', liver, gallbladder)
}

function buildRenal(): Group {
  const kidneys = pairedGroup('renal_kidneys', (side, flip) => [mesh(`kidney_${side}`, new SphereGeometry(0.026, 16, 12), flip([0.06, 1.08, -0.04]), [1, 1.5, 0.8])])
  const bladder = mesh('bladder', new SphereGeometry(0.035, 16, 12), [0, 0.87, 0.02])
  return namedGroup('system:renal', kidneys, bladder)
}

function buildEndocrine(): Group {
  const thyroid = mesh('thyroid', new SphereGeometry(0.02, 16, 12), [0, 1.47, 0.03], [1.3, 0.7, 0.7])
  const pancreas = segment('pancreas', [-0.04, 1.12, -0.02], [0.05, 1.13, -0.015], 0.018)
  return namedGroup('system:endocrine', thyroid, pancreas)
}

function buildReproductive(): Group {
  const pelvicOrgans = mesh('pelvic_organs', new SphereGeometry(0.03, 16, 12), [0, 0.885, -0.025])
  return namedGroup('system:reproductive', pelvicOrgans)
}

export function buildProceduralAnatomy(): Group {
  const root = new Group()
  root.name = 'procedural-anatomy'
  root.add(
    buildSkin(),
    buildSkeleton(),
    buildMusculoskeletal(),
    buildCardiovascular(),
    buildRespiratory(),
    buildNervous(),
    buildDigestive(),
    buildHepatic(),
    buildRenal(),
    buildEndocrine(),
    buildReproductive(),
  )
  return root
}
