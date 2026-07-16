import { useSyncExternalStore } from 'react'
import { getActor, getSnapshot, getVersion, subscribe, type TownActor } from '../lib/world'

function subscribeStore(onStoreChange: () => void) {
  return subscribe(onStoreChange)
}

function getServerSnapshot() {
  return 0
}

/** 订阅小镇 store 中单个 actor；无自建 rAF */
export function useTownActor(id: string): TownActor | undefined {
  const version = useSyncExternalStore(subscribeStore, getVersion, getServerSnapshot)
  void version
  return getActor(id)
}

export function useTownActors(): TownActor[] {
  const version = useSyncExternalStore(subscribeStore, getVersion, getServerSnapshot)
  void version
  return getSnapshot()
}
