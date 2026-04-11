import type { Filter } from '../store/SideMenu/useFilterSideMenuStore';
import type { AxisSideMenuData } from '../store/SideMenu/useAxisSideMenuStore';
import type { GroupSideMenuData } from '../store/SideMenu/useGroupSideMenuStore';export interface DataRow {
    [key: string]: string | number | null | any;
}

export interface TraceData {
    yCol: string;
    groupName: string;
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
    const { groupAxis, groupSettings } = groupConfig;

    let generatedTraces: TraceData[] = [];

    const x = data.map((row, i) => xAxis ? row[xAxis] : i);

    if (groupAxis) {
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
        chartWidth: number;
        chartHeight: number;
        pointRadius: number;
        useCustomRadius: boolean;
        customRadius: number;
        enableLogAxis: boolean;
        globalBounds?: { xMin: number, xMax: number, yMin: number, yMax: number };
    }
): TraceData[] => {
    const { inkRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius, enableLogAxis, globalBounds } = config;

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

        const xType = enableLogAxis ? 'log' : 'linear';
        const yType = enableLogAxis ? 'log' : 'linear';

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

        const filteredX: any[] = [];
        const filteredY: any[] = [];
        const survivingIndices: number[] = [];
        
        // originalToKept stores the index of the kept point, or -2 for non-numeric, or -1 for absorbed
        const originalToKept = new Int32Array(xData.length).fill(-1);
        const keptPoints: { px: number, py: number, absorbed: number }[] = [];

        const distSq = minPixelDist * minPixelDist;
        
        // Spatial hash grid to keep lookup O(1) per point
        const cellSize = Math.max(minPixelDist, 1e-6); 
        const grid = new Map<string, number[]>();

        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(numsX[i]);
            const py = yToPx(numsY[i]);

            if (px === -9999 || py === -9999) {
                originalToKept[i] = -2;
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                survivingIndices.push(i);
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
                                keptBy = j;
                                break outer;
                            }
                        }
                    }
                }
            }

            if (keptBy === -1) {
                const keptIdx = keptPoints.length;
                originalToKept[i] = keptIdx;
                keptPoints.push({ px, py, absorbed: 0 });
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                survivingIndices.push(i);

                // Add to grid
                const cellKey = `${cx},${cy}`;
                if (!grid.has(cellKey)) grid.set(cellKey, []);
                grid.get(cellKey)!.push(keptIdx);
            } else {
                keptPoints[keptBy].absorbed += 1;
            }
        }

        const finalAbsorbedCounts = new Array(filteredX.length);
        let kIdx = 0;
        for (let i = 0; i < originalToKept.length; i++) {
            const state = originalToKept[i];
            if (state >= 0) {
                finalAbsorbedCounts[kIdx++] = keptPoints[state].absorbed;
            } else if (state === -2) {
                finalAbsorbedCounts[kIdx++] = 0;
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
        chartWidth: number;
        chartHeight: number;
        pointRadius: number;
        useCustomRadius: boolean;
        customRadius: number;
        enableLogAxis: boolean;
    }
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

    // Step 3: Ink Ratio reduction
    const processedTraces = Step_3_ink_ratio_filter(traces, {
        ...inkRatioConfig,
        globalBounds: xMin === Infinity ? undefined : { xMin, xMax, yMin, yMax }
    });
    
    return { filtered, processedTraces };
};
