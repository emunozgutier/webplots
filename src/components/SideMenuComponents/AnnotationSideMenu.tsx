import React, { useState } from 'react';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { useAnnotationSideMenuStore } from '../../store/SideMenu/useAnnotationSideMenuStore';
import AnnotationElement from './subcomponents/AnnotationElement';

const AnnotationSideMenu: React.FC = () => {
    const { data: rawData } = useCsvDataStore();
    const { annotations, addAnnotation } = useAnnotationSideMenuStore();
    const [dragOver, setDragOver] = useState(false);

    const getUniqueValues = (col: string): string[] => {
        const values = new Set<string>();
        rawData.forEach(row => {
            const val = row[col];
            if (val != null && val !== '') values.add(String(val));
        });
        return Array.from(values).sort();
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const colName = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
        if (colName) {
            const id = 'anno_' + Math.random().toString(36).substr(2, 9);
            addAnnotation({
                id,
                type: 'text',
                text: 'New Annotation',
                trackColumn: colName,
                trackValue: '',
                offsetX: 0,
                offsetY: -30,
                fontSize: 14,
                fontColor: '#000000',
                highlightColor: '#ff0000',
                highlightSize: 50
            });
        }
    };

    const handleAddManual = () => {
        const id = 'anno_' + Math.random().toString(36).substr(2, 9);
        addAnnotation({
            id,
            type: 'text',
            text: 'New Annotation',
            trackColumn: '',
            trackValue: '',
            offsetX: 0,
            offsetY: -30,
            fontSize: 14,
            fontColor: '#000000',
            highlightColor: '#ff0000',
            highlightSize: 50
        });
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            <div className="p-2 flex-grow-1" style={{ flex: '1 1 0', minHeight: '200px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="d-flex flex-column h-100 overflow-hidden">
                    <div
                        className={`overflow-auto h-100 p-2 ${dragOver ? 'bg-warning bg-opacity-10' : ''}`}
                        onDragEnter={handleDragOver}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-bold small">Annotations</div>
                            <button className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={handleAddManual}>
                                <i className="bi bi-plus"></i> Add
                            </button>
                        </div>
                        {annotations.length === 0 ? (
                            <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                                <i className="bi bi-chat-square-text fs-3 mb-2"></i>
                                <p className="small text-center mb-0">Drag a column here to track a point, or click Add.</p>
                            </div>
                        ) : (
                            <div>
                                {annotations.map((anno) => (
                                    <div key={anno.id} className="mb-2">
                                        <AnnotationElement
                                            annotation={anno}
                                            getUniqueValues={getUniqueValues}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnotationSideMenu;
