import { BodyMap } from './components/BodyMap/BodyMap'
import { BundleLoader } from './components/BundleLoader'
import { PatientHeader } from './components/PatientHeader'
import { RulesNotice } from './components/RulesNotice'
import { TriageAlert } from './components/TriageAlert'
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

  return (
    <main className="app">
      <PatientHeader patient={record.patient} ageAtEncounter={record.ageAtEncounter} onReset={history.reset} />
      <div className="app__context">
        <ViewingIndicator encounter={record.encounter} />
        <TriageAlert triage={record.encounter.triage} encounterKind={record.encounter.kind} />
      </div>
      {!bodyState.hasDiagnoses && (
        <p className="app__notice" role="status">
          Esta atención no registra diagnósticos.
        </p>
      )}
      <RulesNotice />
      <section className="app__body" aria-label="Silueta del cuerpo">
        <BodyMap bodyState={bodyState} selectedSystemId={state.selectedSystemId} onSelect={history.selectSystem} />
      </section>
    </main>
  )
}
