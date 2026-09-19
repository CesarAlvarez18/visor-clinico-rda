import { act, renderHook, waitFor } from '@testing-library/react'
import { examplePatients } from '../data/examples'
import consulta1 from '../data/examples/paciente-01/consulta-2025-11-03.json'
import invalido from '../data/examples/invalido.json'
import { historyReducer, initialHistoryState, selectedRecord, type HistoryState } from './historyReducer'
import { buildHistory } from './loadBundles'
import { usePatientHistory } from './usePatientHistory'

describe('historyReducer', () => {
  const history = buildHistory([{ name: 'a', data: consulta1 }])
  const ready = historyReducer({ status: 'loading' }, { type: 'load-success', history })

  it('al cargar selecciona la atención más reciente', () => {
    expect(ready.status).toBe('ready')
    expect(selectedRecord(ready)?.encounter.id).toBe('enc-p1-2025-11-03')
  })

  it('un error deja el estado sin datos parciales', () => {
    const state = historyReducer(ready, { type: 'load-failure', error: 'falló' })
    expect(state).toEqual({ status: 'error', error: 'falló' })
    expect(selectedRecord(state)).toBeUndefined()
  })

  it('ignora la selección de una atención inexistente', () => {
    expect(historyReducer(ready, { type: 'select-encounter', encounterId: 'no-existe' })).toBe(ready)
  })

  it('conserva el sistema seleccionado al cambiar de atención', () => {
    const withSystem = historyReducer(ready, { type: 'select-system', systemId: 'cardiovascular' })
    const changed = historyReducer(withSystem, { type: 'select-encounter', encounterId: 'enc-p1-2025-11-03' })
    expect(changed.status === 'ready' && changed.selectedSystemId).toBe('cardiovascular')
  })

  it('ignora selecciones cuando no hay historia cargada', () => {
    const state: HistoryState = initialHistoryState
    expect(historyReducer(state, { type: 'select-system', systemId: 'renal' })).toBe(state)
  })
})

describe('usePatientHistory', () => {
  it('carga un paciente de ejemplo, selecciona la última atención y calcula la silueta', async () => {
    const { result } = renderHook(() => usePatientHistory())
    await act(() => result.current.loadFromExample(examplePatients[0]))

    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(result.current.record?.encounter.id).toBe('enc-p1-2026-08-20')
    expect(result.current.bodyState?.systems.cardiovascular.level).toBe('moderate')

    act(() => result.current.selectEncounter('enc-p1-2026-03-14'))
    expect(result.current.record?.encounter.kind).toBe('emergency')
    expect(result.current.bodyState?.systems.cardiovascular.level).toBe('severe')
  })

  it('CA-2: un archivo inválido produce error y no hay silueta', async () => {
    const { result } = renderHook(() => usePatientHistory())
    const file = new File([JSON.stringify(invalido)], 'invalido.json', { type: 'application/json' })
    await act(() => result.current.loadFromFiles([file]))

    expect(result.current.state.status).toBe('error')
    expect(result.current.state.status === 'error' && result.current.state.error).toMatch(/no es un documento RDA/)
    expect(result.current.bodyState).toBeUndefined()
  })
})
