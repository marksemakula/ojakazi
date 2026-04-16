import { create } from 'zustand';
import { Stamp } from '../types';

interface StampState {
  stamps: Stamp[];
  loading: boolean;
  currentStampId: string | null;
  isDirty: boolean;

  setStamps: (stamps: Stamp[]) => void;
  addStamp: (stamp: Stamp) => void;
  updateStamp: (stamp: Stamp) => void;
  removeStamp: (id: string) => void;
  setLoading: (v: boolean) => void;
  setCurrentStampId: (id: string | null) => void;
  setDirty: (v: boolean) => void;
}

export const useStampStore = create<StampState>((set) => ({
  stamps: [],
  loading: false,
  currentStampId: null,
  isDirty: false,

  setStamps: (stamps) => set({ stamps }),
  addStamp: (stamp) => set((s) => ({ stamps: [stamp, ...s.stamps] })),
  updateStamp: (stamp) =>
    set((s) => ({ stamps: s.stamps.map((st) => (st.id === stamp.id ? stamp : st)) })),
  removeStamp: (id) => set((s) => ({ stamps: s.stamps.filter((st) => st.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setCurrentStampId: (currentStampId) => set({ currentStampId }),
  setDirty: (isDirty) => set({ isDirty }),
}));
