import React, { useMemo } from 'react';
import { calculateGaussianStats } from '../../utils/MathHelper';

export type SummaryMode = 'none' | 'slim' | 'detailed';

interface HeaderSummaryProps {
    data: any[];
    column: string;
    mode: SummaryMode;
}

// Helper to determine type of an array of values
const determineType = (values: any[]): 'number' | 'date' | 'category' => {
    let hasNumber = false;
    let hasDate = false;
    let hasString = false;

    // Sample up to 100 non-null values to guess type
    let samples = 0;
    for (const val of values) {
        if (val === null || val === undefined || val === '') continue;

        samples++;
        if (typeof val === 'number') {
            hasNumber = true;
        } else if (typeof val === 'string') {
            // Check if it parses purely as a number
            const numVal = Number(val);
            if (!isNaN(numVal) && val.trim() !== '') {
                hasNumber = true;
            } else {
                // Check if it's a valid date string (simple heuristic: Date.parse works and it looks like a date/time)
                const d = Date.parse(val);
                // Also check if it has date separators to avoid treating random strings as dates
                if (!isNaN(d) && (val.includes('-') || val.includes('/') || val.includes(':'))) {
                    hasDate = true;
                } else {
                    hasString = true;
                }
            }
        } else if (typeof val === 'boolean') {
            hasString = true; // Treat booleans as categories
        }

        if (samples > 100) break;
    }

    if (hasString) return 'category';
    // If it has dates and no explicit non-date strings, prefer date
    if (hasDate) return 'date';
    if (hasNumber) return 'number';
    return 'category'; // Default fallback
};

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    gaussian?: { isGaussian: boolean; components: { mean: number; stdDev: number; weight: number }[] };
}

// Extremely lightweight inline SVG sparkline histogram
const SparklineHistogram: React.FC<SparklineProps> = ({ data, width = 100, height = 30, gaussian }) => {
    if (data.length === 0) return null;

    const bins = 15;
    const min = Math.min(...data);
    const max = Math.max(...data);

    if (min === max) return null; // Can't draw distribution for a single value

    // Calculate bin counts
    const binCounts = new Array(bins).fill(0);
    const binSize = (max - min) / bins;

    data.forEach(val => {
        let index = Math.floor((val - min) / binSize);
        if (index >= bins) index = bins - 1; // Inclusive upper bound
        binCounts[index]++;
    });

    const maxCount = Math.max(...binCounts);
    if (maxCount === 0) return null;

    // Draw bars
    const barWidth = width / bins;
    const padding = 1;

    let gaussianPath = "";
    if (gaussian?.isGaussian && gaussian.components && gaussian.components.length > 0) {
        const points = 50;
        const totalCount = data.length;

        const mixtureDist = (x: number) => {
            let pdf = 0;
            for (let comp of gaussian.components) {
                const z = (x - comp.mean) / comp.stdDev;
                pdf += comp.weight * (1 / (comp.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
            }
            return pdf;
        };

        // Scale by area of histogram
        let path = "";
        for (let i = 0; i <= points; i++) {
            const xVal = min + (i / points) * (max - min);
            const pdf = mixtureDist(xVal);
            const expectedCount = pdf * totalCount * binSize;

            const px = (i / points) * width;
            const py = height - (expectedCount / maxCount) * height;

            const clampedPy = Math.max(-10, Math.min(height + 10, py));

            if (i === 0) path += `M ${px + padding / 2} ${clampedPy} `;
            else path += `L ${px + padding / 2} ${clampedPy} `;
        }
        gaussianPath = path;
    }

    return (
        <svg width={width} height={height} className="mt-1 mb-1 d-block" style={{ overflow: 'visible' }}>
            {binCounts.map((count, i) => {
                const barHeight = (count / maxCount) * height;
                const x = i * barWidth;
                const y = height - barHeight;
                return (
                    <rect
                        key={i}
                        x={x + padding / 2}
                        y={y}
                        width={Math.max(1, barWidth - padding)}
                        height={Math.max(1, barHeight)}
                        fill="#6c757d"
                        opacity={0.7}
                    />
                );
            })}
            {gaussianPath && (
                <path d={gaussianPath} fill="none" stroke="#28a745" strokeWidth="2" opacity="0.8" />
            )}
        </svg>
    );
};


const HeaderSummary: React.FC<HeaderSummaryProps> = ({ data, column, mode }) => {
    const stats = useMemo(() => {
        if (mode === 'none' || !data || data.length === 0) return null;

        const MAX_SAMPLES = 5000;
        let sampledData = data;

        // Uniform sampling for large datasets to prevent locking the UI thread
        if (data.length > MAX_SAMPLES) {
            sampledData = [];
            const step = data.length / MAX_SAMPLES;
            for (let i = 0; i < MAX_SAMPLES; i++) {
                const index = Math.floor(i * step);
                if (index < data.length) {
                    sampledData.push(data[index]);
                }
            }
        }

        // Extract raw column data from the sample, filtering out nulls
        const rawValues = sampledData.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
        if (rawValues.length === 0) return null;

        const type = determineType(rawValues);

        if (type === 'number' || type === 'date') {
            // Convert to numbers for math
            const numericValues = rawValues.map(v => {
                if (type === 'date') return new Date(v).getTime();
                return Number(v);
            }).filter(v => !isNaN(v));

            if (numericValues.length === 0) return { type: 'category', values: rawValues }; // fallback

            numericValues.sort((a, b) => a - b);
            const count = numericValues.length;
            const min = numericValues[0];
            const max = numericValues[count - 1];
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const avg = sum / count;
            const median = count % 2 === 0
                ? (numericValues[count / 2 - 1] + numericValues[count / 2]) / 2
                : numericValues[Math.floor(count / 2)];

            // Calculate standard deviation and distribution metrics
            let variance = 0;
            for (let v of numericValues) variance += Math.pow(v - avg, 2);
            variance /= count;
            const stdDev = Math.sqrt(variance);

            const { hasGaussianTest, isGaussian, gaussianScore, components } = calculateGaussianStats(
                numericValues,
                stdDev,
                count
            );

            // Formatting helper
            const formatVal = (val: number) => {
                if (type === 'date') {
                    // Try to format it compactly
                    const d = new Date(val);
                    return d.toISOString().split('T')[0]; // Simple YYYY-MM-DD
                }
                // Number format
                return Number.isInteger(val) ? val.toString() : val.toFixed(2);
            };

            const formatDuration = (val: number) => {
                if (type === 'date') {
                    const days = val / (1000 * 60 * 60 * 24);
                    return days.toFixed(2) + 'd';
                }
                return Number.isInteger(val) ? val.toString() : val.toFixed(2);
            };

            return {
                type,
                min: formatVal(min),
                max: formatVal(max),
                avg: formatVal(avg),
                median: formatVal(median),
                stdDev: formatDuration(stdDev),
                rawNumeric: numericValues, // For sparkline
                hasGaussianTest,
                gaussianScore,
                isGaussian,
                components: components.map(c => ({
                    meanStr: formatVal(c.mean),
                    stdDevStr: formatDuration(c.stdDev),
                    mean: c.mean,
                    stdDev: c.stdDev,
                    weight: c.weight
                })),
                rawAvg: avg,
                rawStdDev: stdDev
            };
        } else {
            // Category
            const counts: Record<string, number> = {};
            rawValues.forEach(v => {
                const str = String(v);
                counts[str] = (counts[str] || 0) + 1;
            });

            // Sort by frequency descending
            const sortedCategories = Object.entries(counts)
                .sort((a, b) => b[1] - a[1]);

            return {
                type: 'category',
                uniqueCount: sortedCategories.length,
                topCategories: sortedCategories.slice(0, 5) // Keep it brief
            };
        }
    }, [data, column, mode]);

    if (!stats) return null;

    // ---------- SLIM MODE ----------
    if (mode === 'slim') {
        return (
            <div className="text-muted fw-normal" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                {stats.type === 'category' ? (
                    <span>{(stats as any).uniqueCount} distinct</span>
                ) : (
                    <div className="d-flex flex-column">
                        <span>Max: {(stats as any).max}</span>
                        <span>Min: {(stats as any).min}</span>
                    </div>
                )}
            </div>
        );
    }

    // ---------- DETAILED MODE ----------
    return (
        <div className="mt-2 pt-2 border-top border-light text-muted fw-normal" style={{ fontSize: '0.8rem', minWidth: '150px' }}>
            {stats.type === 'category' ? (
                <div>
                    <div className="mb-1 text-dark fw-bold">{(stats as any).uniqueCount} distinct values</div>
                    <ul className="list-unstyled mb-0" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                        {((stats as any).topCategories as [string, number][]).map(([val, count], idx) => (
                            <li key={idx} className="d-flex justify-content-between text-truncate">
                                <span className="me-2 text-truncate" title={val}>{val}</span>
                                <span>{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div>
                    <SparklineHistogram
                        data={(stats as any).rawNumeric}
                        gaussian={((stats as any).hasGaussianTest) ? {
                            isGaussian: (stats as any).isGaussian,
                            components: (stats as any).components
                        } : undefined}
                    />
                    <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <div><strong>Min:</strong> {(stats as any).min}</div>
                        <div><strong>Max:</strong> {(stats as any).max}</div>
                        <div><strong>Avg:</strong> {(stats as any).avg}</div>
                        <div><strong>Med:</strong> {(stats as any).median}</div>
                    </div>
                    {((stats as any).hasGaussianTest) && (
                        <div className="mt-2 pt-1 border-top border-light" style={{ fontSize: '0.75rem' }}>
                            <div>
                                <strong>Gaussian Mixture:</strong> {(stats as any).isGaussian ? <span className="text-success fw-bold">Yes</span> : <span>No</span>} <span className="opacity-75">({(stats as any).gaussianScore}% sure)</span>
                            </div>
                            {(stats as any).isGaussian && (stats as any).components && (stats as any).components.length > 0 && (
                                <div className="mt-1 d-grid" style={{ gridTemplateColumns: '1fr', gap: '2px' }}>
                                    {((stats as any).components).map((comp: any, i: number, arr: any[]) => {
                                        const weightText = arr.length > 1
                                            ? ` (${Math.round(comp.weight * 100)}%)`
                                            : '';
                                        return (
                                            <div key={i} className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem' }}>
                                                <span title="Mean">μ: {comp.meanStr}</span>
                                                <span title="Sigma">σ: {comp.stdDevStr}{weightText}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(HeaderSummary);
