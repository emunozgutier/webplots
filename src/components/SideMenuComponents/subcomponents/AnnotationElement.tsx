import React, { useState } from 'react';
import { useAnnotationSideMenuStore, type AnnotationConfig } from '../../../store/SideMenu/useAnnotationSideMenuStore';
import CloseButton from './CloseButton';
import AnnotationElementSettings from './AnnotationElementSettings';

interface AnnotationElementProps {
    annotation: AnnotationConfig;
    getUniqueValues: (col: string) => string[];
}

const AnnotationElement: React.FC<AnnotationElementProps> = ({ annotation, getUniqueValues }) => {
    const { removeAnnotation } = useAnnotationSideMenuStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="card shadow-sm border-0 mb-2">
            <div className="card-body p-2 position-relative d-flex flex-column" style={{ minHeight: '60px' }}>
                {/* Header row: Settings icon, Label, Close button */}
                <div className="d-flex align-items-center mb-1">
                    <div className="d-flex align-items-center" style={{ flex: 1, minWidth: 0 }}>
                        <i
                            className="bi bi-gear-fill text-secondary me-2"
                            style={{ cursor: 'pointer', flexShrink: 0 }}
                            onClick={() => setIsSettingsOpen(true)}
                        />
                        <div className="text-truncate fw-bold small" style={{ flex: 1 }}>
                            {annotation.type === 'text' ? 'Text' : 'Highlight'}: {annotation.text || 'Untitled'}
                        </div>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                        <CloseButton onClose={() => removeAnnotation(annotation.id)} className="fs-6" />
                    </div>
                </div>

                {/* Subtext: tracking info */}
                <div className="text-muted small text-truncate ps-4" style={{ fontSize: '0.75rem' }}>
                    {annotation.trackColumn && annotation.trackValue 
                        ? `Tracks ${annotation.trackColumn} = ${annotation.trackValue}` 
                        : 'Fixed position (no tracking)'}
                </div>
            </div>

            {/* Settings Modal */}
            <AnnotationElementSettings
                show={isSettingsOpen}
                onHide={() => setIsSettingsOpen(false)}
                annotation={annotation}
                getUniqueValues={getUniqueValues}
            />
        </div>
    );
};

export default AnnotationElement;
