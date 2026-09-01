import { create } from 'zustand';

export type MappingSource = 'manual' | 'group' | 'column';

export interface AestheticMapping {
    source: MappingSource;
    value: string | number; // 'manual' value OR the selected column name
    range?: [number, number]; // [min, max] output range when mapped to a column
    domain?: [number, number]; // [x0, x1] data range corresponding to the output range bounds
    mappingType?: 'linear' | 'curve' | 'exponential' | 'logarithmic';
    midPoint?: [number, number]; // [cx, cy] for 3-point power curve (0 to 1)
    offset?: number; // Hue shift offset
    enabled?: boolean;
    sizeMode?: 'diameter' | 'area';
}

export interface StyleSideMenuData {
    hue: AestheticMapping;
    saturation: AestheticMapping;
    lightness: AestheticMapping;
    shape: AestheticMapping;
    size: AestheticMapping;
    groupColorOverrides: Record<string, string>;
    groupSymbolOverrides: Record<string, string>;
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

export const useStyleSideMenuStore = create<StyleSideMenuState>()(
    (set) => ({
        colorData: {
            hue: { source: 'group', value: '', enabled: false }, // Default to grouping behavior 
            saturation: { source: 'manual', value: 80, enabled: false },
            lightness: { source: 'manual', value: 50, enabled: false },
            shape: { source: 'manual', value: 'circle', enabled: false },
            size: { source: 'manual', value: 8, enabled: false, sizeMode: 'area', range: [5, 32600], mappingType: 'exponential', midPoint: [0.5, 0.66] },
            groupColorOverrides: {
                'Asia': '#ff5872',
                'Americas': '#7feb00',
                'Europe': '#ffe700',
                'Africa': '#00d5e9',
                'asia': '#ff5872',
                'americas': '#7feb00',
                'europe': '#ffe700',
                'africa': '#00d5e9'
            },
            groupSymbolOverrides: {}
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

