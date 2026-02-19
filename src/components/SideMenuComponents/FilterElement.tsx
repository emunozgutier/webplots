import React from 'react';
import { useFilterSideMenuStore, type Filter } from '../../store/FilterSideMenuStore';

interface FilterElementProps {
    filter: Filter;
    stats: {
        inputCount: number;
        outputCount: number;
        percentRemaining: number;
    };
    getMinMax: (col: string) => { min: number; max: number };
    getUniqueValues: (col: string) => string[];
}

const FilterElement: React.FC<FilterElementProps> = ({ filter, stats, getMinMax, getUniqueValues }) => {
    const { removeFilter, updateFilter } = useFilterSideMenuStore();

    const renderNumberFilter = () => {
        const { min, max } = filter.config as any;
        const bounds = getMinMax(filter.column);

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

    const renderCategoryFilter = () => {
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

    return filter.type === 'number' ? renderNumberFilter() : renderCategoryFilter();
};

export default FilterElement;
