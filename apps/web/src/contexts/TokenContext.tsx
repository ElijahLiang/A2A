import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { loadState, saveState, STORAGE_KEYS } from '../services/storage'
import { TOKEN_REASONS, type TokenReason, type TokenRecord } from '../types'

interface TokenState {
  balance: number
  history: TokenRecord[]
}

type TokenAction =
  | { type: 'EARN'; amount: number; reason: TokenReason; relatedId?: string }
  | { type: 'SPEND'; amount: number; reason: TokenReason; relatedId?: string }
  | { type: 'INIT'; balance: number; history: TokenRecord[] }

function tokenReducer(state: TokenState, action: TokenAction): TokenState {
  switch (action.type) {
    case 'INIT':
      return { balance: action.balance, history: action.history }
    case 'EARN': {
      const record: TokenRecord = {
        id: crypto.randomUUID(),
        type: 'earn',
        amount: action.amount,
        reason: action.reason,
        relatedId: action.relatedId,
        timestamp: Date.now(),
      }
      return {
        balance: state.balance + action.amount,
        history: [record, ...state.history],
      }
    }
    case 'SPEND': {
      const record: TokenRecord = {
        id: crypto.randomUUID(),
        type: 'spend',
        amount: -action.amount,
        reason: action.reason,
        relatedId: action.relatedId,
        timestamp: Date.now(),
      }
      return {
        balance: state.balance - action.amount,
        history: [record, ...state.history],
      }
    }
    default:
      return state
  }
}

function readInitialTokenState(): TokenState {
  const fallback: TokenState = { balance: 3, history: [] }
  const loaded = loadState<Partial<TokenState> | null>(STORAGE_KEYS.TOKEN, null)
  if (!loaded || typeof loaded.balance !== 'number' || !Array.isArray(loaded.history)) {
    return fallback
  }
  return {
    balance: loaded.balance,
    history: loaded.history as TokenRecord[],
  }
}

type TokenContextValue = {
  balance: number
  history: TokenRecord[]
  earn: (amount: number, reason: TokenReason, relatedId?: string) => void
  spend: (amount: number, reason: TokenReason, relatedId?: string) => boolean
  canAfford: (cost: number) => boolean
}

const TokenContext = createContext<TokenContextValue | null>(null)

export function TokenProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tokenReducer, 0, () => readInitialTokenState())

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveState(STORAGE_KEYS.TOKEN, state)
    }, 280)
    return () => clearTimeout(t)
  }, [state])

  const earn = useCallback((amount: number, reason: TokenReason, relatedId?: string) => {
    if (amount <= 0) return
    dispatch({ type: 'EARN', amount, reason, relatedId })
  }, [])

  const spend = useCallback((amount: number, reason: TokenReason, relatedId?: string) => {
    if (amount <= 0) return true
    if (state.balance < amount) return false
    dispatch({ type: 'SPEND', amount, reason, relatedId })
    return true
  }, [state.balance])

  const canAfford = useCallback(
    (cost: number) => {
      return cost <= 0 || state.balance >= cost
    },
    [state.balance],
  )

  const value = useMemo(
    () => ({
      balance: state.balance,
      history: state.history,
      earn,
      spend,
      canAfford,
    }),
    [state.balance, state.history, earn, spend, canAfford],
  )

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
}

export function useToken(): TokenContextValue {
  const ctx = useContext(TokenContext)
  if (!ctx) throw new Error('useToken must be used within TokenProvider')
  return ctx
}
