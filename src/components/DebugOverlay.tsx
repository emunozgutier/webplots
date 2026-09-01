import React from 'react';
import { useAxisSideMenuStore } from '../store/SideMenu/useAxisSideMenuStore';
import { usePlotTypeSideMenuStore } from '../store/SideMenu/usePlotTypeSideMenuStore';
import { useGroupSideMenuStore } from '../store/SideMenu/useGroupSideMenuStore';
import { useCsvDataStore } from '../store/useCsvDataStore';

const DebugOverlay: React.FC = () => {
    const { sideMenuData } = useAxisSideMenuStore();
    const { plotTypeSideMenuData } = usePlotTypeSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { columns, data } = useCsvDataStore();

    return (
        <div style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'lime',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            zIndex: 9999,
            pointerEvents: 'none',
            maxWidth: '300px'
        }}>
            <h5 className="text-white mb-2" style={{ borderBottom: '1px solid lime', paddingBottom: '5px' }}>On-Screen Debugger</h5>
            <div><strong>Plot Type:</strong> {plotTypeSideMenuData.plotType}</div>
            <div><strong>X-Axis:</strong> {sideMenuData.xAxis || '(Empty)'}</div>
            <div><strong>Y-Axis:</strong> {sideMenuData.yAxis.length > 0 ? sideMenuData.yAxis.join(', ') : '(Empty)'}</div>
            <div><strong>Group:</strong> {groupSideMenuData.groupAxis || '(Empty)'}</div>
            <div><strong>Rows Loaded:</strong> {data.length}</div>
            <div><strong>Columns Loaded:</strong> {columns.length}</div>
        </div>
    );
};

export default DebugOverlay;
