import App from './App.tsx'

// La antigua demostración `/?vista=3d` se retiró: la vista 3D ahora vive
// dentro del visor, detrás del conmutador 2D / 3D (ver BodyModel3D).
export default function Root() {
  return <App />
}
