import React, { useState, useMemo } from 'react';
import { useCsvDataStore } from '../../../store/CsvDataStore';
import DragableColumn from './DragableColumn';

const SearchColumn: React.FC = () => {
    const { columns } = useCsvDataStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredColumns = useMemo(() => {
        // Filter out blank or whitespace-only columns
        const validColumns = columns.filter((col: any) => col && col.trim().length > 0);
        if (!searchTerm) return validColumns;

        return validColumns.filter((col: any) =>
            col.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [columns, searchTerm]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, colName: string) => {
        e.dataTransfer.setData('text/plain', colName);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="d-flex flex-column h-100">
            <div className="mb-2 position-relative">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingRight: searchTerm ? '2.2rem' : undefined }}
                />
                {searchTerm && (
                    <span
                        className="position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center text-muted"
                        style={{ cursor: 'pointer', right: '10px', width: '20px', height: '20px', fontSize: '1.2rem', zIndex: 10 }}
                        onClick={() => setSearchTerm('')}
                    >
                        &times;
                    </span>
                )}
            </div>

            <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
                {filteredColumns.length > 0 ? (
                    <div className="list-group">
                        {filteredColumns.map((col: any) => (
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
    );
};

export default SearchColumn;
