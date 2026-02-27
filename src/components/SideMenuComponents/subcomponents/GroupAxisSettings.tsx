import React, { useState, useEffect } from 'react';
import { useGroupSideMenuStore } from '../../../store/GroupSideMenuStore';
import type { GroupSettings } from '../../../store/GroupSideMenuStore';
import { useAppStateStore } from '../../../store/AppStateStore';
import { useCsvDataStore } from '../../../store/CsvDataStore';
import Plot from 'react-plotly.js';
import { v4 as uuidv4 } from 'uuid';

interface GroupAxisSettingsProps {
    column: string;
}

const GroupAxisSettings: React.FC<GroupAxisSettingsProps> = ({ column }) => {
    const { groupSideMenuData, setGroupSettings } = useGroupSideMenuStore();
    const { closePopup } = useAppStateStore();
    const { data } = useCsvDataStore();

    const [localSettings, setLocalSettings] = useState<GroupSettings>({
        mode: 'auto',
        bins: []
    });

    // Extract numeric column data for preview
    const { numericData, dataMin, dataMax } = React.useMemo(() => {
        if (!data || data.length === 0) return { numericData: [], dataMin: 0, dataMax: 100 };
        const nums: number[] = [];
        let min = Infinity, max = -Infinity;
        data.forEach((row: any) => {
            const val = parseFloat(String(row[column]));
            if (!isNaN(val)) {
                nums.push(val);
                if (val < min) min = val;
                if (val > max) max = val;
            }
        });
        if (min === Infinity) { min = 0; max = 100; }
        return { numericData: nums, dataMin: min, dataMax: max };
    }, [data, column]);

    useEffect(() => {
        if (groupSideMenuData.groupSettings && groupSideMenuData.groupSettings[column]) {
            const saved = groupSideMenuData.groupSettings[column];
            if (saved.mode === 'manual' && saved.bins.length === 0) {
                setLocalSettings({ mode: 'manual', bins: generateDefaultBins(dataMin, dataMax) });
            } else {
                setLocalSettings(saved);
            }
        } else {
            // Default: auto
            setLocalSettings({ mode: 'auto', bins: [] });
        }
    }, [column, groupSideMenuData.groupSettings, dataMin, dataMax]);

    // Used when toggling explicitly to manual
    const handleModeToggle = (mode: 'auto' | 'manual') => {
        setLocalSettings((prev: any) => {
            if (mode === 'manual' && prev.bins.length === 0) {
                return { mode: 'manual', bins: generateDefaultBins(dataMin, dataMax) };
            }
            return { ...prev, mode };
        });
    };

    const generateDefaultBins = (min: number, max: number): GroupSettings['bins'] => {
        const diff = max - min;
        // Calculate thresholds at roughly 33% and 66% of the range
        // If diff is 0, add a tiny fallback so bins don't overlap exactly
        const safeDiff = diff === 0 ? 1 : diff;
        const val1 = parseFloat((min + safeDiff / 3).toPrecision(3));
        const val2 = parseFloat((max - safeDiff / 3).toPrecision(3));

        return [
            { id: uuidv4(), label: `data < ${val1}`, operator: '<', value: val1 },
            { id: uuidv4(), label: `data > ${val2}`, operator: '>', value: val2 },
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
                <div className="mb-3">
                    <label className="form-label fw-bold">Grouping Mode</label>
                    <div className="btn-group w-100" role="group">
                        <button
                            type="button"
                            className={`btn ${localSettings.mode === 'auto' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleModeToggle('auto')}
                        >
                            Auto (Unique Values)
                        </button>
                        <button
                            type="button"
                            className={`btn ${localSettings.mode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleModeToggle('manual')}
                        >
                            Manual (Bins)
                        </button>
                    </div>
                    {localSettings.mode === 'auto' && (
                        <div className="form-text text-muted mt-2">
                            Automatically creates a group for each unique value found in the column. Limited to 8 groups.
                        </div>
                    )}
                </div>

                {localSettings.mode === 'manual' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">Bins</label>
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
