import { create } from 'zustand';
import debounce from 'lodash/debounce';

export type ScreenType = 'iphone' | 'ipad' | 'small monitor' | 'big monitor';

interface WindowDimState {
    width: number;
    height: number;
    screenType: ScreenType;
    isSmallScreen: boolean;
    isBigScreen: boolean;
    updateDimensions: (width: number, height: number) => void;
}

const getScreenType = (width: number): ScreenType => {
    if (width <= 576) return 'iphone';
    if (width <= 992) return 'ipad';
    if (width <= 1440) return 'small monitor';
    return 'big monitor';
};

export const useWindowDim = create<WindowDimState>()((set) => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    screenType: typeof window !== 'undefined' ? getScreenType(window.innerWidth) : 'big monitor',
    isSmallScreen: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
    isBigScreen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,

    updateDimensions: (w, h) => set({
        width: w,
        height: h,
        screenType: getScreenType(w),
        isSmallScreen: w < 1024,
        isBigScreen: w >= 1024
    })
}));

// Self-contained window resize listener with 150ms debounce
if (typeof window !== 'undefined') {
    const handleResize = debounce(() => {
        useWindowDim.getState().updateDimensions(window.innerWidth, window.innerHeight);
    }, 150);
    window.addEventListener('resize', handleResize);
}

if (typeof window !== 'undefined') {
    const win = window as unknown as { __registerZustandStore?: (store: unknown, name: string) => void };
    if (win.__registerZustandStore) {
        win.__registerZustandStore(useWindowDim, 'WindowDimStore');
    }
}
