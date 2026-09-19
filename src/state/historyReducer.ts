import type { EncounterRecord, PatientSummary } from '../domain/types'
import type { BodySystemId } from '../rules/config/bodySystems'
import type { PatientHistory } from './loadBundles'

export type HistoryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      patient: PatientSummary
      encounters: EncounterRecord[]
      selectedEncounterId: string
      selectedSystemId?: BodySystemId
    }

export type HistoryAction =
  | { type: 'load-start' }
  | { type: 'load-success'; history: PatientHistory }
  | { type: 'load-failure'; error: string }
  | { type: 'select-encounter'; encounterId: string }
  | { type: 'select-system'; systemId: BodySystemId | undefined }
  | { type: 'reset' }

export const initialHistoryState: HistoryState = { status: 'idle' }

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'load-start':
      return { status: 'loading' }
    case 'load-success':
      // Por defecto se muestra la atención más reciente (la primera, ya ordenadas).
      return {
        status: 'ready',
        patient: action.history.patient,
        encounters: action.history.encounters,
        selectedEncounterId: action.history.encounters[0].encounter.id,
      }
    case 'load-failure':
      return { status: 'error', error: action.error }
    case 'select-encounter': {
      if (state.status !== 'ready') return state
      if (!state.encounters.some((e) => e.encounter.id === action.encounterId)) return state
      // El sistema seleccionado se conserva: el panel se actualiza a la nueva atención.
      return { ...state, selectedEncounterId: action.encounterId }
    }
    case 'select-system':
      if (state.status !== 'ready') return state
      return { ...state, selectedSystemId: action.systemId }
    case 'reset':
      return initialHistoryState
  }
}

export function selectedRecord(state: HistoryState): EncounterRecord | undefined {
  if (state.status !== 'ready') return undefined
  return state.encounters.find((e) => e.encounter.id === state.selectedEncounterId)
}
