import React, { useMemo, useEffect } from 'react';
import { useSubplotSideMenuStore } from '../../../store/SideMenu/useSubplotSideMenuStore';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import { useTraceConfigStore } from '../../../store/PlotTable/useTraceConfigStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useAxisSideMenuStore } from '../../../store/SideMenu/useAxisSideMenuStore';

const SubplotAutoSorting: React.FC = () => {
    const { isAutoSortEnabled, setGrid, setAllTraceSubplots, rows, cols } = useSubplotSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { traceConfig } = useTraceConfigStore();
    const { data } = useCsvDataStore();

    const { activeTraces } = traceConfig;
    const { groupAxes, groupAxis } = groupSideMenuData;
    const { yAxis } = sideMenuData;

    // List of active group axes
    const activeGroupAxes = useMemo(() => {
        const raw = groupAxes && groupAxes.length > 0 ? groupAxes : (groupAxis ? [groupAxis] : []);
        return raw.filter(Boolean) as string[];
    }, [groupAxes, groupAxis]);

    // Compute unique values for each potential dimension
    const dimensionValues = useMemo(() => {
        const map: Record<string, string[]> = {};
        activeGroupAxes.forEach(axis => {
            const vals = Array.from(new Set(data.map(row => String(row[axis])))).filter(v => v !== 'null' && v !== 'undefined' && v !== '');
            vals.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            map[axis] = vals;
        });
        if (yAxis && yAxis.length > 1) {
            map['__yAxis__'] = yAxis;
        }
        return map;
    }, [activeGroupAxes, data, yAxis]);

    // The effect that performs the actual sorting
    useEffect(() => {
        if (!isAutoSortEnabled || activeTraces.length === 0) return;

        let rowDim = '';
        let colDim = '';
        let newRows = 1;
        let newCols = 1;

        if (activeGroupAxes.length === 2) {
            // Two groups -> map to row/col
            const dim1 = activeGroupAxes[0];
            const dim2 = activeGroupAxes[1];
            const count1 = dimensionValues[dim1]?.length || 1;
            const count2 = dimensionValues[dim2]?.length || 1;
            
            // Map larger group to cols, smaller to rows
            if (count1 >= count2) {
                colDim = dim1;
                newCols = count1;
                rowDim = dim2;
                newRows = count2;
            } else {
                colDim = dim2;
                newCols = count2;
                rowDim = dim1;
                newRows = count1;
            }
        } else if (activeGroupAxes.length === 1) {
            // One group
            colDim = activeGroupAxes[0];
            newCols = dimensionValues[colDim]?.length || 1;
            newRows = 1;
        } else if (yAxis && yAxis.length > 1) {
            // No group, but multiple Y axes
            rowDim = '__yAxis__';
            newRows = yAxis.length;
            newCols = 1;
        }

        // Cap at 3x3
        newRows = Math.min(newRows, 3);
        newCols = Math.min(newCols, 3);

        // Update Grid only if changed
        if (newRows !== rows || newCols !== cols) {
            setGrid(newRows, newCols);
        }

        // Apply trace mapping
        const rowValues = rowDim ? (dimensionValues[rowDim] || []) : [];
        const colValues = colDim ? (dimensionValues[colDim] || []) : [];
        const mapping: Record<string, number[]> = {};

        activeTraces.forEach((trace, idx) => {
            const traceName = trace.fullTraceName;
            let targetRow = 0;
            let targetCol = 0;

            if (rowDim && rowValues.length > 0) {
                if (rowDim === '__yAxis__') {
                    const yIdx = yAxis.indexOf(trace.yCol);
                    if (yIdx !== -1) targetRow = yIdx % newRows;
                } else {
                    const rowMatch = rowValues.findIndex(val => traceName.includes(`${rowDim}=${val}`) || traceName.includes(val));
                    if (rowMatch !== -1) targetRow = rowMatch % newRows;
                }
            }

            if (colDim && colValues.length > 0) {
                if (colDim === '__yAxis__') {
                    const yIdx = yAxis.indexOf(trace.yCol);
                    if (yIdx !== -1) targetCol = yIdx % newCols;
                } else {
                    const colMatch = colValues.findIndex(val => traceName.includes(`${colDim}=${val}`) || traceName.includes(val));
                    if (colMatch !== -1) targetCol = colMatch % newCols;
                }
            }

            if (!rowDim && !colDim) {
                // If no group dims, distribute evenly
                const subplotIndex = (idx % (newRows * newCols)) + 1;
                mapping[traceName] = [subplotIndex];
                return;
            }

            const subplotIndex = (targetRow * newCols) + targetCol + 1;
            mapping[traceName] = [subplotIndex];
        });

        setAllTraceSubplots(mapping);

        // Intentionally omitting rows and cols from dependency array to avoid looping when setGrid is called,
        // because we compute newRows and newCols entirely derived from groupAxes and dimensionValues.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAutoSortEnabled, activeGroupAxes, dimensionValues, activeTraces, yAxis, setGrid, setAllTraceSubplots]);

    return null;
};

export default SubplotAutoSorting;
