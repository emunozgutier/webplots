import React, { useMemo, useState } from 'react';
import { Table, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { useCsvDataStore } from '../store/CsvDataStore';
import { useFilteredData } from '../hooks/useFilteredData';
import { useAxisSideMenuStore } from '../store/AxisSideMenuStore';
import { useGroupSideMenuStore } from '../store/GroupSideMenuStore';
import { useFilterSideMenuStore } from '../store/FilterSideMenuStore';
import { useColorSideMenuStore } from '../store/ColorSideMenuStore';

const TableArea: React.FC = () => {
    const [datasetMode, setDatasetMode] = useState<'all' | 'plot'>('plot');
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

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
    }, [datasetMode, displayData, displayColumns]);

    // Slice for performance (top 500 records)
    const MAX_ROWS = 500;
    const slicedData = displayData.slice(0, MAX_ROWS);

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
                <ButtonGroup>
                    <ToggleButton
                        id="toggle-all"
                        type="radio"
                        variant={datasetMode === 'all' ? 'primary' : 'outline-primary'}
                        name="datasetMode"
                        value="all"
                        checked={datasetMode === 'all'}
                        onChange={(e) => setDatasetMode(e.currentTarget.value as 'all' | 'plot')}
                    >
                        All Data
                    </ToggleButton>
                    <ToggleButton
                        id="toggle-plot"
                        type="radio"
                        variant={datasetMode === 'plot' ? 'primary' : 'outline-primary'}
                        name="datasetMode"
                        value="plot"
                        checked={datasetMode === 'plot'}
                        onChange={(e) => setDatasetMode(e.currentTarget.value as 'all' | 'plot')}
                    >
                        Plot Data
                    </ToggleButton>
                </ButtonGroup>
            </div>

            <div className="flex-grow-1 overflow-auto border rounded table-scroll-container" style={{ position: 'relative' }}>
                <Table bordered hover size="sm" className="mb-0" style={{ minWidth: 'max-content' }}>
                    <thead className="sticky-top bg-light" style={{ zIndex: 10 }}>
                        <tr>
                            <th className={selectedCell?.col === 0 ? 'bg-primary text-white' : 'bg-light'} style={{ position: 'sticky', left: 0, zIndex: 11 }}>#</th>
                            {displayColumns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`text-nowrap ${selectedCell?.col === idx + 1 ? 'bg-primary text-white' : 'bg-light'}`}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {slicedData.map((row, rowIndex) => {
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
                                    {displayColumns.map((col, idx) => {
                                        const colIndex = idx + 1;
                                        const isColSelected = selectedCell?.col === colIndex;
                                        const isCellSelected = isRowSelected && isColSelected;

                                        // Make sure boolean and null map to string for display
                                        const val = row[col];
                                        let displayVal = val;
                                        if (val === null || val === undefined) displayVal = '';
                                        else if (typeof val === 'boolean') displayVal = String(val);

                                        let bgColor = '';
                                        if (isCellSelected) bgColor = '#0d6efd'; // Primary blue
                                        else if (isRowSelected || isColSelected) bgColor = '#e9ecef'; // Light gray highlight

                                        let textColor = isCellSelected ? '#fff' : '';

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
