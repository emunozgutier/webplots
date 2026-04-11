import React, { useState } from 'react';

import { useGroupSideMenuStore } from '../../store/SideMenu/useGroupSideMenuStore';

import { useCsvDataStore } from '../../store/useCsvDataStore';
import GroupElement from './subcomponents/GroupElement';
import SearchColumn from './subcomponents/SearchColumn';

const GroupSideMenu: React.FC = () => {
    const { groupSideMenuData, setGroupAxis } = useGroupSideMenuStore();
    const { groupAxis } = groupSideMenuData;
    const { columns } = useCsvDataStore();

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
        setGroupAxis(colName);
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            {columns.length > 0 && (
                <div className="p-2 border-bottom" style={{ flex: '1 1 0', minHeight: '150px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="d-flex flex-column h-100 overflow-hidden">
                        <div className="p-2 h-100 overflow-hidden d-flex flex-column">
                            <SearchColumn />
                        </div>
                    </div>
                </div>
            )}
            <div className="p-2 flex-grow-1" style={{ flex: '1 1 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                                    className={`rounded ${!groupAxis ? 'border p-2' : ''} ${dragOverGroup ? 'bg-info bg-opacity-10 border-info border p-2' : (!groupAxis ? 'bg-white' : '')}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDropGroup}
                                    style={{ minHeight: '35px', transition: 'all 0.2s' }}
                                >
                                    {groupAxis ? (
                                        <GroupElement column={groupAxis} />
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
