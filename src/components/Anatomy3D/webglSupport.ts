/** Si el equipo no puede mostrar WebGL, la vista 3D no se ofrece (CA-5). */
export function isWebglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
