import React from 'react';
import { useWorkspaceLocalStore } from '../store/WorkspaceLocalStore';
import { ViewToggleButtons } from './PlotAreaComponents/ControllerButtons';
import PopupMenu from './PopupMenu';
import TableArea from './PlotTableAreaComponents/TableArea';
import PlotArea from './PlotTableAreaComponents/PlotArea';
import { useInkRatioStore } from '../store/InkRatioStore';

const PlotTableArea: React.FC = () => {
    const [viewMode, setViewMode] = React.useState<'plot' | 'table'>('plot');
    const { isSideMenuOpen } = useWorkspaceLocalStore();
    const { setChartDimensions } = useInkRatioStore();
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Force Plotly resize when side menu toggles
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300); // Wait for transition to finish
        return () => clearTimeout(timer);
    }, [isSideMenuOpen]);

    // Use ResizeObserver to track container size
    React.useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setChartDimensions(Math.round(width), Math.round(height));
            }
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [setChartDimensions]);

    return (
        <div className="flex-grow-1 p-4 d-flex flex-column position-relative" style={{ minWidth: 0 }}>
            <PopupMenu />
            <div className="card shadow-sm flex-grow-1 mb-3">
                <div className="card-header bg-white d-flex justify-content-end align-items-center py-2">
                    <ViewToggleButtons
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                </div>
                <div className="card-body p-0 position-relative" ref={containerRef}>
                    {viewMode === 'table' ? (
                        <TableArea />
                    ) : (
                        <PlotArea />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlotTableArea;
