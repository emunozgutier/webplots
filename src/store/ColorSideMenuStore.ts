import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export type MappingSource = 'manual' | 'group' | 'column';

export interface AestheticMapping {
    source: MappingSource;
    value: string | number; // 'manual' value OR the selected column name
}

export interface ColorSideMenuData {
    hue: AestheticMapping;
    saturation: AestheticMapping;
    lightness: AestheticMapping;
    shape: AestheticMapping;
}

export type ColorSideMenuState = {
    colorData: ColorSideMenuData;
    setColorData: (data: Partial<ColorSideMenuData>) => void;

    // Explicit updaters for individual attributes
    setHue: (hue: Partial<AestheticMapping>) => void;
    setSaturation: (saturation: Partial<AestheticMapping>) => void;
    setLightness: (lightness: Partial<AestheticMapping>) => void;
    setShape: (shape: Partial<AestheticMapping>) => void;
}

export const createColorSideMenuStore = () => createStore<ColorSideMenuState>()((set) => ({
    colorData: {
        hue: { source: 'group', value: '' }, // Default to grouping behavior 
        saturation: { source: 'manual', value: 80 },
        lightness: { source: 'manual', value: 50 },
        shape: { source: 'manual', value: 'circle' }
    },

    setColorData: (data) =>
        set((state) => ({
            colorData: { ...state.colorData, ...data }
        })),

    setHue: (hue) =>
        set((state) => ({
            colorData: { ...state.colorData, hue: { ...state.colorData.hue, ...hue } }
        })),

    setSaturation: (saturation) =>
        set((state) => ({
            colorData: { ...state.colorData, saturation: { ...state.colorData.saturation, ...saturation } }
        })),

    setLightness: (lightness) =>
        set((state) => ({
            colorData: { ...state.colorData, lightness: { ...state.colorData.lightness, ...lightness } }
        })),

    setShape: (shape) =>
        set((state) => ({
            colorData: { ...state.colorData, shape: { ...state.colorData.shape, ...shape } }
        }))
}));

export const useColorSideMenuStore = <T = ColorSideMenuState>(selector: (state: ColorSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useColorSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.colorSideMenuStore, selector);
};
