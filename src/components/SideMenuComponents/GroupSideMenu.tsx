import React, { useState } from 'react';

import { useAxisSideMenuStore } from '../../store/AxisSideMenuStore';
import { useAppStateStore } from '../../store/AppStateStore';
import { useCsvDataStore } from '../../store/CsvDataStore';
import GroupAxisSettings from './subcomponents/GroupAxisSettings';
import SearchColumn from './subcomponents/SearchColumn';

const GroupSideMenu: React.FC = () => {
    const { sideMenuData, setGroupAxis } = useAxisSideMenuStore();
    const { setPopupContent } = useAppStateStore();
    const { groupAxis } = sideMenuData;
    const { data, columns } = useCsvDataStore();

    const [dragOverGroup, setDragOverGroup] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverGroup(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverGroup(false);
    };

    const handleDropGroup = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverGroup(false);
        const colName = e.dataTransfer.getData('text/plain');
        if (!colName) return;

        // Check unique values
        const uniqueValues = new Set(data.map((row: any) => row[colName])).size;

        if (uniqueValues > 8) {
            const confirmBin = window.confirm(
                `The column "${colName}" has ${uniqueValues} unique values. This will create many traces and might slow down the plot. Would you like to bin these values?`
            );

            if (confirmBin) {
                setGroupAxis(colName);
                setPopupContent(<GroupAxisSettings column={colName} />);
                return;
            }
        }

        setGroupAxis(colName);
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            {columns.length > 0 && (
                <div className="p-2 border-bottom" style={{ flex: '0 1 auto', maxHeight: '50%', minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                    <div className="d-flex flex-column h-100 overflow-hidden">
                        <div className="p-2 h-100 overflow-hidden d-flex flex-column">
                            <SearchColumn />
                        </div>
                    </div>
                </div>
            )}
            <div className="p-2 flex-grow-1" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex flex-column h-100 overflow-hidden">
                    <div className="overflow-auto h-100">
                        {columns.length > 0 ? (
                            <div className="mb-0 mt-3">
                                <label className="form-label fw-bold small mb-2 d-flex align-items-center">
                                    Group Axis
                                    <small className="text-muted fw-normal ms-1">(Optional)</small>
                                    <span
                                        className="ms-2 badge rounded-pill bg-light text-dark border cursor-help"
                                        style={{ cursor: 'help', fontSize: '0.7rem' }}
                                        title="It creates subtraces (or groups) based on other columns. Like Temp (hot or cold) or Voltage (max or min) OR both for 4 subtraces/groups"
                                    >
                                        ?
                                    </span>
                                </label>
                                <div
                                    className={`border rounded p-2 ${dragOverGroup ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDropGroup}
                                    style={{ minHeight: '35px', transition: 'all 0.2s' }}
                                >
                                    {groupAxis ? (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span
                                                className="badge bg-warning text-dark text-truncate mw-100 cursor-pointer user-select-none"
                                                onClick={() => setPopupContent(<GroupAxisSettings column={groupAxis} />)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to configure grouping"
                                            >
                                                {groupAxis}
                                                <small className="ms-1 opacity-50">⚙️</small>
                                            </span>
                                            <button className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={() => setGroupAxis(null)}>&times;</button>
                                        </div>
                                    ) : (
                                        <div className="text-muted small fst-italic text-center" style={{ fontSize: '0.8rem' }}>Drag column here</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted small mb-0">Please load data first.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupSideMenu;
