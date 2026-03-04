import React, { useState, useEffect } from 'react';
import { useGroupSideMenuStore } from '../../../store/GroupSideMenuStore';
import type { GroupSettings } from '../../../store/GroupSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/WorkspaceLocalStore';
import { useCsvDataStore } from '../../../store/CsvDataStore';
import Plot from 'react-plotly.js';
import { v4 as uuidv4 } from 'uuid';
import { roundToSignificantDigits, toEngineeringString } from '../../../utils/MathHelper';

interface GroupAxisSettingsProps {
    column: string;
}

const GroupAxisSettings: React.FC<GroupAxisSettingsProps> = ({ column }) => {
    const { groupSideMenuData, setGroupSettings } = useGroupSideMenuStore();
    const { closePopup } = useWorkspaceLocalStore();
    const { data } = useCsvDataStore();

    const [localSettings, setLocalSettings] = useState<GroupSettings>({
        mode: 'auto',
        bins: []
    });

    // Extract numeric column data for preview and categoric data for counts
    const { numericData, dataMin, dataMax, isNumeric, categoryCounts } = React.useMemo(() => {
        if (!data || data.length === 0) return { numericData: [], dataMin: 0, dataMax: 100, isNumeric: false, categoryCounts: {} };
        const nums: number[] = [];
        const counts: Record<string, number> = {};
        let min = Infinity, max = -Infinity;
        let validNumCount = 0;

        data.forEach((row: any) => {
            const rawVal = row[column];
            const strVal = String(rawVal);

            // Count categories
            counts[strVal] = (counts[strVal] || 0) + 1;

            // Try numeric
            if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
                const val = Number(rawVal);
                if (!isNaN(val)) {
                    validNumCount++;
                    nums.push(val);
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
            }
        });

        // Consider numeric if more than 80% of non-empty values are valid numbers
        // AND the number of unique categories is greater than 15.
        // Columns like Year (e.g. 2021, 2022, 2023) should be treated as categorical for grouping.
        const totalRows = data.length;
        const uniqueCategoryCount = Object.keys(counts).length;
        const isNum = (validNumCount / totalRows) > 0.8 && uniqueCategoryCount > 15;

        if (min === Infinity) { min = 0; max = 100; }
        return { numericData: nums, dataMin: min, dataMax: max, isNumeric: isNum, categoryCounts: counts };
    }, [data, column]);

    useEffect(() => {
        if (groupSideMenuData.groupSettings && groupSideMenuData.groupSettings[column]) {
            const saved = groupSideMenuData.groupSettings[column];
            if (isNumeric && saved.bins.length === 0 && saved.mode !== 'auto') {
                setLocalSettings({ mode: 'manual', bins: generateDefaultBins(dataMin, dataMax) });
            } else {
                setLocalSettings(saved);
            }
        } else {
            // Default based on type
            if (isNumeric) {
                setLocalSettings({ mode: 'manual', bins: generateDefaultBins(dataMin, dataMax) });
            } else {
                setLocalSettings({ mode: 'auto', bins: [] });
            }
        }
    }, [column, groupSideMenuData.groupSettings, dataMin, dataMax, isNumeric]);



    const generateDefaultBins = (min: number, max: number): GroupSettings['bins'] => {
        const diff = max - min;
        // Calculate thresholds at roughly 33% and 66% of the range
        // If diff is 0, add a tiny fallback so bins don't overlap exactly
        const safeDiff = diff === 0 ? 1 : diff;
        const val1 = roundToSignificantDigits(min + safeDiff / 3, 3);
        const val2 = roundToSignificantDigits(max - safeDiff / 3, 3);

        const val1Str = toEngineeringString(val1, 3);
        const val2Str = toEngineeringString(val2, 3);

        return [
            { id: uuidv4(), label: `data < ${val1Str}`, operator: '<', value: val1 },
            { id: uuidv4(), label: `data > ${val2Str}`, operator: '>', value: val2 },
        ];
    };

    const handleSave = () => {
        setGroupSettings(column, localSettings);
        closePopup();
    };

    const addBin = () => {
        setLocalSettings((prev: any) => ({
            ...prev,
            bins: [
                ...prev.bins,
                { id: uuidv4(), label: `Bin ${prev.bins.length + 1}`, operator: '>', value: 0 }
            ]
        }));
    };

    const updateBin = (id: string, field: keyof GroupSettings['bins'][0], value: any) => {
        setLocalSettings((prev: any) => ({
            ...prev,
            bins: prev.bins.map((bin: any) => bin.id === id ? { ...bin, [field]: value } : bin)
        }));
    };

    const removeBin = (id: string) => {
        setLocalSettings((prev: any) => ({
            ...prev,
            bins: prev.bins.filter((bin: any) => bin.id !== id)
        }));
    };

    return (
        <div className="card shadow w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Group Settings: {column}</h5>
                <button className="btn-close" onClick={closePopup}></button>
            </div>

            <div className="card-body overflow-auto">
                {!isNumeric ? (
                    <div className="mb-3 border rounded p-3 bg-white">
                        <h6 className="fw-bold mb-3">Categorical Values</h6>
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {Object.entries(categoryCounts)
                                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                                .map(([cat, count]) => (
                                    <div key={cat} className="d-flex justify-content-between align-items-center border-bottom pb-1">
                                        <span className="text-truncate" style={{ maxWidth: '70%' }} title={cat}>
                                            {cat === '' || cat === 'undefined' || cat === 'null' ? <em className="text-muted">(Empty/Null)</em> : cat}
                                        </span>
                                        <span className="badge bg-secondary rounded-pill">{count}</span>
                                    </div>
                                ))}
                        </div>
                        <div className="form-text mt-2 text-muted small">
                            Groups will be automatically created for each unique category shown above.
                        </div>
                    </div>
                ) : (

                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">Distribution Bins</label>
                            <button className="btn btn-sm btn-success" onClick={addBin}>+ Add Bin</button>
                        </div>

                        <div className="mb-3 border rounded p-1 bg-white" style={{ height: '120px' }}>
                            <Plot
                                data={[
                                    {
                                        x: numericData,
                                        type: 'histogram',
                                        marker: { color: '#0d6efd', opacity: 0.6 }
                                    }
                                ]}
                                layout={{
                                    margin: { t: 5, r: 5, b: 20, l: 30 },
                                    height: 110,
                                    xaxis: { fixedrange: true },
                                    yaxis: { fixedrange: true, showticklabels: false, visible: false },
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    shapes: localSettings.bins
                                        .filter((b: any) => b.operator !== '==' && b.operator !== '!=')
                                        .map((b: any) => ({
                                            type: 'line',
                                            x0: b.value,
                                            x1: b.value,
                                            y0: 0,
                                            y1: 1,
                                            yref: 'paper',
                                            line: { color: 'red', width: 2, dash: 'dot' }
                                        }))
                                }}
                                config={{ displayModeBar: false }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        {localSettings.bins.length === 0 ? (
                            <p className="text-muted small fst-italic">No bins defined. Data will not be grouped.</p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {localSettings.bins.map((bin: any, index: number) => (
                                    <div key={bin.id} className="border rounded p-2 bg-light">
                                        <div className="d-flex gap-2 mb-2 align-items-center">
                                            <span className="badge bg-secondary">{index + 1}</span>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Label (e.g. High)"
                                                value={bin.label}
                                                onChange={(e) => updateBin(bin.id, 'label', e.target.value)}
                                            />
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeBin(bin.id)}>&times;</button>
                                        </div>
                                        <div className="d-flex gap-2 align-items-center">
                                            <span className="small text-muted">If value is</span>
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: '70px' }}
                                                value={bin.operator}
                                                onChange={(e) => updateBin(bin.id, 'operator', e.target.value)}
                                            >
                                                <option value=">">&gt;</option>
                                                <option value=">=">&ge;</option>
                                                <option value="<">&lt;</option>
                                                <option value="<=">&le;</option>
                                                <option value="==">==</option>
                                                <option value="!=">!=</option>
                                            </select>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Value"
                                                value={bin.value}
                                                onChange={(e) => updateBin(bin.id, 'value', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="form-text text-muted mt-2 small">
                            Bins are evaluated in order. The first matching bin determines the group.
                        </div>
                    </div>
                )}
            </div>

            <div className="card-footer text-end">
                <button className="btn btn-secondary me-2" onClick={closePopup}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
            </div>
        </div>
    );
};

export default GroupAxisSettings;
