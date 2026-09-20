import { Component, type ReactNode } from 'react'

interface ModelErrorBoundaryProps {
  onError: () => void
  children: ReactNode
}

interface ModelErrorBoundaryState {
  hasError: boolean
}

/**
 * Si el modelo 3D falla al cargar o al dibujarse, avisa al visor (que vuelve
 * a 2D, CA-5) en vez de dejar la pantalla rota.
 */
export class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
