import { lazy, Suspense, useCallback, useState } from 'react'
import { BodyMap } from './components/BodyMap/BodyMap'
import { BundleLoader } from './components/BundleLoader'
import { EncounterSelector } from './components/EncounterSelector'
import { PatientHeader } from './components/PatientHeader'
import { RulesNotice } from './components/RulesNotice'
import { SystemDetailPanel } from './components/SystemDetailPanel'
import { TriageAlert } from './components/TriageAlert'
import { UnmappedDiagnoses } from './components/UnmappedDiagnoses'
import { ViewingIndicator } from './components/ViewingIndicator'
import { ViewModeToggle, type ViewMode } from './components/ViewModeToggle'
import { usePatientHistory } from './state/usePatientHistory'
import './App.css'

// three.js no pesa en el visor: la vista 3D solo se descarga cuando el
// médico pulsa "3D" por primera vez (CA-3).
const BodyModel3D = lazy(() => import('./components/Anatomy3D/BodyModel3D').then((m) => ({ default: m.BodyModel3D })))

export default function App() {
  const history = usePatientHistory()
  const { state, record, bodyState } = history
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [modelUnavailable, setModelUnavailable] = useState(false)

  const handleUnavailable = useCallback(() => {
    setModelUnavailable(true)
    setViewMode('2d')
  }, [])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (mode === '3d') setModelUnavailable(false)
    setViewMode(mode)
  }, [])

  if (state.status !== 'ready' || !record || !bodyState) {
    return (
      <main className="app app--loader">
        <h1>Visor clínico RDA</h1>
        <BundleLoader
          loading={state.status === 'loading'}
          error={state.status === 'error' ? state.error : undefined}
          onLoadFiles={history.loadFromFiles}
          onLoadExample={history.loadFromExample}
        />
      </main>
    )
  }

  const selectedSystem = state.selectedSystemId ? bodyState.systems[state.selectedSystemId] : undefined

  return (
    <main className="app">
      <PatientHeader patient={record.patient} ageAtEncounter={record.ageAtEncounter} onReset={history.reset} />
      <div className="app__context">
        <EncounterSelector encounters={state.encounters} selectedId={state.selectedEncounterId} onSelect={history.selectEncounter} />
        <ViewingIndicator encounter={record.encounter} />
        <TriageAlert triage={record.encounter.triage} encounterKind={record.encounter.kind} />
        <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
      </div>
      {!bodyState.hasDiagnoses && (
        <p className="app__notice" role="status">
          Esta atención no registra diagnósticos.
        </p>
      )}
      {modelUnavailable && (
        <p className="app__notice" role="status">
          No se pudo mostrar el modelo 3D. Se mantiene la silueta 2D.
        </p>
      )}
      <RulesNotice />
      <div className={`app__main${selectedSystem ? ' app__main--with-panel' : ''}`}>
        <section className="app__body" aria-label={viewMode === '2d' ? 'Silueta del cuerpo' : 'Modelo anatómico del cuerpo'}>
          {viewMode === '2d' ? (
            <BodyMap bodyState={bodyState} selectedSystemId={state.selectedSystemId} onSelect={history.selectSystem} />
          ) : (
            <Suspense fallback={<p role="status">Cargando modelo anatómico…</p>}>
              <BodyModel3D
                bodyState={bodyState}
                selectedSystemId={state.selectedSystemId}
                onSelect={history.selectSystem}
                onUnavailable={handleUnavailable}
              />
            </Suspense>
          )}
          <UnmappedDiagnoses diagnoses={bodyState.unmapped} />
        </section>
        {selectedSystem && (
          <SystemDetailPanel state={selectedSystem} encounter={record.encounter} onClose={() => history.selectSystem(undefined)} />
        )}
      </div>
    </main>
  )
}
