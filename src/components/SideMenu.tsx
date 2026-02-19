import React, { useMemo, useState } from 'react';
import { useCsvDataStore } from '../store/CsvDataStore';
import { useSideMenuStore, createSideMenuConfig } from '../store/SideMenuStore';
import { useAppStateStore } from '../store/AppStateStore';
import AxisSideMenu from './SideMenuComponents/AxisSideMenu';
import FilterSideMenu from './SideMenuComponents/FilterSideMenu';
import ControlSideMenu from './SideMenuComponents/ControlSideMenu';

type SideMenuTab = 'axis' | 'filter' | 'control';

const SideMenu: React.FC = () => {
    const { columns: storeColumns } = useCsvDataStore();
    const { sideMenuData } = useSideMenuStore();
    const { isSideMenuOpen, toggleSideMenu } = useAppStateStore();

    const { hasColumns } = useMemo(() => createSideMenuConfig(storeColumns, sideMenuData), [storeColumns, sideMenuData]);
    const [activeTab, setActiveTab] = useState<SideMenuTab>('axis');

    const renderContent = () => {
        switch (activeTab) {
            case 'axis':
                return <AxisSideMenu hasColumns={hasColumns} />;
            case 'filter':
                return <FilterSideMenu />;
            case 'control':
                return <ControlSideMenu />;
            default:
                return null;
        }
    };

    const renderTabButton = (tab: SideMenuTab, label: string, iconClass: string) => (
        <button
            className={`btn btn-sm w-100 mb-2 p-2 ${activeTab === tab ? 'btn-primary' : 'btn-light text-secondary'} border-0 rounded-0 rounded-start`}
            onClick={() => {
                if (!isSideMenuOpen) toggleSideMenu();
                setActiveTab(tab);
            }}
            title={label}
            style={{ borderRadius: '4px 0 0 4px', position: 'relative', right: '-1px' }}
        >
            <div className="d-flex flex-column align-items-center">
                <i className={`bi ${iconClass} fs-5`}></i>
                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>{label}</span>
            </div>
        </button>
    );

    return (
        <div
            className="bg-light border-end d-flex"
            style={{
                width: isSideMenuOpen ? '360px' : '50px', // Slightly wider for tabs
                transition: 'width 0.3s ease-in-out',
                overflow: 'hidden',
                flexShrink: 0
            }}
        >
            {/* Main Content Area */}
            <div
                className="d-flex flex-column flex-grow-1"
                style={{
                    opacity: isSideMenuOpen ? 1 : 0,
                    transition: 'opacity 0.2s',
                    visibility: isSideMenuOpen ? 'visible' : 'hidden',
                    overflow: 'hidden',
                    width: isSideMenuOpen ? 'calc(100% - 50px)' : '0px'
                }}
            >
                <div className="d-flex align-items-center p-2 justify-content-between border-bottom bg-white">
                    <span className="fw-bold text-nowrap ms-2">
                        {activeTab === 'axis' && 'Axes Configuration'}
                        {activeTab === 'filter' && 'Filters'}
                        {activeTab === 'control' && 'Controls'}
                    </span>
                    <button
                        className="btn btn-sm btn-link text-secondary"
                        onClick={toggleSideMenu}
                        title="Collapse Menu"
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                </div>

                <div className="flex-grow-1 overflow-hidden position-relative">
                    {renderContent()}
                </div>
            </div>

            {/* Right Tab Strip */}
            <div
                className="d-flex flex-column align-items-center bg-white border-start"
                style={{
                    width: '50px',
                    minWidth: '50px',
                    height: '100%',
                    paddingTop: '0.5rem',
                    zIndex: 10
                }}
            >
                {/* Provide expand button when collapsed if needed, but tabs can also expand */}
                {!isSideMenuOpen && (
                    <button
                        className="btn btn-sm btn-light text-secondary mb-3"
                        onClick={toggleSideMenu}
                        title="Expand Menu"
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>
                )}

                {renderTabButton('axis', 'Axis', 'bi-bar-chart-steps')}
                {renderTabButton('filter', 'Filter', 'bi-funnel')}
                {renderTabButton('control', 'Control', 'bi-sliders')}
            </div>
        </div>
    );
};

export default SideMenu;
