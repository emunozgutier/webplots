import React, { useState, useMemo } from 'react';
import { useCsvDataStore } from '../../store/CsvDataStore';
import { useFilterStore, Filter, FilterType } from '../../store/FilterStore';
import DragableColumn from './DragableColumn';
import SearchColumn from './SearchColumn'; // Reusing for drag source
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

const FilterSideMenu: React.FC = () => {
    const { data: rawData, columns } = useCsvDataStore();
    const { filters, addFilter, removeFilter, updateFilter, reorderFilters } = useFilterStore();
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

    // --- Renderers ---

    const renderNumberFilter = (filter: Filter, stats: any) => {
        const { min, max } = filter.config as any;
        const bounds = getMinMax(filter.column); // Get absolute bounds for placeholder/reference

        return (
            <div className="card mb-2 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-1 ps-2 pe-1">
                    <small className="fw-bold text-primary text-truncate" style={{ maxWidth: '120px' }} title={filter.column}>{filter.column}</small>
                    <div className="d-flex align-items-center">
                        <span className="badge bg-light text-dark border me-2" style={{ fontSize: '0.65rem' }}>
                            {stats.outputCount} / {stats.inputCount} ({stats.percentRemaining}%)
                        </span>
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFilter(filter.id)}>&times;</button>
                    </div>
                </div>
                <div className="card-body p-2">
                    <div className="row g-1">
                        <div className="col-6">
                            <label className="form-label mb-0" style={{ fontSize: '0.7rem' }}>Min ({bounds.min})</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={min ?? ''}
                                placeholder={String(bounds.min)}
                                onChange={(e) => updateFilter(filter.id, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                            />
                        </div>
                        <div className="col-6">
                            <label className="form-label mb-0" style={{ fontSize: '0.7rem' }}>Max ({bounds.max})</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={max ?? ''}
                                placeholder={String(bounds.max)}
                                onChange={(e) => updateFilter(filter.id, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCategoryFilter = (filter: Filter, stats: any) => {
        const uniqueVals = getUniqueValues(filter.column);
        const included = (filter.config as any).includedValues || [];

        const toggleValue = (val: string) => {
            const newIncluded = included.includes(val)
                ? included.filter((v: string) => v !== val)
                : [...included, val];
            updateFilter(filter.id, { includedValues: newIncluded });
        };

        const selectAll = () => updateFilter(filter.id, { includedValues: uniqueVals });
        const selectNone = () => updateFilter(filter.id, { includedValues: [] });

        return (
            <div className="card mb-2 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-1 ps-2 pe-1">
                    <small className="fw-bold text-success text-truncate" style={{ maxWidth: '120px' }} title={filter.column}>{filter.column}</small>
                    <div className="d-flex align-items-center">
                        <span className="badge bg-light text-dark border me-2" style={{ fontSize: '0.65rem' }}>
                            {stats.outputCount} / {stats.inputCount} ({stats.percentRemaining}%)
                        </span>
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFilter(filter.id)}>&times;</button>
                    </div>
                </div>
                <div className="card-body p-2">
                    <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: '0.7rem' }}>{included.length} selected</span>
                        <div>
                            <button className="btn btn-xs btn-link p-0 me-2" style={{ fontSize: '0.7rem' }} onClick={selectAll}>All</button>
                            <button className="btn btn-xs btn-link p-0" style={{ fontSize: '0.7rem' }} onClick={selectNone}>None</button>
                        </div>
                    </div>
                    <div className="border rounded bg-light p-1 overflow-auto" style={{ maxHeight: '100px' }}>
                        {uniqueVals.map(val => (
                            <div key={val} className="form-check" style={{ minHeight: 'auto', marginBottom: '2px' }}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`chk-${filter.id}-${val}`}
                                    checked={included.includes(val)}
                                    onChange={() => toggleValue(val)}
                                    style={{ width: '0.8em', height: '0.8em', marginTop: '0.25em' }}
                                />
                                <label className="form-check-label text-truncate w-100" htmlFor={`chk-${filter.id}-${val}`} style={{ fontSize: '0.75rem', verticalAlign: 'middle', cursor: 'pointer' }}>
                                    {val}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            {/* Reusing SearchColumn for convenience source */}
            <div className="p-3" style={{ height: '40%', minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                <div className="card shadow-sm h-100 d-flex flex-column overflow-hidden">
                    <div className="card-header bg-white fw-bold flex-shrink-0">
                        Available Columns
                    </div>
                    <div className="card-body p-2 overflow-hidden d-flex flex-column">
                        <SearchColumn />
                    </div>
                </div>
            </div>

            <div className="p-3 pt-0 flex-grow-1" style={{ height: '60%', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                <div className="card shadow-sm h-100 d-flex flex-column overflow-hidden">
                    <div className="card-header bg-white fw-bold flex-shrink-0">
                        Active Filters & Stats
                    </div>
                    <div
                        className={`card-body overflow-auto p-2 ${dragOver ? 'bg-info bg-opacity-10' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
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
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{ ...provided.draggableProps.style }}
                                                        >
                                                            {filter.type === 'number'
                                                                ? renderNumberFilter(filter, filterStats[index] || {})
                                                                : renderCategoryFilter(filter, filterStats[index] || {})
                                                            }
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
