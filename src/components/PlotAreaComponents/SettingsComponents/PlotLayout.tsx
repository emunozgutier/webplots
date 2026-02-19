import React, { useState, useEffect } from 'react';
import { usePlotLayoutStore } from '../../../store/PlotLayoutStore';

import { useCsvDataStore } from '../../../store/CsvDataStore';
import { useAxisSideMenuStore } from '../../../store/AxisSideMenuStore';
import { useAppStateStore } from '../../../store/AppStateStore';

const PlotLayout: React.FC = () => {
    const { plotLayout, setPlotTitle, setXAxisTitle, setYAxisTitle, setXRange, setYRange } = usePlotLayoutStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { data } = useCsvDataStore();
    const { closePopup } = useAppStateStore();

    // Calculate default titles based on selection
    const defaultPlotTitle = sideMenuData.yAxis.length > 0 && sideMenuData.xAxis
        ? `Plot: ${sideMenuData.yAxis.join(', ')} vs ${sideMenuData.xAxis}`
        : '';
    const defaultXTitle = sideMenuData.xAxis || '';
    const defaultYTitle = sideMenuData.yAxis.length === 1 ? sideMenuData.yAxis[0] : (sideMenuData.yAxis.length > 0 ? 'Values' : '');

    // Calculate default ranges based on data
    const calculateRange = (columns: string[]) => {
        if (!data || data.length === 0 || columns.length === 0) return { min: '', max: '' };

        const values: number[] = [];
        columns.forEach(col => {
            data.forEach(row => {
                const val = parseFloat(String(row[col]));
                if (!isNaN(val)) values.push(val);
            });
        });

        if (values.length === 0) return { min: '', max: '' };

        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        const roundTo3SigFigs = (num: number, direction: 'min' | 'max') => {
            if (num === 0) return 0;
            const d = Math.ceil(Math.log10(num < 0 ? -num : num));
            const power = 3 - d;
            const magnitude = Math.pow(10, power);

            // To handle floating point precision issues (e.g. 0.300000000004), 
            // round slightly before floor/ceil, but keep enough precision
            const shifted = Math.round(num * magnitude * 1e9) / 1e9;

            if (direction === 'max') {
                return Math.ceil(shifted) / magnitude;
            } else {
                return Math.floor(shifted) / magnitude;
            }
        };

        return {
            min: roundTo3SigFigs(minVal, 'min').toString(),
            max: roundTo3SigFigs(maxVal, 'max').toString()
        };
    };

    const xRangeDefaults = calculateRange(sideMenuData.xAxis ? [sideMenuData.xAxis] : []);
    const yRangeDefaults = calculateRange(sideMenuData.yAxis);

    // Local state for inputs
    const [localPlotTitle, setLocalPlotTitle] = useState(plotLayout.plotTitle || defaultPlotTitle);
    const [localXTitle, setLocalXTitle] = useState(plotLayout.xAxisTitle || defaultXTitle);
    const [localYTitle, setLocalYTitle] = useState(plotLayout.yAxisTitle || defaultYTitle);

    const [localXMin, setLocalXMin] = useState(plotLayout.xRange ? plotLayout.xRange[0].toString() : xRangeDefaults.min);
    const [localXMax, setLocalXMax] = useState(plotLayout.xRange ? plotLayout.xRange[1].toString() : xRangeDefaults.max);

    const [localYMin, setLocalYMin] = useState(plotLayout.yRange ? plotLayout.yRange[0].toString() : yRangeDefaults.min);
    const [localYMax, setLocalYMax] = useState(plotLayout.yRange ? plotLayout.yRange[1].toString() : yRangeDefaults.max);

    // Update local state when visibility changes to ensure fresh defaults if data changed
    useEffect(() => {
        setLocalPlotTitle(plotLayout.plotTitle || defaultPlotTitle);
        setLocalXTitle(plotLayout.xAxisTitle || defaultXTitle);
        setLocalYTitle(plotLayout.yAxisTitle || defaultYTitle);

        const freshXDefaults = calculateRange(sideMenuData.xAxis ? [sideMenuData.xAxis] : []);
        setLocalXMin(plotLayout.xRange ? plotLayout.xRange[0].toString() : freshXDefaults.min);
        setLocalXMax(plotLayout.xRange ? plotLayout.xRange[1].toString() : freshXDefaults.max);

        const freshYDefaults = calculateRange(sideMenuData.yAxis);
        setLocalYMin(plotLayout.yRange ? plotLayout.yRange[0].toString() : freshYDefaults.min);
        setLocalYMax(plotLayout.yRange ? plotLayout.yRange[1].toString() : freshYDefaults.max);
    }, [plotLayout.plotTitle, plotLayout.xAxisTitle, plotLayout.yAxisTitle, plotLayout.xRange, plotLayout.yRange, sideMenuData, data]);

    const handleSave = () => {
        setPlotTitle(localPlotTitle);
        setXAxisTitle(localXTitle);
        setYAxisTitle(localYTitle);

        if (localXMin !== '' && localXMax !== '') {
            setXRange([parseFloat(localXMin), parseFloat(localXMax)]);
        } else {
            setXRange(null);
        }

        if (localYMin !== '' && localYMax !== '') {
            setYRange([parseFloat(localYMin), parseFloat(localYMax)]);
        } else {
            setYRange(null);
        }

        closePopup();
    };

    const handleAutoX = () => {
        setLocalXMin(xRangeDefaults.min);
        setLocalXMax(xRangeDefaults.max);
    };

    const handleAutoY = () => {
        setLocalYMin(yRangeDefaults.min);
        setLocalYMax(yRangeDefaults.max);
    };

    return (
        <>
            <div className="card-body">
                <div className="mb-3">
                    <label className="form-label small fw-bold">Plot Title</label>
                    <input type="text" className="form-control form-control-sm" value={localPlotTitle} onChange={e => setLocalPlotTitle(e.target.value)} />
                </div>
                <div className="row mb-3">
                    <div className="col-6">
                        <label className="form-label small fw-bold">X-Axis Title</label>
                        <input type="text" className="form-control form-control-sm" value={localXTitle} onChange={e => setLocalXTitle(e.target.value)} />
                    </div>
                    <div className="col-6">
                        <label className="form-label small fw-bold">Y-Axis Title</label>
                        <input type="text" className="form-control form-control-sm" value={localYTitle} onChange={e => setLocalYTitle(e.target.value)} />
                    </div>
                </div>

                <hr />

                <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold mb-0">X-Axis Range</label>
                        <button className="btn btn-xs btn-outline-secondary py-0" style={{ fontSize: '0.7rem' }} onClick={handleAutoX}>Auto</button>
                    </div>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Min</span>
                        <input type="number" className="form-control" value={localXMin} onChange={e => setLocalXMin(e.target.value)} placeholder="Auto" />
                        <span className="input-group-text">Max</span>
                        <input type="number" className="form-control" value={localXMax} onChange={e => setLocalXMax(e.target.value)} placeholder="Auto" />
                    </div>
                </div>

                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold mb-0">Y-Axis Range</label>
                        <button className="btn btn-xs btn-outline-secondary py-0" style={{ fontSize: '0.7rem' }} onClick={handleAutoY}>Auto</button>
                    </div>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Min</span>
                        <input type="number" className="form-control" value={localYMin} onChange={e => setLocalYMin(e.target.value)} placeholder="Auto" />
                        <span className="input-group-text">Max</span>
                        <input type="number" className="form-control" value={localYMax} onChange={e => setLocalYMax(e.target.value)} placeholder="Auto" />
                    </div>
                </div>
            </div>
            <div className="card-footer bg-light d-flex justify-content-end">
                <button className="btn btn-sm btn-secondary me-2" onClick={closePopup}>Close</button>
                <button className="btn btn-sm btn-primary" onClick={handleSave}>Save Layout</button>
            </div>
        </>
    );
};

export default PlotLayout;
