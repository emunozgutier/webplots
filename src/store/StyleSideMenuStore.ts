import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export type MappingSource = 'manual' | 'group' | 'column';

export interface AestheticMapping {
    source: MappingSource;
    value: string | number; // 'manual' value OR the selected column name
    range?: [number, number]; // [min, max] output range when mapped to a column
}

export interface StyleSideMenuData {
    hue: AestheticMapping;
    saturation: AestheticMapping;
    lightness: AestheticMapping;
    shape: AestheticMapping;
    size: AestheticMapping;
}

export type StyleSideMenuState = {
    colorData: StyleSideMenuData;
    setColorData: (data: Partial<StyleSideMenuData>) => void;

    // Explicit updaters for individual attributes
    setHue: (hue: Partial<AestheticMapping>) => void;
    setSaturation: (saturation: Partial<AestheticMapping>) => void;
    setLightness: (lightness: Partial<AestheticMapping>) => void;
    setShape: (shape: Partial<AestheticMapping>) => void;
    setSize: (size: Partial<AestheticMapping>) => void;
}

export const createStyleSideMenuStore = () => createStore<StyleSideMenuState>()(
    (set) => ({
        colorData: {
            hue: { source: 'group', value: '' }, // Default to grouping behavior 
            saturation: { source: 'manual', value: 80 },
            lightness: { source: 'manual', value: 50 },
            shape: { source: 'manual', value: 'circle' },
            size: { source: 'manual', value: 8 }
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
            })),

        setSize: (size) =>
            set((state) => ({
                colorData: { ...state.colorData, size: { ...state.colorData.size, ...size } }
            }))
    })
);

export const useStyleSideMenuStore = <T = StyleSideMenuState>(selector: (state: StyleSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useStyleSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.styleSideMenuStore, selector);
};
