import React, { useMemo } from 'react';
import { useWorkspaceLocalStore } from '../../store/Workspace/useWorkspaceLocalStore';
import Settings from './Settings';
import Debug from './Debug';
import Plot from 'react-plotly.js';

import { useAxisSideMenuStore } from '../../store/SideMenu/useAxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/SideMenu/useGroupSideMenuStore';
import { usePlotLayoutStore } from '../../store/PlotTable/usePlotLayoutStore';
import { useTraceConfigStore } from '../../store/PlotTable/useTraceConfigStore';
import { useInkRatioStore } from '../../store/SideMenu/useInkRatioStore';
import { useStyleSideMenuStore } from '../../store/SideMenu/useStyleSideMenuStore';
import { useSubplotSideMenuStore } from '../../store/SideMenu/useSubplotSideMenuStore';
import { useAnimationSideMenuStore } from '../../store/SideMenu/useAnimationSideMenuStore';
import { useAnnotationSideMenuStore } from '../../store/SideMenu/useAnnotationSideMenuStore';
import { generatePlotConfig } from '../../utils/PlotlyHelpers';
import { runDataPipeline } from '../../utils/DataFrameLib';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { useFilterSideMenuStore } from '../../store/SideMenu/useFilterSideMenuStore';
import ControlButtons from './ControlButtons';
import AnimationControls from './AnimationControls';

interface PlotAreaProps {
    viewMode: 'plot' | 'table';
    setViewMode: (mode: 'plot' | 'table') => void;
}

const PlotArea: React.FC<PlotAreaProps> = ({ viewMode, setViewMode }) => {
    const { data: rawDataTable } = useCsvDataStore();
    const { filters } = useFilterSideMenuStore();
    const { animationData } = useAnimationSideMenuStore();
    const { annotations: annotationData } = useAnnotationSideMenuStore();

    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig, setActiveTraces } = useTraceConfigStore();
    const { inkRatio, absorptionMode, absorbedPoint, maxRadiusRatio, setFilteredStats, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius, setChartDimensions } = useInkRatioStore();
    const { colorData } = useStyleSideMenuStore();
    const subplotData = useSubplotSideMenuStore();

    const { setPopupContent } = useWorkspaceLocalStore();
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Synchronize dimensions
    React.useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setChartDimensions(width, height);
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [setChartDimensions]);

    const { plotData, layout, hasData, receipt, stats, generatedTraces, pipelineFiltered } = useMemo(() => {
        const shouldLimit = !animationData.animationColumn && rawDataTable.length > 2048;
        const dataToProcess = shouldLimit ? rawDataTable.slice(0, 2048) : rawDataTable;
        const { processedTraces, filtered: pipelineFiltered } = runDataPipeline(dataToProcess, filters, sideMenuData, groupSideMenuData, {
            inkRatio,
            absorbedPoint,
            chartWidth,
            chartHeight,
            pointRadius,
            useCustomRadius,
            customRadius,
            enableLogXAxis: plotLayout.enableLogXAxis,
            enableLogYAxis: plotLayout.enableLogYAxis
        }, colorData);

        // Step 4: Final Plotly Configuration
        const plotConfig = generatePlotConfig(
            pipelineFiltered,
            processedTraces,
            sideMenuData,
            plotLayout,
            traceConfig,
            colorData,
            subplotData,
            absorptionMode,
            maxRadiusRatio,
            groupSideMenuData.groupAxis,
            animationData,
            annotationData
        );
        return { ...plotConfig, pipelineFiltered };
    }, [
        rawDataTable, filters, sideMenuData, groupSideMenuData, plotLayout, traceConfig, colorData,
        subplotData, absorptionMode, absorbedPoint, maxRadiusRatio, inkRatio, chartWidth,
        chartHeight, pointRadius, useCustomRadius, customRadius, animationData, annotationData
    ]);

    const uniqueAnimationValuesCount = useMemo(() => {
        if (!animationData.animationColumn || !pipelineFiltered || pipelineFiltered.length === 0) return 0;
        const values = new Set<string | number>();
        for (let i = 0; i < pipelineFiltered.length; i++) {
            const val = pipelineFiltered[i][animationData.animationColumn];
            if (val !== undefined && val !== null && val !== '') {
                values.add(val);
            }
        }
        return values.size;
    }, [animationData.animationColumn, pipelineFiltered]);

    const transitionDuration = uniqueAnimationValuesCount > 0 
        ? Math.max(20, Math.floor((10000 / uniqueAnimationValuesCount) / (animationData.speedMultiplier || 1)))
        : 500;


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
            <ControlButtons
                onOpenSettings={handleOpenSettings}
                onOpenDebug={handleOpenDebug}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />
            <div ref={containerRef} className="flex-grow-1 position-relative d-flex flex-column">
                <div className="flex-grow-1" style={{ minHeight: 0 }}>
                    <Plot
                        data={plotData}
                        layout={{
                            ...layout,
                            transition: {
                                duration: transitionDuration,
                                easing: 'cubic-in-out'
                            }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        className="w-100 h-100"
                    />
                </div>
                {animationData.animationColumn && (
                    <div style={{ flexShrink: 0 }}>
                        <AnimationControls data={pipelineFiltered} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlotArea;
