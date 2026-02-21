import React, { useState, useEffect } from 'react';
import { useAxisSideMenuStore } from '../../store/AxisSideMenuStore';
import type { GroupSettings } from '../../store/AxisSideMenuStore';
import { useAppStateStore } from '../../store/AppStateStore';
import { v4 as uuidv4 } from 'uuid';

interface GroupAxisSettingsProps {
    column: string;
}

const GroupAxisSettings: React.FC<GroupAxisSettingsProps> = ({ column }) => {
    const { sideMenuData, setGroupSettings } = useAxisSideMenuStore();
    const { closePopup } = useAppStateStore();
    const [localSettings, setLocalSettings] = useState<GroupSettings>({
        mode: 'auto',
        bins: []
    });

    useEffect(() => {
        if (sideMenuData.groupSettings && sideMenuData.groupSettings[column]) {
            setLocalSettings(sideMenuData.groupSettings[column]);
        } else {
            // Default
            setLocalSettings({ mode: 'auto', bins: [] });
        }
    }, [column, sideMenuData.groupSettings]);

    const handleSave = () => {
        setGroupSettings(column, localSettings);
        closePopup();
    };

    const addBin = () => {
        setLocalSettings(prev => ({
            ...prev,
            bins: [
                ...prev.bins,
                { id: uuidv4(), label: `Bin ${prev.bins.length + 1}`, operator: '>', value: 0 }
            ]
        }));
    };

    const updateBin = (id: string, field: keyof GroupSettings['bins'][0], value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            bins: prev.bins.map(bin => bin.id === id ? { ...bin, [field]: value } : bin)
        }));
    };

    const removeBin = (id: string) => {
        setLocalSettings(prev => ({
            ...prev,
            bins: prev.bins.filter(bin => bin.id !== id)
        }));
    };

    return (
        <div className="card shadow" style={{ width: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
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
                            onClick={() => setLocalSettings(prev => ({ ...prev, mode: 'auto' }))}
                        >
                            Auto (Unique Values)
                        </button>
                        <button
                            type="button"
                            className={`btn ${localSettings.mode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setLocalSettings(prev => ({ ...prev, mode: 'manual' }))}
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

                        {localSettings.bins.length === 0 ? (
                            <p className="text-muted small fst-italic">No bins defined. Data will not be grouped.</p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {localSettings.bins.map((bin, index) => (
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
