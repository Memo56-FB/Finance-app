import { create } from 'zustand'

type Store = {
  isOpen: boolean
  toggle: () => void
}

export const useSidebarStore = create<Store>() ((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen }))
}))
