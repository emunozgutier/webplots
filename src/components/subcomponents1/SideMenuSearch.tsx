import React, { useState, useMemo } from 'react';
import { usePlotDataStore } from '../../store/PlotDataStore';
import SideMenuDragableColumn from './SideMenuDragableColumn';

const SideMenuSearch: React.FC = () => {
    const { columns } = usePlotDataStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredColumns = useMemo(() => {
        if (!searchTerm) return columns;
        return columns.filter(col =>
            col.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [columns, searchTerm]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, colName: string) => {
        e.dataTransfer.setData('text/plain', colName);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="d-flex flex-column h-100">
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
                {filteredColumns.length > 0 ? (
                    <div className="list-group">
                        {filteredColumns.map(col => (
                            <SideMenuDragableColumn
                                key={col}
                                columnName={col}
                                onDragStart={handleDragStart}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-muted text-center py-3">
                        {columns.length === 0 ? "No columns available" : "No matches found"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SideMenuSearch;
