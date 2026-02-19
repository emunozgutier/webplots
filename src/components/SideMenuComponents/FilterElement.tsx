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

    const renderHeader = () => (
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-1 ps-2 pe-1">
            <div className="d-flex align-items-center overflow-hidden">
                <span className="fw-bold text-truncate me-2" style={{ maxWidth: '100px', fontSize: '0.85rem' }} title={filter.column}>
                    {filter.column}
                </span>
                <span className="badge bg-secondary opacity-75" style={{ fontSize: '0.6rem' }}>
                    {filter.type}
                </span>
            </div>
            <button
                className="btn btn-sm btn-link text-danger p-0"
                style={{ textDecoration: 'none', fontSize: '1.2rem', lineHeight: '1' }}
                onClick={() => removeFilter(filter.id)}
                title="Remove Filter"
            >
                &times;
            </button>
        </div>
    );

    const renderStats = () => (
        <div className="card-footer bg-light p-1 text-center">
            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                Result: <strong>{stats.outputCount}</strong> / {stats.inputCount} ({stats.percentRemaining}%)
            </small>
        </div>
    );

    const renderNumberControls = () => {
        const { min, max } = filter.config as any;
        const bounds = getMinMax(filter.column);

        return (
            <div className="card-body p-2">
                <div className="row g-1">
                    <div className="col-6">
                        <label className="form-label mb-0 text-muted" style={{ fontSize: '0.7rem' }}>Min ({bounds.min})</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                            value={min ?? ''}
                            placeholder={String(bounds.min)}
                            onChange={(e) => updateFilter(filter.id, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label mb-0 text-muted" style={{ fontSize: '0.7rem' }}>Max ({bounds.max})</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                            value={max ?? ''}
                            placeholder={String(bounds.max)}
                            onChange={(e) => updateFilter(filter.id, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderCategoryControls = () => {
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
            <div className="card-body p-2">
                <div className="d-flex justify-content-between mb-1 align-items-center">
                    <span style={{ fontSize: '0.7rem' }} className="text-muted">{included.length} of {uniqueVals.length} selected</span>
                    <div>
                        <button className="btn btn-xs btn-link p-0 me-2 text-decoration-none" style={{ fontSize: '0.7rem' }} onClick={selectAll}>All</button>
                        <button className="btn btn-xs btn-link p-0 text-decoration-none" style={{ fontSize: '0.7rem' }} onClick={selectNone}>None</button>
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
                            <label
                                className="form-check-label text-truncate w-100"
                                htmlFor={`chk-${filter.id}-${val}`}
                                style={{ fontSize: '0.75rem', verticalAlign: 'middle', cursor: 'pointer', lineHeight: '1.2' }}
                                title={val}
                            >
                                {val}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="card mb-2 shadow-sm border-0">
            {renderHeader()}
            {filter.type === 'number' ? renderNumberControls() : renderCategoryControls()}
            {renderStats()}
        </div>
    );
};

export default FilterElement;
