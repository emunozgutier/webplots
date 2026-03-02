import React, { useMemo } from 'react';
import { useWorkspaceLocalStore } from '../../store/WorkspaceLocalStore';
import Settings from '../PlotAreaComponents/Settings';
import Debug from '../PlotAreaComponents/Debug';
import Plot from 'react-plotly.js';

import { useAxisSideMenuStore } from '../../store/AxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/GroupSideMenuStore';
import { usePlotLayoutStore } from '../../store/PlotLayoutStore';
import { useTraceConfigStore } from '../../store/TraceConfigStore';
import { useInkRatioStore } from '../../store/InkRatioStore';
import { useColorSideMenuStore } from '../../store/ColorSideMenuStore';
import { generatePlotConfig } from '../../utils/PlotlyHelpers';
import PlotAreaControlButtons from './PlotAreaControlButtons';
import { useFilteredData } from '../../hooks/useFilteredData';

const PlotArea: React.FC = () => {
    const data = useFilteredData();
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig, setActiveTraces } = useTraceConfigStore();
    const { inkRatio, absorptionMode, setFilteredStats, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius } = useInkRatioStore();
    const { colorData } = useColorSideMenuStore();

    const { setPopupContent } = useWorkspaceLocalStore();

    const { plotData, layout, hasData, receipt, stats, generatedTraces } = useMemo(
        () => generatePlotConfig(data, sideMenuData, groupSideMenuData, plotLayout, traceConfig, colorData, absorptionMode, inkRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius),
        [data, sideMenuData, groupSideMenuData, plotLayout, traceConfig, colorData, absorptionMode, inkRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius]
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

    const handleOpenSettings = () => {
        setPopupContent(<Settings />);
    };

    const handleOpenDebug = () => {
        setPopupContent(<Debug receipt={receipt || ''} />);
    };

    if (!hasData) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                <div className="display-1 mb-3">📊</div>
                <h4>No Data Loaded</h4>
                <p>Please load a CSV file or Project from the <strong>File</strong> menu to generate a plot.</p>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column h-100">
            <PlotAreaControlButtons
                onOpenSettings={handleOpenSettings}
                onOpenDebug={handleOpenDebug}
            />
            <div className="flex-grow-1 position-relative">
                <Plot
                    data={plotData}
                    layout={layout}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    className="w-100 h-100"
                />
            </div>
        </div>
    );
};

export default PlotArea;
