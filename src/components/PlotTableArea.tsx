import React from 'react';
import { useAppLocalStore } from '../store/useAppLocalStore';
import TableArea from './PlotTableAreaComponents/TableArea';
import PlotArea from './PlotTableAreaComponents/PlotArea';
import { useInkRatioStore } from '../store/SideMenu/useInkRatioStore';

const PlotTableArea: React.FC = () => {
    const [viewMode, setViewMode] = React.useState<'plot' | 'table'>('table');
    const { isSideMenuOpen } = useAppLocalStore();
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

        let debounceTimer: ReturnType<typeof setTimeout>;

        const observer = new ResizeObserver((entries) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    setChartDimensions(Math.round(width), Math.round(height));
                }
            }, 200); // Debounce to prevent lag during SideMenu animation
        });

        observer.observe(containerRef.current);

        return () => {
            clearTimeout(debounceTimer);
            observer.disconnect();
        };
    }, [setChartDimensions]);

    return (
        <div className="flex-grow-1 p-1 d-flex flex-column position-relative" style={{ minWidth: 0 }}>
            <div className="p-1 card shadow-sm flex-grow-1 mb-3">
                <div className="card-body p-0 position-relative" ref={containerRef}>
                    {viewMode === 'table' ? (
                        <TableArea viewMode={viewMode} setViewMode={setViewMode} />
                    ) : (
                        <PlotArea viewMode={viewMode} setViewMode={setViewMode} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlotTableArea;
