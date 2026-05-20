import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConsentStatus = 'granted' | 'denied' | null;

export interface AnalyticsState {
    status: ConsentStatus;
    timestamp: number | null;
    setConsent: (status: 'granted' | 'denied') => void;
    resetConsent: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set) => ({
            status: null,
            timestamp: null,
            setConsent: (status) => set({ status, timestamp: Date.now() }),
            resetConsent: () => set({ status: null, timestamp: null }),
        }),
        {
            name: 'webplots-analytics-consent',
        }
    )
);
