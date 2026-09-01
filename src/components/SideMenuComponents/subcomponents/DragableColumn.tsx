import React from 'react';

interface DragableColumnProps {
    columnName: string;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, colName: string) => void;
}

const DragableColumn: React.FC<DragableColumnProps> = ({ columnName, onDragStart }) => {
    return (
        <div
            id={`draggable-column-${columnName}`}
            draggable={true}
            onDragStart={(e) => onDragStart(e, columnName)}
            className="list-group-item list-group-item-action cursor-grab p-2"
            style={{ cursor: 'grab', WebkitUserDrag: 'element', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
            title={columnName}
        >
            <div className="d-flex align-items-center">
                <span className="me-2 text-muted" style={{ cursor: 'grab' }}>⋮⋮</span>
                <span id={`draggable-column-text-${columnName}`} className="text-truncate">{columnName}</span>
            </div>
        </div>
    );
};

export default DragableColumn;
