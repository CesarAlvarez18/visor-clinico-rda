import { BodyMap } from './components/BodyMap/BodyMap'
import { BundleLoader } from './components/BundleLoader'
import { EncounterSelector } from './components/EncounterSelector'
import { PatientHeader } from './components/PatientHeader'
import { RulesNotice } from './components/RulesNotice'
import { SystemDetailPanel } from './components/SystemDetailPanel'
import { TriageAlert } from './components/TriageAlert'
import { UnmappedDiagnoses } from './components/UnmappedDiagnoses'
import { ViewingIndicator } from './components/ViewingIndicator'
import { usePatientHistory } from './state/usePatientHistory'
import './App.css'

export default function App() {
  const history = usePatientHistory()
  const { state, record, bodyState } = history

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
      </div>
      {!bodyState.hasDiagnoses && (
        <p className="app__notice" role="status">
          Esta atención no registra diagnósticos.
        </p>
      )}
      <RulesNotice />
      <div className={`app__main${selectedSystem ? ' app__main--with-panel' : ''}`}>
        <section className="app__body" aria-label="Silueta del cuerpo">
          <BodyMap bodyState={bodyState} selectedSystemId={state.selectedSystemId} onSelect={history.selectSystem} />
          <UnmappedDiagnoses diagnoses={bodyState.unmapped} />
        </section>
        {selectedSystem && (
          <SystemDetailPanel state={selectedSystem} encounter={record.encounter} onClose={() => history.selectSystem(undefined)} />
        )}
      </div>
    </main>
  )
}
