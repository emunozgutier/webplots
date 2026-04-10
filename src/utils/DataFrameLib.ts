import type { Filter } from '../store/FilterSideMenuStore';
import type { AxisSideMenuData } from '../store/AxisSideMenuStore';
import type { GroupSideMenuData } from '../store/GroupSideMenuStore';

export type PreFilterMode = 'none' | 'uniform' | 'random' | 'inkRatio';

export interface DataRow {
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
}

/**
 * Step 0: Pre-filter massive datasets (>100k) to prevent UI crashes.
 */
export const Step_0_pre_filter = (
    data: DataRow[],
    config: {
        mode: PreFilterMode;
        uniformStep: number;
        randomSampleCount: number;
        inkRatio: number;
        densityX: string | null;
        densityY: string | null;
    }
): DataRow[] => {
    const { mode, uniformStep, randomSampleCount, inkRatio, densityX, densityY } = config;

    if (data.length === 0) return data;

    // Emergency Protection Pass:
    // If > 500k rows and No strategy is selected, we must force a 1/10th sample
    // to keep the browser alive.
    if (data.length > 500000 && mode === 'none') {
        const emergencyResult: DataRow[] = [];
        for (let i = 0; i < data.length; i += 10) {
            emergencyResult.push(data[i]);
        }
        return emergencyResult;
    }

    if (mode === 'none') return data;

    if (mode === 'uniform') {
        const result: DataRow[] = [];
        const step = Math.max(1, uniformStep);
        for (let i = 0; i < data.length; i += step) {
            result.push(data[i]);
        }
        return result;
    }

    if (mode === 'random') {
        if (data.length <= randomSampleCount) return data;
        const result: DataRow[] = [];
        const step = data.length / randomSampleCount;
        for (let i = 0; i < randomSampleCount; i++) {
            const index = Math.floor(i * step + Math.random() * step);
            if (index < data.length) result.push(data[index]);
        }
        return result;
    }

    if (mode === 'inkRatio') {
        if (!densityX || !densityY) return data;

        // Determination of effective radius
        const minPixelDist = 20 * (1 - inkRatio); // Fixed virtual chart size 1000x1000
        if (inkRatio >= 1) return data;

        const toNum = (v: any): number => {
            if (typeof v === 'number') return v;
            const n = parseFloat(v);
            if (!isNaN(n) && isFinite(n)) return n;
            const d = Date.parse(v);
            if (!isNaN(d)) return d;
            return NaN;
        };

        // Find min/max and scale factors without re-mapping the whole array
        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        const validIndices: number[] = [];
        
        for (let i = 0; i < data.length; i++) {
            const vx = toNum(data[i][densityX]);
            const vy = toNum(data[i][densityY]);
            if (!isNaN(vx) && !isNaN(vy)) {
                if (vx < xMin) xMin = vx;
                if (vx > xMax) xMax = vx;
                if (vy < yMin) yMin = vy;
                if (vy > yMax) yMax = vy;
                validIndices.push(i);
            }
        }

        if (validIndices.length === 0) return data;

        const xRange = (xMax - xMin) || 1;
        const yRange = (yMax - yMin) || 1;

        const points: { px: number, py: number }[] = [];
        const result: DataRow[] = [];

        // Single pass for geometric filtering
        for (let i = 0; i < validIndices.length; i++) {
            const idx = validIndices[i];
            const row = data[idx];
            const px = ((toNum(row[densityX]) - xMin) / xRange) * 1000;
            const py = ((toNum(row[densityY]) - yMin) / yRange) * 1000;

            let keptBy = -1;
            // Check last 200 points to verify density
            const checkLimit = Math.max(0, points.length - 200);
            for (let j = points.length - 1; j >= checkLimit; j--) {
                const dx = px - points[j].px;
                const dy = py - points[j].py;
                if ((dx * dx + dy * dy) < (minPixelDist * minPixelDist)) {
                    keptBy = j;
                    break;
                }
            }

            if (keptBy === -1) {
                points.push({ px, py });
                result.push(row);
            }
        }

        return result;
    }

    return data;
};

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
                        rowIndices: indices
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

                    generatedTraces.push({
                        yCol,
                        groupName: `${groupAxis}=${groupValStr}`,
                        fullTraceName: yAxis.length === 1 ? `${groupAxis}=${groupValStr}` : `${yCol} (${groupAxis}=${groupValStr})`,
                        xData: indices.map(i => xAxis ? data[i][xAxis] : i),
                        yData: indices.map(i => data[i][yCol]),
                        rowIndices: indices
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
    }
): TraceData[] => {
    const { inkRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius, enableLogAxis } = config;

    return traces.map(trace => {
        const { xData, yData } = trace;

        // Determination of effective radius
        const effectiveRadius = pointRadius; // Simplified for now, can be overridden per trace later if needed
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

        if (xData.length === 0 || xData.length > 50000) {
            return {
                ...trace,
                filteredCount: 0,
                absorbedCounts: new Array(xData.length).fill(0),
                survivingIndices: xData.map((_, i) => i)
            };
        }

        // Robust conversion to numbers
        const toNum = (v: any): number => {
            if (typeof v === 'number') return v;
            const n = parseFloat(v);
            if (!isNaN(n) && isFinite(n)) return n;
            const d = Date.parse(v);
            if (!isNaN(d)) return d;
            return NaN;
        };

        const numsX = xData.map(toNum);
        const numsY = yData.map(toNum);
        const validNumsX = numsX.filter(n => !isNaN(n));
        const validNumsY = numsY.filter(n => !isNaN(n));

        if (validNumsX.length === 0 || validNumsY.length === 0) {
            return {
                ...trace,
                filteredCount: 0,
                absorbedCounts: new Array(xData.length).fill(0),
                survivingIndices: xData.map((_, i) => i)
            };
        }

        const xMin = Math.min(...validNumsX);
        const xMax = Math.max(...validNumsX);
        const yMin = Math.min(...validNumsY);
        const yMax = Math.max(...validNumsY);

        const safeW = chartWidth || 1;
        const safeH = chartHeight || 1;

        const xType = enableLogAxis ? 'log' : 'linear';
        const yType = enableLogAxis ? 'log' : 'linear';

        const xRangeVal = (xType === 'log' ? Math.log10(xMax) - Math.log10(xMin) : xMax - xMin) || 1;
        const yRangeVal = (yType === 'log' ? Math.log10(yMax) - Math.log10(yMin) : yMax - yMin) || 1;

        const xToPx = (val: number) => {
            if (isNaN(val)) return -9999;
            const normalized = xType === 'log'
                ? (Math.log10(val) - Math.log10(xMin)) / xRangeVal
                : (val - xMin) / xRangeVal;
            return normalized * safeW;
        };

        const yToPx = (val: number) => {
            if (isNaN(val)) return -9999;
            const normalized = yType === 'log'
                ? (Math.log10(val) - Math.log10(yMin)) / yRangeVal
                : (val - yMin) / yRangeVal;
            return (1 - normalized) * safeH;
        };

        const filteredX: any[] = [];
        const filteredY: any[] = [];
        const absorbedCounts: number[] = [];
        const points: { px: number, py: number, absorbed: number, originalIndex: number }[] = [];
        const survivingIndices: number[] = [];

        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(numsX[i]);
            const py = yToPx(numsY[i]);

            if (px === -9999 || py === -9999) {
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                absorbedCounts.push(0);
                survivingIndices.push(i);
                continue;
            }

            let keptBy = -1;
            for (let j = 0; j < points.length; j++) {
                const dx = px - points[j].px;
                const dy = py - points[j].py;
                if (Math.sqrt(dx * dx + dy * dy) < minPixelDist) {
                    keptBy = j;
                    break;
                }
            }

            if (keptBy === -1) {
                points.push({ px, py, absorbed: 0, originalIndex: i });
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                absorbedCounts.push(0);
                survivingIndices.push(i);
            } else {
                points[keptBy].absorbed += 1;
                absorbedCounts[points[keptBy].originalIndex] = points[keptBy].absorbed;
            }
        }

        const finalAbsorbedCounts = new Array(filteredX.length).fill(0);
        let pointIdx = 0;
        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(numsX[i]);
            const py = yToPx(numsY[i]);
            if (px !== -9999 && py !== -9999) {
                 const keptPoint = points.find(p => p.originalIndex === i);
                 if (keptPoint) finalAbsorbedCounts[pointIdx++] = keptPoint.absorbed;
            } else {
                finalAbsorbedCounts[pointIdx++] = 0;
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
