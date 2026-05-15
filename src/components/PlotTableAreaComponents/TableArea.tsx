import React, { useMemo, useState } from 'react';
import { Table } from 'react-bootstrap';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { Step_1_filter } from '../../utils/DataFrameLib';
import { useAxisSideMenuStore } from '../../store/SideMenu/useAxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/SideMenu/useGroupSideMenuStore';
import { useFilterSideMenuStore } from '../../store/SideMenu/useFilterSideMenuStore';
import { useStyleSideMenuStore } from '../../store/SideMenu/useStyleSideMenuStore';
import HeaderSummary from './TableAreaComponents/HeaderSummary';
import { useWorkspaceLocalStore } from '../../store/Workspace/useWorkspaceLocalStore';
import { useTableStore } from '../../store/PlotTable/useTableStore';
import Plot from 'react-plotly.js';
import ControlButtons from './TableAreaComponents/ControlButtons';
import BatchButtons from './TableAreaComponents/BatchButtons';
import { calculateGaussianStats, formatNumber, parseToNumeric, sortData } from '../../utils/TableMathLib';

const TableArea: React.FC = () => {
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [currentBatch, setCurrentBatch] = useState(0);
    const BATCH_SIZE = 100;
    const { setPopupContent } = useWorkspaceLocalStore();
    const { 
        summaryMode, 
        setSummaryMode, 
        datasetMode, 
        setDatasetMode, 
        colorMode, 
        setColorMode,
        numberFormat,
        significantDigits,
        alignDecimal,
        gaussianConfidenceThreshold,
        gaussianMaxComponents,
        sortConfig,
        setSortConfig
    } = useTableStore();

    const handleSortAsc = (key: string) => {
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') setSortConfig(null);
        else setSortConfig({ key, direction: 'asc' });
    };

    const handleSortDesc = (key: string) => {
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') setSortConfig(null);
        else setSortConfig({ key, direction: 'desc' });
    };

    const handleZoom = (key: string) => {
        const rawValues = displayData.map((row: any) => row[key]).filter((v: any) => v !== null && v !== undefined && v !== '');
        const numericValues = rawValues.map((v: any) => Number(v)).filter((v: any) => !isNaN(v));

        if (numericValues.length > 0) {
            const count = numericValues.length;
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const avg = sum / count;
            let variance = 0;
            for (let v of numericValues) variance += Math.pow(v - avg, 2);
            variance /= count;
            const stdDev = Math.sqrt(variance);

            const { isGaussian, components } = calculateGaussianStats(numericValues, stdDev, count, gaussianConfidenceThreshold, gaussianMaxComponents);

            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            const binsCount = Math.min(50, Math.max(15, Math.ceil(Math.log2(count) + 1)));
            const binSize = max > min ? (max - min) / binsCount : 1;

            const plotData: any[] = [{
                x: numericValues,
                type: 'histogram',
                name: 'Data',
                marker: { color: '#0d6efd' },
                xbins: { start: min, end: max, size: binSize }
            }];

            if (isGaussian && components && components.length > 0) {
                const points = 150;

                // Only display individual Gaussians, disable the "Total Fit" line
                components.forEach((comp, idx) => {
                    const compXs = [];
                    const compYs = [];
                    for (let i = 0; i <= points; i++) {
                        const x = min + (i / points) * (max - min);
                        const z = (x - comp.mean) / comp.stdDev;
                        const pdf = comp.weight * (1 / (comp.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
                        compXs.push(x);
                        compYs.push(pdf * count * binSize);
                    }
                    plotData.push({
                        x: compXs,
                        y: compYs,
                        type: 'scatter',
                        mode: 'lines',
                        name: components.length > 1 ? `Gaussian ${idx + 1} (${Math.round(comp.weight * 100)}%)` : 'Gaussian Fit',
                        line: { width: components.length > 1 ? 1.5 : 2, dash: components.length > 1 ? 'dot' : 'solid' }
                    });
                });
            }

            const shapes: any[] = [];
            const annotations: any[] = [];

            if (isGaussian && components && components.length > 0) {
                components.forEach((comp, idx) => {
                    const suffix = components.length > 1 ? `${idx + 1}` : '';
                    const weightText = components.length > 1 ? ` (${Math.round(comp.weight * 100)}%)` : '';

                    // Mean line
                    shapes.push({ type: 'line', x0: comp.mean, x1: comp.mean, y0: 0, y1: 1, yref: 'paper', xref: 'x', line: { color: 'rgba(220, 53, 69, 0.8)', width: 2, dash: 'dash' } });
                    annotations.push({ x: comp.mean, y: 1.05 + (idx % 2 === 0 ? 0 : 0.05), yref: 'paper', xref: 'x', text: `μ${suffix}${weightText}`, showarrow: false, font: { color: '#dc3545', size: 10 } });

                    // -1 Sigma line
                    shapes.push({ type: 'line', x0: comp.mean - comp.stdDev, x1: comp.mean - comp.stdDev, y0: 0, y1: 1, yref: 'paper', xref: 'x', line: { color: 'rgba(13, 110, 253, 0.4)', width: 1, dash: 'dot' } });
                    annotations.push({ x: comp.mean - comp.stdDev, y: 1.02, yref: 'paper', xref: 'x', text: `-1σ${suffix}`, showarrow: false, font: { color: '#0d6efd', size: 9 } });

                    // +1 Sigma line
                    shapes.push({ type: 'line', x0: comp.mean + comp.stdDev, x1: comp.mean + comp.stdDev, y0: 0, y1: 1, yref: 'paper', xref: 'x', line: { color: 'rgba(13, 110, 253, 0.4)', width: 1, dash: 'dot' } });
                    annotations.push({ x: comp.mean + comp.stdDev, y: 1.02, yref: 'paper', xref: 'x', text: `+1σ${suffix}`, showarrow: false, font: { color: '#0d6efd', size: 9 } });
                });
            } else if (stdDev > 0) {
                // Global Mean line (Not a multi-gaussian fit)
                shapes.push({ type: 'line', x0: avg, x1: avg, y0: 0, y1: 1, yref: 'paper', xref: 'x', line: { color: 'rgba(220, 53, 69, 0.8)', width: 2, dash: 'dash' } });
                annotations.push({ x: avg, y: 1.05, yref: 'paper', xref: 'x', text: 'Mean', showarrow: false, font: { color: '#dc3545', size: 11 } });
            }

            setPopupContent(
                <div className="bg-white p-4 rounded shadow d-flex flex-column" style={{ width: '100%', height: '100%' }}>
                    <h4>Distribution of {key}</h4>
                    <div className="flex-grow-1 position-relative">
                        <Plot
                            data={plotData}
                            layout={{
                                autosize: true,
                                margin: { l: 40, r: 40, t: 60, b: 40 },
                                showlegend: isGaussian,
                                shapes,
                                annotations
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            );
        } else {
            const counts: Record<string, number> = {};
            rawValues.forEach((v: any) => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
            setPopupContent(
                <div className="bg-white p-4 rounded shadow d-flex flex-column" style={{ width: '100%', height: '100%' }}>
                    <h4>Frequencies of {key}</h4>
                    <div className="flex-grow-1 position-relative">
                        <Plot
                            data={[{ x: Object.keys(counts), y: Object.values(counts), type: 'bar', marker: { color: '#0d6efd' } }]}
                            layout={{ autosize: true, margin: { l: 40, r: 40, t: 40, b: 60 } }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            );
        }
    };

    // Store sources for "used" columns
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { filters } = useFilterSideMenuStore();
    const { colorData } = useStyleSideMenuStore();

    // Data Sources
    const { data: allData, columns: allColumns } = useCsvDataStore();
    const filteredData = useMemo(() => {
        return Step_1_filter(allData, filters);
    }, [allData, filters]);

    // Compute which columns are currently "used" in the plot
    const usedColumns = useMemo(() => {
        const cols = new Set<string>();

        // Axis columns
        if (sideMenuData.xAxis) cols.add(sideMenuData.xAxis);
        sideMenuData.yAxis.forEach(y => cols.add(y));

        // Grouping columns
        if (groupSideMenuData.groupAxis) cols.add(groupSideMenuData.groupAxis);

        // Filter columns
        filters.forEach(f => cols.add(f.column));

        // Color/Style columns (only add if source is 'column')
        if (colorData.hue.source === 'column' && typeof colorData.hue.value === 'string') {
            cols.add(colorData.hue.value);
        }
        if (colorData.saturation.source === 'column' && typeof colorData.saturation.value === 'string') {
            cols.add(colorData.saturation.value);
        }
        if (colorData.lightness.source === 'column' && typeof colorData.lightness.value === 'string') {
            cols.add(colorData.lightness.value);
        }
        if (colorData.shape.source === 'column' && typeof colorData.shape.value === 'string') {
            cols.add(colorData.shape.value);
        }

        return Array.from(cols);
    }, [sideMenuData, groupSideMenuData, filters, colorData]);

    const displayData = useMemo(() => {
        return datasetMode === 'all' ? allData : filteredData;
    }, [allData, filteredData, datasetMode]);
    const displayColumns = datasetMode === 'all' ? allColumns : usedColumns;

    // Reset selection and batch when dataset changes
    React.useEffect(() => {
        setSelectedCell(null);
        setSortConfig(null);
        setCurrentBatch(0);
    }, [datasetMode, displayData, displayColumns]);

    // Automatically switch back to 'all' if nothing is plotted on Y-axis
    React.useEffect(() => {
        if (datasetMode === 'plot' && sideMenuData.yAxis.length === 0) {
            setDatasetMode('all');
        }
    }, [sideMenuData.yAxis.length, datasetMode, setDatasetMode]);

    // Compute stats for detailed mode color coding
    const numericStats = useMemo(() => {
        if (colorMode !== 'color') return {};

        const stats: Record<string, { min: number, max: number }> = {};
        displayColumns.forEach(col => {
            let numCount = 0;
            let min = Infinity;
            let max = -Infinity;
            let totalProcessed = 0;

            // Iterate over all data without creating intermediate mapped arrays
            // This prevents "Maximum call stack size" crashes from spreading huge arrays
            for (let i = 0; i < displayData.length; i++) {
                const row = displayData[i];
                if (!row) continue;

                const v = (row as any)[col];
                if (v === null || v === undefined || v === '') continue;

                totalProcessed++;
                const numV = parseToNumeric(v);
                if (numV !== null) {
                    numCount++;
                    if (numV < min) min = numV;
                    if (numV > max) max = numV;
                }
            }

            // If more than 80% are numbers, treat as numeric column for color coding
            if (totalProcessed > 0 && numCount / totalProcessed > 0.8 && min !== Infinity) {
                stats[col] = { min, max };
            }
        });
        return stats;
    }, [displayData, displayColumns, colorMode]);

    const sortedData = useMemo(() => {
        return sortData(displayData, sortConfig);
    }, [displayData, sortConfig]);

    const totalBatches = Math.max(1, Math.ceil(sortedData.length / BATCH_SIZE));
    const batchedData = useMemo(() => {
        const start = currentBatch * BATCH_SIZE;
        return sortedData.slice(start, start + BATCH_SIZE);
    }, [sortedData, currentBatch]);

    const [scrollTop, setScrollTop] = useState(0);
    const [clientHeight, setClientHeight] = useState(0);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Track scroll position
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
        if (clientHeight === 0) setClientHeight(e.currentTarget.clientHeight);
    };

    // Calculate visible rows for virtualization
    const rowHeight = 36.5; // Estimated row height in pixels for Bootstrap size="sm" Table
    const buffer = 10;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const endIndex = Math.min(batchedData.length, startIndex + Math.ceil((clientHeight || 1000) / rowHeight) + buffer * 2);

    // Virtualized slice
    const slicedData = batchedData.slice(startIndex, endIndex);

    if (!displayData || displayData.length === 0) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                <div className="display-1 mb-3">📇</div>
                <h4>No Data Loaded</h4>
                <p>Please load a CSV file or Project from the <strong>File</strong> menu to view the data table.</p>
            </div>
        );
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!selectedCell) return;

        const maxRow = sortedData.length - 1;
        // displayColumns length + 1 (for the index column)
        const maxCol = displayColumns.length;

        let { row, col } = selectedCell;

        if (e.key === 'ArrowUp') {
            row = Math.max(0, row - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            row = Math.min(maxRow, row + 1);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            col = Math.max(0, col - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            col = Math.min(maxCol, col + 1);
            e.preventDefault();
        } else {
            return;
        }

        setSelectedCell({ row, col });

        // Ensure focused item scrolls into view by manually adjusting scrollTop
        if (scrollContainerRef.current) {
            const rowOffsetTop = row * rowHeight;
            const containerHeight = scrollContainerRef.current.clientHeight;
            const currentScroll = scrollContainerRef.current.scrollTop;

            if (rowOffsetTop < currentScroll) {
                // Scroll up
                scrollContainerRef.current.scrollTop = rowOffsetTop;
            } else if (rowOffsetTop > currentScroll + containerHeight - rowHeight * 2) {
                // Scroll down
                scrollContainerRef.current.scrollTop = rowOffsetTop - containerHeight + rowHeight * 2;
            }
        }
    };

    return (
        <div
            className="d-flex flex-column p-3 bg-white"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            style={{ outline: 'none', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        >
            <style>{`
                .table-scroll-container::-webkit-scrollbar {
                    width: 14px;
                    height: 14px;
                }
                .table-scroll-container::-webkit-scrollbar-track {
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                .table-scroll-container::-webkit-scrollbar-thumb {
                    background-color: #adb5bd;
                    border-radius: 4px;
                    border: 3px solid #f8f9fa;
                }
                .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background-color: #6c757d;
                }
                .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #adb5bd #f8f9fa;
                }
                .monospaced-cell {
                    white-space: pre !important;
                }
            `}</style>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div></div>
                <ControlButtons
                    summaryMode={summaryMode}
                    setSummaryMode={setSummaryMode}
                    datasetMode={datasetMode}
                    setDatasetMode={setDatasetMode}
                    colorMode={colorMode}
                    setColorMode={setColorMode}
                    hasPlotData={sideMenuData.yAxis.length > 0}
                />
            </div>

            <div className="d-flex flex-row flex-grow-1 overflow-hidden border rounded">
                <div
                    className="flex-grow-1 overflow-auto table-scroll-container"
                    style={{ position: 'relative' }}
                    onScroll={handleScroll}
                    ref={scrollContainerRef}
                >
                    {/* Virtualized Container Inner Wrapper */}
                    <div style={{ height: batchedData.length * rowHeight, position: 'relative' }}>
                        <Table bordered hover size="sm" className="mb-0" style={{ position: 'absolute', top: 0, left: 0, width: '100%', minWidth: 'max-content' }}>
                            <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                                <tr>
                                    <th 
                                        className="bg-light align-top p-1"
                                        style={{ 
                                            position: 'sticky', 
                                            left: 0, 
                                            zIndex: 13, 
                                            minWidth: '45px',
                                            backgroundColor: '#f8f9fa',
                                            boxShadow: 'inset -2px 0 0 0 #dee2e6',
                                            backgroundClip: 'padding-box'
                                        }}
                                    >
                                        <div className={summaryMode === 'none' ? "d-flex justify-content-between align-items-center" : "d-flex flex-column align-items-center"}>
                                            <div className="fw-bold small mb-1">row</div>
                                            <div className={summaryMode === 'none' ? "btn-group ms-2" : "btn-group-vertical"}>
                                                <button
                                                    className={`btn btn-sm py-0 px-1 ${sortConfig?.key === '__idx' && sortConfig?.direction === 'asc' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    title="Sort row Ascending"
                                                    onClick={() => handleSortAsc('__idx')}
                                                >
                                                    <i className="bi bi-arrow-up" style={{ fontSize: '0.7rem' }}></i>
                                                </button>
                                                <button
                                                    className={`btn btn-sm py-0 px-1 ${sortConfig?.key === '__idx' && sortConfig?.direction === 'desc' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    title="Sort row Descending"
                                                    onClick={() => handleSortDesc('__idx')}
                                                >
                                                    <i className="bi bi-arrow-down" style={{ fontSize: '0.7rem' }}></i>
                                                </button>
                                            </div>
                                        </div>
                                    </th>
                                    {displayColumns.map((col: string, idx: number) => (
                                        <th
                                            key={idx}
                                            className="bg-light align-top"
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <div className="fw-bold">{col}</div>
                                                <div className="d-flex gap-1 ms-2">
                                                    <div className="btn-group">
                                                        <button
                                                            className={`btn btn-sm py-0 px-1 ${sortConfig?.key === col && sortConfig?.direction === 'asc' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                            title="Sort Ascending"
                                                            onClick={() => handleSortAsc(col)}
                                                        >
                                                            <i className="bi bi-arrow-up"></i>
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm py-0 px-1 ${sortConfig?.key === col && sortConfig?.direction === 'desc' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                            title="Sort Descending"
                                                            onClick={() => handleSortDesc(col)}
                                                        >
                                                            <i className="bi bi-arrow-down"></i>
                                                        </button>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm btn-outline-info py-0 px-1 ms-1"
                                                        title="Zoom Data"
                                                        onClick={() => handleZoom(col)}
                                                    >
                                                        <i className="bi bi-zoom-in"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <HeaderSummary 
                                                data={displayData} 
                                                column={col} 
                                                mode={summaryMode} 
                                                confidenceThreshold={gaussianConfidenceThreshold}
                                                maxComponents={gaussianMaxComponents}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Spacer row to push down visible items correctly without moving the header */}
                                {startIndex > 0 && (
                                    <tr style={{ height: `${startIndex * rowHeight}px` }}>
                                        <td colSpan={displayColumns.length + 1} style={{ padding: 0, border: 'none' }}></td>
                                    </tr>
                                )}
                                {slicedData.map((row: any, i: number) => {
                                    const rowIndex = startIndex + i;
                                    const isRowSelected = selectedCell?.row === rowIndex;
                                    return (
                                        <tr key={rowIndex} style={{ height: `${rowHeight}px` }}>
                                                <td
                                                    id={`cell-${rowIndex}-0`}
                                                    className="text-muted fw-bold"
                                                    style={{ 
                                                        position: 'sticky', 
                                                        left: 0, 
                                                        zIndex: 5, 
                                                        backgroundColor: '#fff',
                                                        fontFamily: "'Source Code Pro', monospace",
                                                        boxShadow: 'inset -2px 0 0 0 #dee2e6',
                                                        backgroundClip: 'padding-box'
                                                    }}
                                                onClick={() => setSelectedCell({ row: rowIndex, col: 0 })}
                                                tabIndex={-1}
                                            >
                                                {(row as any).__idx}
                                            </td>
                                            {displayColumns.map((col: string, idx: number) => {
                                                const colIndex = idx + 1;
                                                const isColSelected = selectedCell?.col === colIndex;
                                                const isCellSelected = isRowSelected && isColSelected;
 
                                                // Make sure boolean and null map to string for display
                                                const val = row[col];
                                                let displayVal: any = val;
                                                
                                                const isYearCol = col.toLowerCase().includes('year');
                                                
                                                if (val === null || val === undefined) {
                                                    displayVal = '';
                                                } else if (typeof val === 'boolean') {
                                                    displayVal = String(val);
                                                } else if (typeof val === 'number') {
                                                    if (isYearCol) {
                                                        displayVal = String(val);
                                                    } else {
                                                        displayVal = formatNumber(val, numberFormat, significantDigits, alignDecimal);
                                                    }
                                                } else if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
                                                    // Also format strings that look like numbers
                                                    if (isYearCol) {
                                                        displayVal = val;
                                                    } else {
                                                        displayVal = formatNumber(Number(val), numberFormat, significantDigits, alignDecimal);
                                                    }
                                                }
 
                                                let bgColor = '';
                                                let textColor = isCellSelected ? '#fff' : '';
 
                                                if (isCellSelected) {
                                                    bgColor = '#0d6efd'; // Primary blue
                                                } else if (colorMode === 'color' && numericStats[col]) {
                                                    const { min, max } = numericStats[col];
                                                    const numVal = parseToNumeric(val);
                                                    // Make sure we have a valid range
                                                    if (numVal !== null && max > min) {
                                                        const ratio = (numVal - min) / (max - min);
                                                        // Color scale: Red (High) to Blue (Low)
                                                        // We can make the color vibrant but semi-transparent so text is readable
                                                        const r = Math.round(ratio * 255);
                                                        const b = Math.round((1 - ratio) * 255);
                                                        bgColor = `rgba(${r}, 40, ${b}, 0.25)`;
                                                        textColor = '#000'; // Force black text for contrast against gradient
                                                    }
                                                }
 
                                                return (
                                                    <td
                                                        id={`cell-${rowIndex}-${colIndex}`}
                                                        key={idx}
                                                        className="monospaced-cell"
                                                        style={{ 
                                                            backgroundColor: bgColor, 
                                                            color: textColor, 
                                                            cursor: 'cell',
                                                            fontFamily: "'Source Code Pro', monospace"
                                                        }}
                                                        onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                                                    >
                                                        {displayVal as React.ReactNode}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </div>
                <BatchButtons
                    currentBatch={currentBatch}
                    totalBatches={totalBatches}
                    onBatchChange={setCurrentBatch}
                />
            </div>
        </div>
    );
};

export default TableArea;
