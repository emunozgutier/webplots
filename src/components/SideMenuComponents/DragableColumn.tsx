import React from 'react';

interface DragableColumnProps {
    columnName: string;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, colName: string) => void;
}

const DragableColumn: React.FC<DragableColumnProps> = ({ columnName, onDragStart }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, columnName)}
            className="list-group-item list-group-item-action cursor-grab p-2"
            style={{ cursor: 'grab' }}
            title={columnName}
        >
            <div className="d-flex align-items-center">
                <span className="me-2 text-muted" style={{ cursor: 'grab' }}>⋮⋮</span>
                <span className="text-truncate">{columnName}</span>
            </div>
        </div>
    );
};

export default DragableColumn;
