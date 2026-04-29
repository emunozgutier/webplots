import React, { useState } from 'react';
import { useFilterSideMenuStore, type Filter } from '../../../store/SideMenu/useFilterSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import FilterElementSettings from './FilterElementSettings';

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
    const { setPopupContent } = useWorkspaceLocalStore();
    const [isShrunk, setIsShrunk] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const configMin = (filter.config as any).min;
    const configMax = (filter.config as any).max;
    
    const [localMin, setLocalMin] = useState<string | number>(configMin ?? '');
    const [localMax, setLocalMax] = useState<string | number>(configMax ?? '');
    const [localExact, setLocalExact] = useState<string | number>('');

    React.useEffect(() => {
        setLocalMin(configMin ?? '');
        setLocalMax(configMax ?? '');
        
        if (configMin !== undefined && configMax !== undefined && configMin === configMax) {
            setLocalExact(configMin);
        } else {
            setLocalExact('');
        }
    }, [configMin, configMax]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (localMin !== (configMin ?? '')) {
                updateFilter(filter.id, { min: localMin === '' ? undefined : Number(localMin) });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localMin, configMin, filter.id, updateFilter]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (localMax !== (configMax ?? '')) {
                updateFilter(filter.id, { max: localMax === '' ? undefined : Number(localMax) });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localMax, configMax, filter.id, updateFilter]);

    const handleExactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalExact(val);
        setLocalMin(val);
        setLocalMax(val);
    };

    React.useEffect(() => {
        return () => {
            if (deleteTimerRef.current) {
                clearTimeout(deleteTimerRef.current);
            }
        };
    }, []);

    const startDelete = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        deleteTimerRef.current = setTimeout(() => {
            removeFilter(filter.id);
        }, 2000);
    };

    const cancelDelete = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
        }
        setIsDeleting(false);
    };

    const renderHeader = () => (
        <div className="card-header bg-white p-1 ps-2 pe-1">
            <div className="d-flex justify-content-between align-items-center mb-0">
                <div className="overflow-hidden">
                    {isShrunk ? (
                        <span className="text-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                            {stats.percentRemaining}% Kept
                        </span>
                    ) : (
                        <span className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {filter.type}
                        </span>
                    )}
                </div>
                <div className="d-flex align-items-center flex-shrink-0">
                    <button
                        className="btn btn-sm btn-link p-0 me-2 text-secondary"
                        onClick={(e) => { e.stopPropagation(); setIsShrunk(!isShrunk); }}
                        style={{ textDecoration: 'none' }}
                        title={isShrunk ? "Expand" : "Shrink"}
                    >
                        <i className={`bi ${isShrunk ? 'bi-plus-square' : 'bi-dash-square'}`} style={{ fontSize: '0.75rem' }}></i>
                    </button>
                    {filter.type === 'number' && (
                        <button
                            className="btn btn-sm btn-link p-0 me-2 text-primary"
                            onClick={(e) => { e.stopPropagation(); setPopupContent(<FilterElementSettings filter={filter} />); }}
                            style={{ textDecoration: 'none' }}
                            title="Advanced Settings"
                        >
                            <i className="bi bi-gear-fill" style={{ fontSize: '0.8rem' }}></i>
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-link text-danger p-0 ms-1 position-relative overflow-hidden d-flex align-items-center justify-content-center"
                        style={{ textDecoration: 'none', fontSize: '1.2rem', lineHeight: '1', width: '22px', height: '22px', borderRadius: '4px' }}
                        onMouseDown={startDelete}
                        onMouseUp={cancelDelete}
                        onMouseLeave={cancelDelete}
                        onTouchStart={startDelete}
                        onTouchEnd={cancelDelete}
                        onClick={(e) => e.stopPropagation()} // Prevent any default click actions
                        title="Hold 2s to Remove Filter"
                    >
                        <div 
                            className="bg-danger position-absolute top-0 start-0 h-100" 
                            style={{ 
                                width: isDeleting ? '100%' : '0%', 
                                transition: isDeleting ? 'width 2s linear' : 'width 0.2s ease-out',
                                opacity: 0.2,
                            }} 
                        />
                        <span className="position-relative" style={{ zIndex: 1, marginTop: '-2px' }}>&times;</span>
                    </button>
                </div>
            </div>
            <div className="mt-n1 overflow-hidden">
                <span className="fw-bold text-truncate d-block" style={{ maxWidth: '100%', fontSize: '0.85rem' }} title={filter.column}>
                    {filter.column}
                </span>
            </div>
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
        const bounds = getMinMax(filter.column);

        return (
            <div className="card-body p-2">
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center">
                        <label className="form-label mb-0 text-muted me-2" style={{ fontSize: '0.75rem', minWidth: '35px' }}>Exact</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                            value={localExact}
                            placeholder="Exact Value"
                            onChange={handleExactChange}
                        />
                    </div>
                    <div className="d-flex align-items-center">
                        <label className="form-label mb-0 text-muted me-2" style={{ fontSize: '0.75rem', minWidth: '35px' }}>Min</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                            value={localMin}
                            placeholder={String(bounds.min)}
                            onChange={(e) => setLocalMin(e.target.value)}
                        />
                    </div>
                    <div className="d-flex align-items-center">
                        <label className="form-label mb-0 text-muted me-2" style={{ fontSize: '0.75rem', minWidth: '35px' }}>Max</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                            value={localMax}
                            placeholder={String(bounds.max)}
                            onChange={(e) => setLocalMax(e.target.value)}
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
        <div className="card mb-2 p-2 shadow-sm border-0">
            {renderHeader()}
            {!isShrunk && (
                <>
                    {filter.type === 'number' ? renderNumberControls() : renderCategoryControls()}
                    {renderStats()}
                </>
            )}
        </div>
    );
};

export default FilterElement;
