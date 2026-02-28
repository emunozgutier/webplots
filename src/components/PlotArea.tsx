import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

import { useAxisSideMenuStore } from '../store/AxisSideMenuStore';
import { useGroupSideMenuStore } from '../store/GroupSideMenuStore';
import { useAppStateStore } from '../store/AppStateStore';
import { usePlotLayoutStore } from '../store/PlotLayoutStore';
import { useTraceConfigStore } from '../store/TraceConfigStore';
import { useInkRatioStore } from '../store/InkRatioStore';
import { useColorSideMenuStore } from '../store/ColorSideMenuStore'; // Added this import
import { generatePlotConfig } from '../utils/PlotlyHelpers';
import ControllerButtons from './PlotAreaComponents/ControllerButtons';
import Settings from './PlotAreaComponents/Settings';
import Debug from './PlotAreaComponents/Debug';
import PopupMenu from './PopupMenu';

import { useFilteredData } from '../hooks/useFilteredData';

const PlotArea: React.FC = () => {
    const data = useFilteredData();
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { isSideMenuOpen } = useAppStateStore();
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig, setActiveTraces } = useTraceConfigStore();
    const { inkRatio, setFilteredStats, chartWidth, chartHeight, pointRadius, setChartDimensions, useCustomRadius, customRadius } = useInkRatioStore();
    const { colorData } = useColorSideMenuStore(); // Grabbed colorData
    const containerRef = React.useRef<HTMLDivElement>(null);

    const { plotData, layout, hasData, receipt, stats, generatedTraces } = useMemo(
        () => generatePlotConfig(data, sideMenuData, groupSideMenuData, plotLayout, traceConfig, colorData, inkRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius),
        [data, sideMenuData, groupSideMenuData, plotLayout, traceConfig, colorData, inkRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius]
    );

    // Update stats in store
    const prevStatsRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        const statsStr = JSON.stringify(stats);
        if (stats && statsStr !== prevStatsRef.current) {
            setFilteredStats(stats);
            prevStatsRef.current = statsStr;
        }
    }, [stats, setFilteredStats]);

    // Update active traces in store for settings panels
    const prevTracesRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        const tracesStr = JSON.stringify(generatedTraces);
        if (generatedTraces && tracesStr !== prevTracesRef.current) {
            setActiveTraces(generatedTraces);
            prevTracesRef.current = tracesStr;
        }
    }, [generatedTraces, setActiveTraces]);

    // Force Plotly resize when side menu toggles
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300); // Wait for transition to finish
        return () => clearTimeout(timer);
    }, [isSideMenuOpen]);

    const { setPopupContent } = useAppStateStore();

    // Use ResizeObserver to track container size
    React.useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                // Only update if dimensions actually changed significantly to avoid loops?
                // Or just update.
                setChartDimensions(Math.round(width), Math.round(height));
            }
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [setChartDimensions]);

    const handleOpenSettings = () => {
        setPopupContent(<Settings />);
    };

    const handleOpenDebug = () => {
        // We pass receipt here. Debug component uses it.
        // Wait, receipt comes from useMemo above.
        setPopupContent(<Debug receipt={receipt || ''} />);
    };

    return (
        <div className="flex-grow-1 p-4 d-flex flex-column position-relative" style={{ minWidth: 0 }}>
            <PopupMenu />
            <div className="card shadow-sm flex-grow-1 mb-3">
                <div className="card-header bg-white d-flex justify-content-end align-items-center py-2">
                    <ControllerButtons onOpenSettings={handleOpenSettings} onOpenDebug={handleOpenDebug} />
                </div>
                <div className="card-body p-0 position-relative" ref={containerRef}>
                    {hasData ? (
                        <Plot
                            data={plotData}
                            layout={layout}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            className="w-100 h-100"
                        />
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                            <div className="display-1 mb-3">📊</div>
                            <h4>No Data Loaded</h4>
                            <p>Please load a CSV file or Project from the <strong>File</strong> menu to generate a plot.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlotArea;
