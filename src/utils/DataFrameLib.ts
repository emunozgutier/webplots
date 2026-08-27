import type { Filter } from '../store/SideMenu/useFilterSideMenuStore';
import type { AxisSideMenuData } from '../store/SideMenu/useAxisSideMenuStore';
import type { GroupSideMenuData } from '../store/SideMenu/useGroupSideMenuStore';export interface DataRow {
    [key: string]: string | number | null | any;
}

export interface TraceData {
    yCol: string;
    groupName: string;
    rawGroupName?: string;
    fullTraceName: string;
    xData: any[];
    yData: any[];
    rowIndices: number[];
    filteredCount?: number;
    absorbedCounts?: number[];
    survivingIndices?: number[];
    groupColor?: string;
    groupSymbol?: string;
}

/**
 * Step 1: Filter raw data based on side-menu filter rules.
 */
export const Step_1_filter = (data: DataRow[], filters: Filter[]): DataRow[] => {
    if (filters.length === 0) return data;

    return data.filter(row => {
        return filters.every(filter => {
            const val = row[filter.column];

            if (filter.type === 'number') {
                const min = (filter.config as any).min;
                const max = (filter.config as any).max;

                if (typeof val !== 'number') return false;
                if (min != null && val < min) return false;
                if (max != null && val > max) return false;
                return true;
            } else {
                const included = (filter.config as any).includedValues;
                if (!included) return true;
                return included.includes(String(val));
            }
        });
    });
};

/**
 * Step 2: Group filtered data into traces based on grouping logic.
 */
export const Step_2_grouping = (
    data: DataRow[],
    axisConfig: AxisSideMenuData,
    groupConfig: GroupSideMenuData
): TraceData[] => {
    const { plotType, xAxis, yAxis } = axisConfig;
    const { groupSettings } = groupConfig;

    let generatedTraces: TraceData[] = [];

    const x = data.map((row, i) => xAxis ? row[xAxis] : i);

    const rawAxes = groupConfig.groupAxes && groupConfig.groupAxes.length > 0 
        ? groupConfig.groupAxes 
        : (groupConfig.groupAxis ? [groupConfig.groupAxis] : []);
    const activeGroupAxes = rawAxes.filter(Boolean) as string[];

    if (activeGroupAxes.length === 1) {
        const groupAxis = activeGroupAxes[0];
        const settings = groupSettings[groupAxis];
        const isManual = settings && settings.mode === 'manual';

        if (isManual) {
            const bins = settings.bins;
            yAxis.forEach(yCol => {
                const binGroups: Record<number, number[]> = {};

                data.forEach((row, idx) => {
                    const val = row[groupAxis];
                    const numVal = typeof val === 'number' ? val : parseFloat(String(val));

                    for (let i = 0; i < bins.length; i++) {
                        const bin = bins[i];
                        let match = false;

                        if (!isNaN(numVal)) {
                            switch (bin.operator) {
                                case '>': match = numVal > bin.value; break;
                                case '>=': match = numVal >= bin.value; break;
                                case '<': match = numVal < bin.value; break;
                                case '<=': match = numVal <= bin.value; break;
                                case '==': match = numVal == bin.value; break;
                                case '!=': match = numVal != bin.value; break;
                            }
                        } else {
                            if (bin.operator === '==') match = String(val) === String(bin.value);
                            if (bin.operator === '!=') match = String(val) !== String(bin.value);
                        }

                        if (match) {
                            if (!binGroups[i]) binGroups[i] = [];
                            binGroups[i].push(idx);
                            break;
                        }
                    }
                });

                bins.forEach((bin, binIdx) => {
                    const indices = binGroups[binIdx];
                    if (!indices || indices.length === 0) return;

                    generatedTraces.push({
                        yCol,
                        groupName: bin.label,
                        rawGroupName: bin.label,
                        fullTraceName: yAxis.length === 1 ? bin.label : `${yCol} (${bin.label})`,
                        xData: indices.map(i => xAxis ? data[i][xAxis] : i),
                        yData: indices.map(i => data[i][yCol]),
                        rowIndices: indices,
                        groupColor: bin.color,
                        groupSymbol: bin.symbol
                    });
                });
            });
        } else {
            const groupValues = Array.from(new Set(data.map(row => row[groupAxis]))).filter(v => v !== null && v !== undefined);
            groupValues.sort();

            yAxis.forEach(yCol => {
                groupValues.forEach(groupVal => {
                    const groupValStr = String(groupVal);
                    const indices = data.map((row, idx) => row[groupAxis] == groupVal ? idx : -1).filter(idx => idx !== -1);
                    if (indices.length === 0) return;

                    const catStyle = settings?.categoryStyles?.[groupValStr];

                    generatedTraces.push({
                        yCol,
                        groupName: `${groupAxis}=${groupValStr}`,
                        rawGroupName: groupValStr,
                        fullTraceName: yAxis.length === 1 ? `${groupAxis}=${groupValStr}` : `${yCol} (${groupAxis}=${groupValStr})`,
                        xData: indices.map(i => xAxis ? data[i][xAxis] : i),
                        yData: indices.map(i => data[i][yCol]),
                        rowIndices: indices,
                        groupColor: catStyle?.color,
                        groupSymbol: catStyle?.symbol
                    });
                });
            });
        }
    } else if (activeGroupAxes.length > 1) {
        // Multi-column grouping (Cartesian product of all group axes)
        const combosMap = new Map<string, { label: string, indices: number[] }>();

        data.forEach((row, idx) => {
            const hasAll = activeGroupAxes.every(axis => row[axis] !== null && row[axis] !== undefined && row[axis] !== '');
            if (!hasAll) return;

            const comboKey = activeGroupAxes.map(axis => `${axis}=${String(row[axis])}`).join(', ');
            if (!combosMap.has(comboKey)) {
                combosMap.set(comboKey, {
                    label: comboKey,
                    indices: []
                });
            }
            combosMap.get(comboKey)!.indices.push(idx);
        });

        const sortedCombos = Array.from(combosMap.values());
        sortedCombos.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

        yAxis.forEach(yCol => {
            sortedCombos.forEach((combo) => {
                const { label, indices } = combo;
                if (indices.length === 0) return;

                generatedTraces.push({
                    yCol,
                    groupName: label,
                    rawGroupName: label,
                    fullTraceName: yAxis.length === 1 ? label : `${yCol} (${label})`,
                    xData: indices.map(i => xAxis ? data[i][xAxis] : i),
                    yData: indices.map(i => data[i][yCol]),
                    rowIndices: indices,
                });
            });
        });
    } else {
        yAxis.forEach(yCol => {
            generatedTraces.push({
                yCol,
                groupName: '',
                fullTraceName: yCol,
                xData: plotType === 'histogram' ? [] : x,
                yData: data.map(row => row[yCol]),
                rowIndices: data.map((_, i) => i)
            });
        });
    }

    return generatedTraces;
};

/**
 * Step 3: Apply ink-ratio (geometric density) filtering to traces.
 */
export const Step_3_ink_ratio_filter = (
    traces: TraceData[],
    config: {
        inkRatio: number;
        absorbedPoint: 'left' | 'right' | 'random';
        chartWidth: number;
        chartHeight: number;
        pointRadius: number;
        useCustomRadius: boolean;
        customRadius: number;
        enableLogXAxis: boolean;
        enableLogYAxis: boolean;
        globalBounds?: { xMin: number, xMax: number, yMin: number, yMax: number };
    },
    filteredData?: DataRow[],
    activeStyleColumns?: string[]
): TraceData[] => {
    const { inkRatio, absorbedPoint, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius, enableLogXAxis, enableLogYAxis, globalBounds } = config;

    return traces.map(trace => {
        const { xData, yData } = trace;

        if (xData.length === 0) return trace;

        // Determination of effective radius
        const effectiveRadius = pointRadius; 
        const minPixelDist = useCustomRadius
            ? customRadius
            : effectiveRadius * 2 * (1 - inkRatio);

        // Bypass if no filtering is active
        if (!useCustomRadius && inkRatio >= 1) {
            return {
                ...trace,
                filteredCount: 0,
                absorbedCounts: new Array(xData.length).fill(0),
                survivingIndices: xData.map((_, i) => i)
            };
        }

        // Robust conversion to numbers without re-mapping the whole array
        const toNum = (v: any): number => {
            if (typeof v === 'number') return v;
            const n = parseFloat(v);
            if (!isNaN(n) && isFinite(n)) return n;
            const d = Date.parse(v);
            if (!isNaN(d)) return d;
            return NaN;
        };

        const numsX = new Float64Array(xData.length);
        const numsY = new Float64Array(xData.length);
        
        let xMin = globalBounds?.xMin ?? Infinity;
        let xMax = globalBounds?.xMax ?? -Infinity;
        let yMin = globalBounds?.yMin ?? Infinity;
        let yMax = globalBounds?.yMax ?? -Infinity;

        const needsLocalBounds = !globalBounds;

        for (let i = 0; i < xData.length; i++) {
            const vx = toNum(xData[i]);
            const vy = toNum(yData[i]);
            numsX[i] = vx;
            numsY[i] = vy;
            if (needsLocalBounds && !isNaN(vx) && !isNaN(vy)) {
                if (vx < xMin) xMin = vx;
                if (vx > xMax) xMax = vx;
                if (vy < yMin) yMin = vy;
                if (vy > yMax) yMax = vy;
            }
        }

        if (xMin === Infinity || yMin === Infinity) {
            return {
                ...trace,
                filteredCount: 0,
                absorbedCounts: new Array(xData.length).fill(0),
                survivingIndices: xData.map((_, i) => i)
            };
        }

        const safeW = chartWidth || 1;
        const safeH = chartHeight || 1;

        const xType = enableLogXAxis ? 'log' : 'linear';
        const yType = enableLogYAxis ? 'log' : 'linear';

        const xSub = xType === 'log' ? Math.log10(xMin) : xMin;
        const ySub = yType === 'log' ? Math.log10(yMin) : yMin;
        const xRangeVal = (xType === 'log' ? Math.log10(xMax) - xSub : xMax - xMin) || 1;
        const yRangeVal = (yType === 'log' ? Math.log10(yMax) - ySub : yMax - yMin) || 1;

        const xToPx = (val: number) => {
            if (isNaN(val)) return -9999;
            const normalized = ((xType === 'log' ? Math.log10(val) : val) - xSub) / xRangeVal;
            return normalized * safeW;
        };

        const yToPx = (val: number) => {
            if (isNaN(val)) return -9999;
            const normalized = ((yType === 'log' ? Math.log10(val) : val) - ySub) / yRangeVal;
            return (1 - normalized) * safeH;
        };

        const iterationOrder = Array.from({ length: xData.length }, (_, i) => i);
        if (absorbedPoint === 'left') {
            iterationOrder.sort((a, b) => numsX[a] - numsX[b]);
        } else if (absorbedPoint === 'right') {
            iterationOrder.sort((a, b) => numsX[b] - numsX[a]);
        } else if (absorbedPoint === 'random') {
            for (let i = iterationOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [iterationOrder[i], iterationOrder[j]] = [iterationOrder[j], iterationOrder[i]];
            }
        }

        const filteredX: any[] = [];
        const filteredY: any[] = [];
        const survivingIndices: number[] = [];
        
        // originalToKept stores the index of the kept point, or -2 for non-numeric, or -1 for absorbed
        const originalToKept = new Int32Array(xData.length).fill(-1);
        const keptPoints: { px: number, py: number, absorbed: number, origIdx: number }[] = [];

        const distSq = minPixelDist * minPixelDist;
        
        // Compute style signatures if required columns are present
        const signatures: string[] = [];
        if (filteredData && activeStyleColumns && activeStyleColumns.length > 0) {
            for (let i = 0; i < xData.length; i++) {
                const dataRow = filteredData[trace.rowIndices[i]];
                let sig = '';
                for(let c=0; c<activeStyleColumns.length; c++) {
                    sig += String(dataRow[activeStyleColumns[c]]) + '|';
                }
                signatures.push(sig);
            }
        }
        
        // Spatial hash grid to keep lookup O(1) per point
        const cellSize = Math.max(minPixelDist, 1e-6); 
        const grid = new Map<string, number[]>();

        for (const idx of iterationOrder) {
            const px = xToPx(numsX[idx]);
            const py = yToPx(numsY[idx]);

            if (px === -9999 || py === -9999) {
                originalToKept[idx] = -2;
                continue;
            }

            let keptBy = -1;
            
            // Spatial lookup
            const cx = Math.floor(px / cellSize);
            const cy = Math.floor(py / cellSize);

            // Check the current cell and 8 neighbors
            outer: for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const cellKey = `${cx + dx},${cy + dy}`;
                    const indicesInCell = grid.get(cellKey);
                    if (indicesInCell) {
                        for (const j of indicesInCell) {
                            const dpx = px - keptPoints[j].px;
                            const dpy = py - keptPoints[j].py;
                            if ((dpx * dpx + dpy * dpy) < distSq) {
                                if (signatures.length > 0) {
                                    const mySig = signatures[idx];
                                    const theirSig = signatures[keptPoints[j].origIdx];
                                    if (mySig !== theirSig) continue;
                                }
                                keptBy = j;
                                break outer;
                            }
                        }
                    }
                }
            }

            if (keptBy === -1) {
                const keptIdx = keptPoints.length;
                originalToKept[idx] = keptIdx;
                keptPoints.push({ px, py, absorbed: 0, origIdx: idx });

                // Add to grid
                const cellKey = `${cx},${cy}`;
                if (!grid.has(cellKey)) grid.set(cellKey, []);
                grid.get(cellKey)!.push(keptIdx);
            } else {
                const kObj = keptPoints[keptBy];
                const oldOrigIdx = kObj.origIdx;
                
                const sizeK = kObj.absorbed + 1;
                const sizeP = 1;
                let keepP = false;

                if (sizeP > sizeK) {
                    keepP = true;
                } else if (sizeP === sizeK) {
                    if (absorbedPoint === 'left') {
                        if (numsX[idx] < numsX[oldOrigIdx]) keepP = true;
                    } else if (absorbedPoint === 'right') {
                        if (numsX[idx] > numsX[oldOrigIdx]) keepP = true;
                    } else {
                        if (Math.random() > 0.5) keepP = true;
                    }
                }

                kObj.absorbed += 1;

                if (keepP) {
                    originalToKept[oldOrigIdx] = -1;
                    originalToKept[idx] = keptBy;
                    
                    const oldCx = Math.floor(kObj.px / cellSize);
                    const oldCy = Math.floor(kObj.py / cellSize);
                    
                    kObj.px = px;
                    kObj.py = py;
                    kObj.origIdx = idx;
                    
                    const newCx = Math.floor(kObj.px / cellSize);
                    const newCy = Math.floor(kObj.py / cellSize);
                    
                    if (newCx !== oldCx || newCy !== oldCy) {
                        const oldKey = `${oldCx},${oldCy}`;
                        const newKey = `${newCx},${newCy}`;
                        
                        const cellArr = grid.get(oldKey);
                        if (cellArr) {
                            const indexInArr = cellArr.indexOf(keptBy);
                            if (indexInArr > -1) cellArr.splice(indexInArr, 1);
                        }
                        if (!grid.has(newKey)) grid.set(newKey, []);
                        grid.get(newKey)!.push(keptBy);
                    }
                }
            }
        }

        const finalAbsorbedCounts: number[] = [];
        for (let i = 0; i < xData.length; i++) {
            const state = originalToKept[i];
            if (state >= 0) {
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                survivingIndices.push(i);
                finalAbsorbedCounts.push(keptPoints[state].absorbed);
            } else if (state === -2) {
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                survivingIndices.push(i);
                finalAbsorbedCounts.push(0);
            }
        }

        return {
            ...trace,
            xData: filteredX,
            yData: filteredY,
            filteredCount: xData.length - filteredX.length,
            absorbedCounts: finalAbsorbedCounts,
            survivingIndices
        };
    });
};

/**
 * Higher-level orchestrator that runs the entire processing pipeline.
 * Combine this with generatePlotConfig for the final output.
 */
export const runDataPipeline = (
    rawData: DataRow[],
    filters: Filter[],
    axisConfig: AxisSideMenuData,
    groupConfig: GroupSideMenuData,
    inkRatioConfig: {
        inkRatio: number;
        absorbedPoint: 'left' | 'right' | 'random';
        chartWidth: number;
        chartHeight: number;
        pointRadius: number;
        useCustomRadius: boolean;
        customRadius: number;
        enableLogXAxis: boolean;
        enableLogYAxis: boolean;
    },
    colorData?: any
) => {
    // Step 1: Logical filters
    const filtered = Step_1_filter(rawData, filters);
    
    // Step 2: Grouping into traces
    const traces = Step_2_grouping(filtered, axisConfig, groupConfig);
    
    // Calculate global bounds for consistent projection in density filter
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    
    const toNum = (v: any): number => {
        if (typeof v === 'number') return v;
        const n = parseFloat(v);
        if (!isNaN(n) && isFinite(n)) return n;
        const d = Date.parse(v);
        if (!isNaN(d)) return d;
        return NaN;
    };

    traces.forEach(trace => {
        trace.xData.forEach(v => {
            const n = toNum(v);
            if (!isNaN(n)) {
                if (n < xMin) xMin = n;
                if (n > xMax) xMax = n;
            }
        });
        trace.yData.forEach(v => {
            const n = toNum(v);
            if (!isNaN(n)) {
                if (n < yMin) yMin = n;
                if (n > yMax) yMax = n;
            }
        });
    });

    // Compute dynamic style columns for isolation during absorption
    const activeStyleColumns: string[] = [];
    if (colorData) {
        if (colorData.hue?.source === 'column' && colorData.hue.enabled !== false) activeStyleColumns.push(String(colorData.hue.value));
        if (colorData.saturation?.source === 'column' && colorData.saturation.enabled !== false) activeStyleColumns.push(String(colorData.saturation.value));
        if (colorData.lightness?.source === 'column' && colorData.lightness.enabled !== false) activeStyleColumns.push(String(colorData.lightness.value));
        if (colorData.shape?.source === 'column' && colorData.shape.enabled !== false) activeStyleColumns.push(String(colorData.shape.value));
        if (colorData.size?.source === 'column' && colorData.size.enabled !== false) activeStyleColumns.push(String(colorData.size.value));
    }

    // Step 3: Ink Ratio reduction
    const processedTraces = Step_3_ink_ratio_filter(traces, {
        ...inkRatioConfig,
        globalBounds: xMin === Infinity ? undefined : { xMin, xMax, yMin, yMax }
    }, filtered, activeStyleColumns);
    
    return { filtered, processedTraces };
};
