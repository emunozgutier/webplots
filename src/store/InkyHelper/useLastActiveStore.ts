import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LastActiveState {
  last_time_seen: number;
  still_open: boolean;
  setStillOpen: (isOpen: boolean) => void;
  updateLastTimeSeen: () => void;
}

export const useLastActiveStore = create<LastActiveState>()(
  persist(
    (set) => ({
      last_time_seen: Date.now(),
      still_open: true,
      setStillOpen: (isOpen) => set({ still_open: isOpen, last_time_seen: Date.now() }),
      updateLastTimeSeen: () => set({ last_time_seen: Date.now() }),
    }),
    {
      name: 'inky-last-active-storage',
    }
  )
);

if (typeof window !== 'undefined') {
    const win = window as unknown as { __registerZustandStore?: (store: unknown, name: string) => void };
    if (win.__registerZustandStore) {
        win.__registerZustandStore(useLastActiveStore, 'LastActiveStore');
    }
}
