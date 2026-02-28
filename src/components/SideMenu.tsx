import React, { useMemo, useState } from 'react';
import { useCsvDataStore } from '../store/CsvDataStore';
import { useAxisSideMenuStore, createAxisSideMenuConfig } from '../store/AxisSideMenuStore';
import { useAppStateStore } from '../store/AppStateStore';
import AxisSideMenu from './SideMenuComponents/AxisSideMenu';
import FilterSideMenu from './SideMenuComponents/FilterSideMenu';
import InkRationSideMenu from './SideMenuComponents/InkRationSideMenu';
import GroupSideMenu from './SideMenuComponents/GroupSideMenu';

type SideMenuTab = 'axis' | 'filter' | 'group' | 'ink';

const SideMenu: React.FC = () => {
    const { columns: storeColumns } = useCsvDataStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { isSideMenuOpen, toggleSideMenu, sideMenuWidth, setSideMenuWidth } = useAppStateStore();

    const { hasColumns } = useMemo(() => createAxisSideMenuConfig(storeColumns, sideMenuData), [storeColumns, sideMenuData]);
    const { plotType } = sideMenuData;
    const [activeTab, setActiveTab] = useState<SideMenuTab>('axis');
    const [isResizing, setIsResizing] = useState(false);

    React.useEffect(() => {
        if (plotType === 'histogram' && activeTab === 'ink') {
            setActiveTab('axis');
        }
    }, [plotType, activeTab]);

    // Resizing Logic
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            // Min width 200px, Max width 800px or 80vw?
            if (newWidth > 200 && newWidth < 800) {
                setSideMenuWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setSideMenuWidth]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'axis':
                return <AxisSideMenu hasColumns={hasColumns} />;
            case 'filter':
                return <FilterSideMenu />;
            case 'group':
                return <GroupSideMenu />;
            case 'ink':
                return <InkRationSideMenu />;
            default:
                return null;
        }
    };

    const renderTabButton = (tab: SideMenuTab, label: string, iconClass: string) => (
        <button
            className={`btn btn-sm w-100 mb-2 p-2 ${activeTab === tab ? 'btn-primary' : 'btn-light text-secondary'} border-0 rounded-0 rounded-start`}
            onClick={() => {
                if (activeTab === tab) {
                    toggleSideMenu();
                } else {
                    if (!isSideMenuOpen) toggleSideMenu();
                    setActiveTab(tab);
                }
            }}
            title={label}
            style={{ borderRadius: '4px 0 0 4px', position: 'relative', right: '-1px' }}
        >
            <div className="d-flex flex-column align-items-center">
                <i className={`bi ${iconClass} fs-5`}></i>
                <span style={{ fontSize: '0.65rem', marginTop: '2px', textAlign: 'center', lineHeight: '1.1' }}>{label}</span>
            </div>
        </button>
    );

    return (
        <div
            className="bg-light border-end d-flex position-relative"
            style={{
                width: isSideMenuOpen ? `${sideMenuWidth}px` : '50px',
                transition: isResizing ? 'none' : 'width 0.3s ease-in-out',
                overflow: 'visible',
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
                    width: isSideMenuOpen ? `calc(100% - 50px)` : '0px'
                }}
            >
                <div className="d-flex align-items-center p-2 justify-content-between border-bottom bg-white">
                    <span className="fw-bold text-nowrap ms-2">
                        {activeTab === 'axis' && 'Axes Configuration'}
                        {activeTab === 'filter' && 'Filters'}
                        {activeTab === 'group' && 'Group Settings'}
                        {activeTab === 'ink' && 'Ink Ratio'}
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
                {renderTabButton('group', 'Group', 'bi-diagram-3')}
                {plotType !== 'histogram' && renderTabButton('ink', 'Ink Ratio', 'bi-droplet')}
            </div>

            {/* Resize Handle - Only visible when open */}
            {isSideMenuOpen && (
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        right: '-5px',
                        top: 0,
                        bottom: 0,
                        width: '10px',
                        cursor: 'col-resize',
                        zIndex: 100, // Above everything
                        backgroundColor: 'transparent' // Invisible hit area
                    }}
                    title="Drag to resize"
                />
            )}
        </div>
    );
};

export default SideMenu;
