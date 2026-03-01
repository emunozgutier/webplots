import React, { useMemo } from 'react';

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
}

// Extremely lightweight inline SVG sparkline histogram
const SparklineHistogram: React.FC<SparklineProps> = ({ data, width = 100, height = 30 }) => {
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

    return (
        <svg width={width} height={height} className="mt-1 mb-1 d-block">
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
        </svg>
    );
};


const HeaderSummary: React.FC<HeaderSummaryProps> = ({ data, column, mode }) => {
    if (mode === 'none' || !data || data.length === 0) return null;

    const stats = useMemo(() => {
        // Extract raw column data, filtering out nulls
        const rawValues = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
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

            return {
                type,
                min: formatVal(min),
                max: formatVal(max),
                avg: formatVal(avg),
                median: formatVal(median),
                rawNumeric: numericValues // For sparkline
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
    }, [data, column]);

    if (!stats) return null;

    // ---------- SLIM MODE ----------
    if (mode === 'slim') {
        return (
            <div className="text-muted fw-normal" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                {stats.type === 'category' ? (
                    <span>{(stats as any).uniqueCount} distinct</span>
                ) : (
                    <span>Min: {(stats as any).min} | Max: {(stats as any).max}</span>
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
                    <SparklineHistogram data={(stats as any).rawNumeric} />
                    <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <div><strong>Min:</strong> {(stats as any).min}</div>
                        <div><strong>Max:</strong> {(stats as any).max}</div>
                        <div><strong>Avg:</strong> {(stats as any).avg}</div>
                        <div><strong>Med:</strong> {(stats as any).median}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(HeaderSummary);
