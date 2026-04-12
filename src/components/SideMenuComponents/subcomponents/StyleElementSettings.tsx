import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useStyleSideMenuStore, type StyleSideMenuData } from '../../../store/SideMenu/useStyleSideMenuStore';
import type { StyleElementProps } from './StyleElement';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const StyleElementSettings: React.FC<StyleElementProps> = ({ title, updateFn, type }) => {
    const { closePopup } = useWorkspaceLocalStore();
    const { data } = useCsvDataStore();

    const keyMap: Record<string, keyof StyleSideMenuData> = {
        'Hue/Color': 'hue',
        'Saturation': 'saturation',
        'Lightness': 'lightness',
        'Shape': 'shape',
        'Node Size': 'size'
    };
    const storeKey = keyMap[title];
    const currentMapping = useStyleSideMenuStore(state => state.colorData[storeKey]);

    const [dragRange, setDragRange] = useState<[number, number] | null>(null);

    if (type !== 'number' || !currentMapping || typeof currentMapping.value !== 'string') {
        return null;
    }

    const { 
        min, max, binCenters, bins, barColors, rangeMin, rangeMax, mapDomain 
    } = useMemo(() => {
        const vals = data.map((row: any) => parseFloat(String(row[currentMapping.value]))).filter((v: number) => !isNaN(v));
        const dataMin = vals.length > 0 ? Math.min(...vals) : 0;
        const dataMax = vals.length > 0 ? Math.max(...vals) : 0;
        
        const rMin = Number(currentMapping.range ? currentMapping.range[0] : (title === 'Node Size' ? 2 : 0));
        const rMax = Number(currentMapping.range ? currentMapping.range[1] : (title === 'Hue/Color' ? 360 : (title === 'Node Size' ? 20 : 100)));

        const domainVal = [dataMin, dataMax];
        const spanX = domainVal[1] - domainVal[0] || 1;

        const binCount = 40;
        const binWidth = dataMax > dataMin ? (dataMax - dataMin) / binCount : 1;
        const binsArray = Array(binCount).fill(0);
        const binCentersArray = Array(binCount).fill(0);

        for (let i = 0; i < binCount; i++) {
            binCentersArray[i] = dataMin + (i + 0.5) * binWidth;
        }

        vals.forEach(val => {
            let binIndex = Math.floor((val - dataMin) / binWidth);
            if (binIndex >= binCount) binIndex = binCount - 1;
            if (binIndex < 0) binIndex = 0;
            binsArray[binIndex]++;
        });

        const mapToRange = (val: number) => {
            let constrainedVal = val;
            if (domainVal[0] <= domainVal[1]) {
                constrainedVal = clamp(val, domainVal[0], domainVal[1]);
            } else {
                constrainedVal = clamp(val, domainVal[1], domainVal[0]);
            }
            return rMin + ((constrainedVal - domainVal[0]) / spanX) * (rMax - rMin);
        };

        const barColorsArray = binCentersArray.map(center => {
            if (title === 'Hue/Color') {
                const hue = mapToRange(center);
                const wrappedHue = ((hue % 360) + 360) % 360; 
                return `hsl(${wrappedHue}, 80%, 50%)`;
            }
            return '#6c757d';
        });

        return { min: dataMin, max: dataMax, binCenters: binCentersArray, bins: binsArray, barColors: barColorsArray, rangeMin: rMin, rangeMax: rMax, mapDomain: domainVal };
    }, [data, currentMapping.value, currentMapping.range, title]);

    const activeRangeMin = dragRange ? dragRange[0] : rangeMin;
    const activeRangeMax = dragRange ? dragRange[1] : rangeMax;

    const handleRelayouting = (e: any) => {
        let newYR = dragRange ? [...dragRange] : [rangeMin, rangeMax];
        let changed = false;

        if (e['shapes[0].y0'] !== undefined) { newYR[0] = Number(e['shapes[0].y0']); changed = true; }
        if (e['shapes[0].y1'] !== undefined) { newYR[1] = Number(e['shapes[0].y1']); changed = true; }

        if (changed) {
            setDragRange([newYR[0], newYR[1]]);
        }
    };

    const handleRelayout = (e: any) => {
        let newYR = dragRange ? [...dragRange] : [rangeMin, rangeMax];
        let changed = false;

        if (e['shapes[0].y0'] !== undefined) { newYR[0] = Number(e['shapes[0].y0']); changed = true; }
        if (e['shapes[0].y1'] !== undefined) { newYR[1] = Number(e['shapes[0].y1']); changed = true; }

        if (changed) {
            setDragRange(null);
            updateFn({ range: [newYR[0], newYR[1]] });
        } else {
            setDragRange(null); 
        }
    };

    const histData: any = useMemo(() => [{
        x: binCenters,
        y: bins,
        type: 'bar',
        marker: { color: barColors },
        hoverinfo: 'x+y'
    }], [binCenters, bins, barColors]);

    const histLayout: any = useMemo(() => ({
        margin: { t: 10, r: 40, l: 40, b: 20 },
        xaxis: { range: [min, max], fixedrange: true, showgrid: false },
        yaxis: { fixedrange: true, title: { text: 'Count', font: { size: 10 } }, showgrid: false },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        bargap: 0.05
    }), [min, max]);

    const mapData: any = useMemo(() => ([
        ...(title === 'Hue/Color' ? [{
            x: max > min ? [min, max] : [min - 1, min + 1],
            y: Array.from({ length: 73 }, (_, i) => i * 5),
            z: Array.from({ length: 73 }, (_, i) => [i * 5, i * 5]),
            type: 'heatmap' as const,
            colorscale: Array.from({ length: 37 }, (_, i) => [i / 36, `hsl(${i * 10}, 80%, 50%)`] as [number, string]),
            showscale: false,
            hoverinfo: 'none' as const,
            opacity: 0.4,
            zsmooth: 'best' as const
        }] : []),
        {
            x: [min, max],
            y: [activeRangeMin, Math.max(activeRangeMin, activeRangeMax)], 
            type: 'scatter',
            mode: 'none', 
            hoverinfo: 'none'
        },
        {
            x: [mapDomain[0], mapDomain[1]],
            y: [activeRangeMin, activeRangeMax],
            type: 'scatter',
            mode: 'markers',
            marker: { color: 'black', size: 14, line: { color: 'white', width: 2 } },
            hoverinfo: 'none',
            cliponaxis: false
        }
    ]), [title, min, max, activeRangeMin, activeRangeMax, mapDomain]);

    const mapLayout: any = useMemo(() => ({
        margin: { t: 15, r: 40, l: 40, b: 20 },
        xaxis: { range: [min, max], fixedrange: true, showgrid: false, zeroline: false, showline: true, showticklabels: true },
        yaxis: { fixedrange: true, visible: false },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        shapes: [
            {
                type: 'line',
                x0: mapDomain[0],
                y0: activeRangeMin,
                x1: mapDomain[1],
                y1: activeRangeMax,
                line: { color: 'black', width: 3 },
                editable: true,
                layer: 'above'
            }
        ],
        dragmode: false,
        uirevision: 'mapping-plot'
    }), [min, max, mapDomain, activeRangeMin, activeRangeMax]);

    return (
        <div className="card shadow w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fs-6">Adjust Range for {title}</h5>
                <button className="btn-close" onClick={closePopup}></button>
            </div>
            <div className="card-body p-3 overflow-auto" style={{ display: 'flex', flexDirection: 'column' }}>
                
                <label className="form-label small text-muted mb-1 fw-bold">1. Histogram Frequency</label>
                <div className="border rounded bg-light p-1 border-bottom-0 rounded-bottom-0" style={{ flexShrink: 0, height: '140px' }}>
                    <Plot
                        data={histData}
                        layout={histLayout}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                    />
                </div>

                <label className="form-label small text-muted mb-1 mt-2 fw-bold d-flex align-items-center justify-content-between">
                    <span>2. Mapped Range Assignment</span>
                    <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>Drag the endpoints of the line!</span>
                </label>
                <div className="border rounded bg-light p-1 border-top-0 rounded-top-0 flex-grow-1" style={{ minHeight: '160px' }}>
                    <Plot
                        data={mapData}
                        layout={mapLayout}
                        onRelayout={handleRelayout}
                        // @ts-ignore
                        onRelayouting={handleRelayouting}
                        config={{ displayModeBar: false, edits: { shapePosition: true } }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                    />
                </div>

            </div>
            <div className="card-footer text-end p-2 flex-shrink-0 bg-white">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted me-1">Output Min:</span>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: '70px' }}
                            value={Math.round(activeRangeMin)}
                            onChange={e => updateFn({ range: [Number(e.target.value), rangeMax] })}
                        />
                        <span className="small text-muted ms-2 me-1">Output Max:</span>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: '70px' }}
                            value={Math.round(activeRangeMax)}
                            onChange={e => updateFn({ range: [rangeMin, Number(e.target.value)] })}
                        />
                    </div>
                    <button className="btn btn-secondary btn-sm ms-3" onClick={closePopup}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StyleElementSettings;
