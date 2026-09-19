import { useCallback, useMemo, useReducer } from 'react'
import { loadExampleBundles, type ExamplePatient } from '../data/examples'
import type { BodySystemId } from '../rules/config/bodySystems'
import { computeBodyState } from '../rules/computeBodyState'
import type { BodyState } from '../rules/types'
import { historyReducer, initialHistoryState, selectedRecord, type HistoryState } from './historyReducer'
import { BundleLoadError, buildHistory, readJsonFiles, type NamedInput } from './loadBundles'

export interface PatientHistoryController {
  state: HistoryState
  /** Registro de la atención seleccionada, si hay historia cargada. */
  record: ReturnType<typeof selectedRecord>
  /** Estado de la silueta para la atención seleccionada. */
  bodyState: BodyState | undefined
  loadFromFiles: (files: File[]) => Promise<void>
  loadFromExample: (patient: ExamplePatient) => Promise<void>
  selectEncounter: (encounterId: string) => void
  selectSystem: (systemId: BodySystemId | undefined) => void
  reset: () => void
}

export function usePatientHistory(): PatientHistoryController {
  const [state, dispatch] = useReducer(historyReducer, initialHistoryState)

  const load = useCallback(async (read: () => Promise<NamedInput[]>) => {
    dispatch({ type: 'load-start' })
    try {
      const history = buildHistory(await read())
      dispatch({ type: 'load-success', history })
    } catch (error) {
      const message =
        error instanceof BundleLoadError
          ? error.message
          : `No se pudieron leer los documentos: ${error instanceof Error ? error.message : 'error desconocido'}.`
      dispatch({ type: 'load-failure', error: message })
    }
  }, [])

  const loadFromFiles = useCallback((files: File[]) => load(() => readJsonFiles(files)), [load])

  const loadFromExample = useCallback(
    (patient: ExamplePatient) =>
      load(async () => {
        const bundles = await loadExampleBundles(patient)
        return bundles.map((data, i) => ({ name: patient.files[i], data }))
      }),
    [load],
  )

  const selectEncounter = useCallback((encounterId: string) => dispatch({ type: 'select-encounter', encounterId }), [])
  const selectSystem = useCallback((systemId: BodySystemId | undefined) => dispatch({ type: 'select-system', systemId }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const record = useMemo(() => selectedRecord(state), [state])
  const bodyState = useMemo(() => (record ? computeBodyState(record) : undefined), [record])

  return { state, record, bodyState, loadFromFiles, loadFromExample, selectEncounter, selectSystem, reset }
}
