/**
 * [模板] Zustand Store 模板
 *
 * 使用方式：复制到 apps/mobile/src/stores/ 并重命名
 * 示例：apps/mobile/src/stores/matchStore.ts
 */

import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
  status: 'active' | 'completed';
}

interface ItemStore {
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;

  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  updateItemStatus: (id: string, status: Item['status']) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

// ── Store ────────────────────────────────────────────────

const initialState = {
  items: [] as Item[],
  selectedId: null as string | null,
  isLoading: false,
};

export const useItemStore = create<ItemStore>((set) => ({
  ...initialState,

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectItem: (id) => set({ selectedId: id }),

  updateItemStatus: (id, status) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, status } : i
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}));
