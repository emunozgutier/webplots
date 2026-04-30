import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from '../Workspace/WorkspaceContext';

export interface AnnotationConfig {
    id: string;
    type: 'text' | 'highlight';
    text: string;
    trackColumn: string;
    trackValue: string;
    offsetX: number;
    offsetY: number;
    fontSize: number;
    fontColor: string;
    highlightColor: string;
    highlightSize: number;
}

export type AnnotationSideMenuState = {
    annotations: AnnotationConfig[];
    addAnnotation: (annotation: AnnotationConfig) => void;
    updateAnnotation: (id: string, updates: Partial<AnnotationConfig>) => void;
    removeAnnotation: (id: string) => void;
}

export const createAnnotationSideMenuStore = () => createStore<AnnotationSideMenuState>()(
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

export const useAnnotationSideMenuStore = <T = AnnotationSideMenuState>(selector: (state: AnnotationSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useAnnotationSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.annotationSideMenuStore, selector);
};
