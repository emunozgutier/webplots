import { create } from 'zustand';

export interface AnnotationConfig {
    id: string;
    type: 'text' | 'highlight' | 'range';
    text: string;
    trackColumn: string;
    trackValue: string;
    offsetX: number;
    offsetY: number;
    fontSize: number;
    fontColor: string;
    highlightColor: string;
    highlightSize: number;
    xMin?: number | '';
    xMax?: number | '';
    yMin?: number | '';
    yMax?: number | '';
}

export type AnnotationSideMenuState = {
    annotations: AnnotationConfig[];
    addAnnotation: (annotation: AnnotationConfig) => void;
    updateAnnotation: (id: string, updates: Partial<AnnotationConfig>) => void;
    removeAnnotation: (id: string) => void;
}

export const useAnnotationSideMenuStore = create<AnnotationSideMenuState>()(
    (set) => ({
        annotations: [],
        addAnnotation: (annotation) =>
            set((state) => ({
                annotations: [...state.annotations, annotation]
            })),
        updateAnnotation: (id, updates) =>
            set((state) => ({
                annotations: state.annotations.map(a => 
                    a.id === id ? { ...a, ...updates } : a
                )
            })),
        removeAnnotation: (id) =>
            set((state) => ({
                annotations: state.annotations.filter(a => a.id !== id)
            }))
    })
);

