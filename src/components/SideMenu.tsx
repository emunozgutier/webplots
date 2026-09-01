import React, { useMemo, useState } from 'react';
import { useCsvDataStore } from '../store/useCsvDataStore';
import { useAxisSideMenuStore, createAxisSideMenuConfig } from '../store/SideMenu/useAxisSideMenuStore';
import { usePlotTypeSideMenuStore } from '../store/SideMenu/usePlotTypeSideMenuStore';
import { useAppLocalStore } from '../store/useAppLocalStore';
import PlotTypeSideMenu from './SideMenuComponents/PlotTypeSideMenu';
import AxisSideMenu from './SideMenuComponents/AxisSideMenu';
import FilterSideMenu from './SideMenuComponents/FilterSideMenu';
import InkRationSideMenu from './SideMenuComponents/InkRationSideMenu';
import GroupSideMenu from './SideMenuComponents/GroupSideMenu';
import StyleSideMenu from './SideMenuComponents/StyleSideMenu';
import CreateColumnSideMenu from './SideMenuComponents/CreateColumnSideMenu';
import SubplotSideMenu from './SideMenuComponents/SubplotSideMenu';
import AnimationSideMenu from './SideMenuComponents/AnimationSideMenu';
import AnnotationSideMenu from './SideMenuComponents/AnnotationSideMenu';
import IconTab from './SideMenuComponents/IconTab';

type SideMenuTab = 'create' | 'type' | 'axis' | 'filter' | 'group' | 'color' | 'ink' | 'subplots' | 'animation' | 'annotation';

const SideMenu: React.FC = () => {
    const { columns: storeColumns } = useCsvDataStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { plotTypeSideMenuData } = usePlotTypeSideMenuStore();
    const { plotType } = plotTypeSideMenuData;
    const { isSideMenuOpen, toggleSideMenu, sideMenuWidth, setSideMenuWidth } = useAppLocalStore();


    const { hasColumns } = useMemo(() => createAxisSideMenuConfig(storeColumns, sideMenuData), [storeColumns, sideMenuData]);
    const [activeTab, setActiveTab] = useState<SideMenuTab>('type');
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
            case 'create':
                return <CreateColumnSideMenu />;
            case 'type':
                return <PlotTypeSideMenu />;
            case 'axis':
                return <AxisSideMenu hasColumns={hasColumns} />;
            case 'filter':
                return <FilterSideMenu />;
            case 'group':
                return <GroupSideMenu />;
            case 'color':
                return <StyleSideMenu />;
            case 'ink':
                return <InkRationSideMenu />;
            case 'subplots':
                return <SubplotSideMenu />;
            case 'animation':
                return <AnimationSideMenu />;
            case 'annotation':
                return <AnnotationSideMenu />;
            default:
                return null;
        }
    };

    const handleTabClick = (tab: SideMenuTab) => {
        if (activeTab === tab) {
            toggleSideMenu();
        } else {
            if (!isSideMenuOpen) toggleSideMenu();
            setActiveTab(tab);
        }
    };

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
                        {activeTab === 'create' && 'Create Column'}
                        {activeTab === 'type' && 'Plot Type'}
                        {activeTab === 'axis' && 'Axes Configuration'}
                        {activeTab === 'filter' && 'Filters'}
                        {activeTab === 'group' && 'Group Settings'}
                        {activeTab === 'color' && 'Color & Style'}
                        {activeTab === 'ink' && 'Ink-Data Ratio'}
                        {activeTab === 'subplots' && 'Subplots Settings'}
                        {activeTab === 'animation' && 'Animation'}
                        {activeTab === 'annotation' && 'Annotations'}
                    </span>

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


                <IconTab
                    tab="create"
                    activeTab={activeTab}
                    label="Create"
                    iconClass="bi-plus-square"
                    onClick={() => handleTabClick('create')}
                />
                <IconTab
                    tab="type"
                    activeTab={activeTab}
                    label="Type"
                    iconClass="bi-bar-chart-line"
                    onClick={() => handleTabClick('type')}
                />
                <IconTab
                    tab="axis"
                    activeTab={activeTab}
                    label="Axis"
                    iconClass="bi-bar-chart-steps"
                    onClick={() => handleTabClick('axis')}
                />
                <IconTab
                    tab="filter"
                    activeTab={activeTab}
                    label="Filter"
                    iconClass="bi-funnel"
                    onClick={() => handleTabClick('filter')}
                />
                <IconTab
                    tab="group"
                    activeTab={activeTab}
                    label="Group"
                    iconClass="bi-diagram-3"
                    onClick={() => handleTabClick('group')}
                />
                <IconTab
                    tab="subplots"
                    activeTab={activeTab}
                    label="Subplots"
                    iconClass="bi-grid-1x2"
                    onClick={() => handleTabClick('subplots')}
                />
                <IconTab
                    tab="color"
                    activeTab={activeTab}
                    label="Style"
                    iconClass="bi-palette"
                    onClick={() => handleTabClick('color')}
                />
                {plotType !== 'histogram' && (
                    <IconTab
                        tab="ink"
                        activeTab={activeTab}
                        label="Ink Ratio"
                        iconClass="bi-droplet"
                        onClick={() => handleTabClick('ink')}
                    />
                )}
                <IconTab
                    tab="animation"
                    activeTab={activeTab}
                    label="Animation"
                    iconClass="bi-play-circle"
                    onClick={() => handleTabClick('animation')}
                />
                <IconTab
                    tab="annotation"
                    activeTab={activeTab}
                    label="Annotate"
                    iconClass="bi-chat-square-text"
                    onClick={() => handleTabClick('annotation')}
                />
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
