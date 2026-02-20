import React, { useState, useMemo } from 'react';
import { useCsvDataStore } from '../../store/CsvDataStore';
import { useFilterSideMenuStore, type FilterType } from '../../store/FilterSideMenuStore';
import SearchColumn from './SearchColumn'; // Reusing for drag source
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import FilterElement from './FilterElement';

const FilterSideMenu: React.FC = () => {
    const { data: rawData } = useCsvDataStore();
    const { filters, addFilter, reorderFilters } = useFilterSideMenuStore();
    const [dragOver, setDragOver] = useState(false);

    // --- Helper Logic for Stats & Determining Type ---

    const getColumnType = (col: string): FilterType => {
        // Simple heuristic: check first non-null value
        const val = rawData.find(row => row[col] != null)?.[col];
        return typeof val === 'number' ? 'number' : 'category';
    };

    const getUniqueValues = (col: string): string[] => {
        const values = new Set<string>();
        rawData.forEach(row => {
            const val = row[col];
            if (val != null) values.add(String(val));
        });
        return Array.from(values).sort();
    };

    const getMinMax = (col: string): { min: number, max: number } => {
        let min = Infinity;
        let max = -Infinity;
        rawData.forEach(row => {
            const val = row[col];
            if (typeof val === 'number') {
                if (val < min) min = val;
                if (val > max) max = val;
            }
        });
        if (min === Infinity) return { min: 0, max: 0 };
        return { min, max };
    };

    // --- Funnel Calculation ---
    // Calculates the data count after each filter step
    const filterStats = useMemo(() => {
        let currentData = rawData;
        const stats = filters.map(filter => {
            const inputCount = currentData.length;

            currentData = currentData.filter(row => {
                const val = row[filter.column];
                if (filter.type === 'number') {
                    const min = (filter.config as any).min;
                    const max = (filter.config as any).max;
                    if (typeof val !== 'number') return false;
                    if (min != null && val < min) return false;
                    if (max != null && val > max) return false;
                    return true;
                } else {
                    const included = (filter.config as any).includedValues;
                    if (!included) return true; // Default include all
                    return included.includes(String(val));
                }
            });

            const outputCount = currentData.length;
            const percentRemaining = inputCount === 0 ? 0 : Math.round((outputCount / inputCount) * 100);

            return {
                id: filter.id,
                inputCount,
                outputCount,
                percentRemaining
            };
        });
        return stats;
    }, [rawData, filters]);


    // --- Handlers ---

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const colName = e.dataTransfer.getData('text/plain');
        if (colName) {
            const type = getColumnType(colName);
            let initialConfig = {};
            if (type === 'number') {
                // Initialize range with actual min/max
                // const bounds = getMinMax(colName);
                initialConfig = {}; // Start open, or could default to bounds
            } else {
                // Initialize with all selected
                initialConfig = { includedValues: getUniqueValues(colName) };
            }
            addFilter(colName, type, initialConfig);
        }
    };

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        reorderFilters(result.source.index, result.destination.index);
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            {/* Reusing SearchColumn for convenience source */}
            {/* Reusing SearchColumn for convenience source */}
            <div className="p-2 border-bottom" style={{ height: '40%', minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex flex-column h-100 overflow-hidden">
                    <div className="p-2 h-100 overflow-hidden d-flex flex-column">
                        <SearchColumn />
                    </div>
                </div>
            </div>

            <div className="p-2 flex-grow-1" style={{ height: '60%', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex flex-column h-100 overflow-hidden">
                    <div
                        className={`overflow-auto h-100 p-2 ${dragOver ? 'bg-info bg-opacity-10' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="fw-bold small mb-2">Active Filters & Stats</div>
                        {filters.length === 0 ? (
                            <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                                <i className="bi bi-funnel fs-3 mb-2"></i>
                                <p className="small text-center mb-0">Drag columns here to filter data.</p>
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="filters-list">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                            {filters.map((filter, index) => (
                                                <Draggable key={filter.id} draggableId={filter.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{ ...provided.draggableProps.style }}
                                                        >
                                                            <FilterElement
                                                                filter={filter}
                                                                stats={filterStats[index] || { inputCount: 0, outputCount: 0, percentRemaining: 0 }}
                                                                getMinMax={getMinMax}
                                                                getUniqueValues={getUniqueValues}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            <div className="mt-3 p-2 border-top text-center">
                                                <small className="text-muted fw-bold">
                                                    Final Result: <span className="text-primary">{filterStats[filterStats.length - 1]?.outputCount || rawData.length}</span> rows
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSideMenu;
