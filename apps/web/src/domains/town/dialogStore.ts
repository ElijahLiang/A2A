import { useSyncExternalStore } from 'react'
import type { BuildingId } from '../../components/Building'
import type { TownAgent } from '../../data/agents'
import type { SquareCat } from '../../types'

export type TownDialogState = {
  activeBuilding: BuildingId | null
  catDetail: SquareCat | null
  seasonOpen: boolean
  letterAgent: TownAgent | null
  oneShotHint: string | null
}

const initial: TownDialogState = {
  activeBuilding: null,
  catDetail: null,
  seasonOpen: false,
  letterAgent: null,
  oneShotHint: null,
}

let state: TownDialogState = { ...initial }
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setState(patch: Partial<TownDialogState>) {
  state = { ...state, ...patch }
  emit()
}

export const townDialogStore = {
  getSnapshot: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  openBuilding: (id: BuildingId) => setState({ activeBuilding: id }),
  closeBuilding: () => setState({ activeBuilding: null }),
  openCat: (cat: SquareCat) => setState({ catDetail: cat }),
  closeCat: () => setState({ catDetail: null }),
  openSeason: () => setState({ seasonOpen: true }),
  closeSeason: () => setState({ seasonOpen: false }),
  openLetter: (agent: TownAgent) => setState({ letterAgent: agent }),
  closeLetter: () => setState({ letterAgent: null }),
  setHint: (hint: string | null) => setState({ oneShotHint: hint }),
  reset: () => {
    state = { ...initial }
    emit()
  },
}

export function useTownDialog(): TownDialogState & {
  openBuilding: (id: BuildingId) => void
  closeBuilding: () => void
  openCat: (cat: SquareCat) => void
  closeCat: () => void
  openSeason: () => void
  closeSeason: () => void
  openLetter: (agent: TownAgent) => void
  closeLetter: () => void
  setHint: (hint: string | null) => void
} {
  const snap = useSyncExternalStore(townDialogStore.subscribe, townDialogStore.getSnapshot, townDialogStore.getSnapshot)
  return {
    ...snap,
    openBuilding: townDialogStore.openBuilding,
    closeBuilding: townDialogStore.closeBuilding,
    openCat: townDialogStore.openCat,
    closeCat: townDialogStore.closeCat,
    openSeason: townDialogStore.openSeason,
    closeSeason: townDialogStore.closeSeason,
    openLetter: townDialogStore.openLetter,
    closeLetter: townDialogStore.closeLetter,
    setHint: townDialogStore.setHint,
  }
}
