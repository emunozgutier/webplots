import React, { useMemo, useState } from 'react';
import { Table } from 'react-bootstrap';
import { useCsvDataStore } from '../../store/CsvDataStore';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAxisSideMenuStore } from '../../store/AxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/GroupSideMenuStore';
import { useFilterSideMenuStore } from '../../store/FilterSideMenuStore';
import { useColorSideMenuStore } from '../../store/ColorSideMenuStore';
import HeaderSummary, { type SummaryMode } from './HeaderSummary';
import { useWorkspaceLocalStore } from '../../store/WorkspaceLocalStore';
import Plot from 'react-plotly.js';
import TableAreaControlButtons from './TableAreaControlButtons';

const TableArea: React.FC = () => {
    const [datasetMode, setDatasetMode] = useState<'all' | 'plot'>('plot');
    const [summaryMode, setSummaryMode] = useState<SummaryMode>('none');
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const { setPopupContent } = useWorkspaceLocalStore();

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
            setPopupContent(
                <div className="bg-white p-4 rounded shadow d-flex flex-column" style={{ width: '100%', height: '100%' }}>
                    <h4>Distribution of {key}</h4>
                    <div className="flex-grow-1 position-relative">
                        <Plot
                            data={[{ x: numericValues, type: 'histogram', marker: { color: '#0d6efd' } }]}
                            layout={{ autosize: true, margin: { l: 40, r: 40, t: 40, b: 40 } }}
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

    // Data Sources
    const { data: allData, columns: allColumns } = useCsvDataStore();
    const filteredData = useFilteredData();

    // Store sources for "used" columns
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { filters } = useFilterSideMenuStore();
    const { colorData } = useColorSideMenuStore();

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

    const displayData = datasetMode === 'all' ? allData : filteredData;
    const displayColumns = datasetMode === 'all' ? allColumns : usedColumns;

    // Reset selection when dataset changes
    React.useEffect(() => {
        setSelectedCell(null);
        setSortConfig(null);
    }, [datasetMode, displayData, displayColumns]);

    // Compute stats for detailed mode color coding
    const numericStats = useMemo(() => {
        if (summaryMode !== 'detailed') return {};

        const stats: Record<string, { min: number, max: number }> = {};
        displayColumns.forEach(col => {
            // Sample values to check if mostly numeric
            const rawValues = displayData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
            if (rawValues.length === 0) return;

            let numCount = 0;
            const numericValues: number[] = [];

            for (const v of rawValues) {
                if (typeof v === 'number') {
                    numCount++;
                    numericValues.push(v);
                } else if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') {
                    numCount++;
                    numericValues.push(Number(v));
                }
            }

            // If more than 80% are numbers, treat as numeric column for color coding
            if (numCount / rawValues.length > 0.8 && numericValues.length > 0) {
                stats[col] = {
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues)
                };
            }
        });
        return stats;
    }, [displayData, displayColumns, summaryMode]);

    const sortedData = useMemo(() => {
        if (!sortConfig) return displayData;

        const sorted = [...displayData];
        sorted.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            // Handle nulls
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            // Handle numbers
            if (!isNaN(Number(aVal)) && !isNaN(Number(bVal)) && aVal !== '' && bVal !== '') {
                aVal = Number(aVal);
                bVal = Number(bVal);
            }

            if (aVal < bVal) return sortConfig!.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig!.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [displayData, sortConfig]);

    // Slice for performance (top 500 records)
    const MAX_ROWS = 500;
    const slicedData = sortedData.slice(0, MAX_ROWS);

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

        const maxRow = slicedData.length - 1;
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

        // Ensure focused item scrolls into view
        setTimeout(() => {
            const cell = document.getElementById(`cell-${row}-${col}`);
            if (cell) {
                cell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }, 0);
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
            `}</style>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 text-dark">Data Table</h5>
                <TableAreaControlButtons
                    summaryMode={summaryMode}
                    setSummaryMode={setSummaryMode}
                    datasetMode={datasetMode}
                    setDatasetMode={setDatasetMode}
                />
            </div>

            <div className="flex-grow-1 overflow-auto border rounded table-scroll-container" style={{ position: 'relative' }}>
                <Table bordered hover size="sm" className="mb-0" style={{ minWidth: 'max-content' }}>
                    <thead className="sticky-top bg-light" style={{ zIndex: 10 }}>
                        <tr>
                            <th className={selectedCell?.col === 0 ? 'bg-primary text-white' : 'bg-light'} style={{ position: 'sticky', left: 0, zIndex: 11 }}>#</th>
                            {displayColumns.map((col: string, idx: number) => (
                                <th
                                    key={idx}
                                    className={`text-nowrap align-top ${selectedCell?.col === idx + 1 ? 'bg-primary text-white' : 'bg-light'}`}
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
                                    <HeaderSummary data={displayData} column={col} mode={summaryMode} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {slicedData.map((row: any, rowIndex: number) => {
                            const isRowSelected = selectedCell?.row === rowIndex;
                            return (
                                <tr key={rowIndex}>
                                    <td
                                        id={`cell-${rowIndex}-0`}
                                        className={`text-muted fw-bold ${isRowSelected ? 'bg-light' : ''} ${selectedCell?.col === 0 ? 'bg-primary text-white' : ''}`}
                                        style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: isRowSelected ? '#e9ecef' : '#fff' }}
                                        onClick={() => setSelectedCell({ row: rowIndex, col: 0 })}
                                        tabIndex={-1}
                                    >
                                        {rowIndex + 1}
                                    </td>
                                    {displayColumns.map((col: string, idx: number) => {
                                        const colIndex = idx + 1;
                                        const isColSelected = selectedCell?.col === colIndex;
                                        const isCellSelected = isRowSelected && isColSelected;

                                        // Make sure boolean and null map to string for display
                                        const val = row[col];
                                        let displayVal = val;
                                        if (val === null || val === undefined) displayVal = '';
                                        else if (typeof val === 'boolean') displayVal = String(val);

                                        let bgColor = '';
                                        let textColor = isCellSelected ? '#fff' : '';

                                        if (isCellSelected) {
                                            bgColor = '#0d6efd'; // Primary blue
                                        } else if (isRowSelected || isColSelected) {
                                            bgColor = '#e9ecef'; // Light gray highlight
                                        } else if (summaryMode === 'detailed' && numericStats[col]) {
                                            const { min, max } = numericStats[col];
                                            const numVal = Number(val);
                                            // Make sure we have a valid range
                                            if (!isNaN(numVal) && max > min) {
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
                                                className="text-nowrap"
                                                style={{ backgroundColor: bgColor, color: textColor, cursor: 'cell' }}
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

            {displayData.length > MAX_ROWS && (
                <div className="text-muted small mt-2">
                    Showing first {MAX_ROWS} rows of {displayData.length} total rows.
                </div>
            )}
        </div>
    );
};

export default TableArea;
