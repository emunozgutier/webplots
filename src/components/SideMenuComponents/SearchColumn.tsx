import React, { useState, useMemo } from 'react';
import { useCsvDataStore } from '../../store/CsvDataStore';
import DragableColumn from './DragableColumn';

const SearchColumn: React.FC = () => {
    const { columns } = useCsvDataStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredColumns = useMemo(() => {
        // Filter out blank or whitespace-only columns
        const validColumns = columns.filter(col => col && col.trim().length > 0);

        if (!searchTerm) return validColumns;
        return validColumns.filter(col =>
            col.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [columns, searchTerm]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, colName: string) => {
        e.dataTransfer.setData('text/plain', colName);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="d-flex flex-column">
            <div className="mb-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-grow-1 overflow-auto" style={{
                minHeight: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                /* Webkit scrollbar hiding is best done in CSS file, but we can try inline style tag if scoped properly, 
                   or just rely on scrollbarWidth for Firefox and hope standard CSS handles Webkit. 
                   Actually, let's just use the style tag but placed correctly. */
            }}>
                <style>
                    {`
                        .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}
                </style>
                <div className="hide-scrollbar h-100" style={{ overflowY: 'auto' }}>
                    {filteredColumns.length > 0 ? (
                        <div className="list-group">
                            {filteredColumns.map(col => (
                                <DragableColumn
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
        </div>
    );
};

export default SearchColumn;
