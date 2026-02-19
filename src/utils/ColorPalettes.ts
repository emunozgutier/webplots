export const COLOR_PALETTES: Record<string, string[]> = {
    'Default': [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
        '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'
    ],
    'Seaborn': [
        '#4c72b0', '#dd8452', '#55a868', '#c44e52',
        '#8172b3', '#937860', '#da8bc3', '#8c8c8c'
    ],
    'Pastel': [
        '#a1c9f4', '#ffb482', '#8de5a1', '#ff9f9b',
        '#d0bbff', '#debb9b', '#fab0e4', '#cfcfcf'
    ],
    'Neon': [
        '#FF00FF', '#00FFFF', '#00FF00', '#FFFF00',
        '#FF0000', '#0000FF', '#CC00FF', '#FF9900'
    ]
};

export const getPaletteColor = (paletteName: string, index: number): string => {
    const palette = COLOR_PALETTES[paletteName] || COLOR_PALETTES['Default'];
    return palette[index % palette.length];
};
