import React, { useMemo, useState, useRef } from 'react';
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
    const hueGlobal = useStyleSideMenuStore(state => state.colorData.hue);

    const [dragRange, setDragRange] = useState<[number, number] | null>(null);
    const [draggingAnchor, setDraggingAnchor] = useState<0 | 1 | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const defaultBaseHue = typeof hueGlobal.value === 'number' ? hueGlobal.value : 0;
    const [baseHue, setBaseHue] = useState<number>(defaultBaseHue);

    if (type !== 'number' || !currentMapping || typeof currentMapping.value !== 'string') {
        return null;
    }

    const { 
        min, max, binCenters, bins, barColors, rangeMin, rangeMax 
    } = useMemo(() => {
        const vals = data.map((row: any) => parseFloat(String(row[currentMapping.value]))).filter((v: number) => !isNaN(v));
        const dataMin = vals.length > 0 ? Math.min(...vals) : 0;
        const dataMax = vals.length > 0 ? Math.max(...vals) : 0;
        
        const rMin = Number(currentMapping.range ? currentMapping.range[0] : (title === 'Node Size' ? 2 : 0));
        const rMax = Number(currentMapping.range ? currentMapping.range[1] : (title === 'Hue/Color' ? 360 : (title === 'Saturation' || title === 'Lightness' ? 1 : (title === 'Node Size' ? 20 : 100))));

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
            const mappedVal = mapToRange(center);
            if (title === 'Hue/Color') {
                const wrappedHue = ((mappedVal % 360) + 360) % 360; 
                return `hsl(${wrappedHue}, 80%, 50%)`;
            } else if (title === 'Saturation') {
                const cVal = clamp(mappedVal, 0, 1) * 100;
                return `hsl(${baseHue}, ${cVal}%, 50%)`;
            } else if (title === 'Lightness') {
                const cVal = clamp(mappedVal, 0, 1) * 100;
                return `hsl(${baseHue}, 80%, ${cVal}%)`;
            }
            return '#6c757d';
        });

        return { min: dataMin, max: dataMax, binCenters: binCentersArray, bins: binsArray, barColors: barColorsArray, rangeMin: rMin, rangeMax: rMax };
    }, [data, currentMapping.value, currentMapping.range, title, baseHue]);

    // Define visual bounds strictly so the HTML SVG scales precisely to coordinate logic
    const limitMin = title === 'Node Size' ? 1 : 0;
    const limitMax = title === 'Hue/Color' ? 360 : (title === 'Saturation' || title === 'Lightness' ? 1 : 100);

    const activeRangeMin = clamp(dragRange ? dragRange[0] : rangeMin, limitMin, limitMax);
    const activeRangeMax = clamp(dragRange ? dragRange[1] : rangeMax, limitMin, limitMax);

    const handlePointerMove = (e: React.PointerEvent) => {
        if (draggingAnchor === null || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const yOffset = clamp(e.clientY - rect.top, 0, rect.height);
        const percent = yOffset / rect.height;
        const val = limitMax - percent * (limitMax - limitMin);
        
        if (draggingAnchor === 0) setDragRange([val, activeRangeMax]);
        else setDragRange([activeRangeMin, val]);
    };

    const handlePointerUp = () => {
        if (draggingAnchor !== null) {
            setDraggingAnchor(null);
            updateFn({ range: [activeRangeMin, activeRangeMax] });
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

    // Plotly is absolutely purged of ALL drag state overlay logic. True visual data only.
    const mapData: any = useMemo(() => ([
        ...(title === 'Hue/Color' || title === 'Saturation' || title === 'Lightness' ? [{
            x: max > min ? [min, max] : [min - 1, min + 1],
            y: Array.from({ length: 73 }, (_, i) => title === 'Hue/Color' ? i * 5 : i / 72),
            z: Array.from({ length: 73 }, (_, i) => [title === 'Hue/Color' ? i * 5 : i / 72, title === 'Hue/Color' ? i * 5 : i / 72]),
            type: 'heatmap' as const,
            colorscale: Array.from({ length: 37 }, (_, i) => {
                const fraction = i / 36;
                if (title === 'Hue/Color') {
                    return [fraction, `hsl(${fraction * 360}, 80%, 50%)`];
                } else if (title === 'Saturation') {
                    return [fraction, `hsl(${baseHue}, ${fraction * 100}%, 50%)`];
                } else {
                    return [fraction, `hsl(${baseHue}, 80%, ${fraction * 100}%)`];
                }
            }) as [number, string][],
            showscale: false,
            hoverinfo: 'none' as const,
            opacity: 0.4,
            zsmooth: 'best' as const
        }] : [])
    ]), [title, min, max, baseHue]);

    const mapLayout: any = useMemo(() => ({
        margin: { t: 15, r: 40, l: 40, b: 20 },
        // Fixed y-axis bounds ensures the custom 100% SVG line accurately overlaps physical data coordinate systems
        xaxis: { range: [min, max], fixedrange: true, showgrid: false, zeroline: false, showline: true, showticklabels: true },
        yaxis: { fixedrange: true, visible: false, range: [limitMin, limitMax] },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        dragmode: false
    }), [min, max, limitMin, limitMax]);

    // Fast mapping calculations for absolute position anchoring
    const dY = (limitMax - limitMin) || 1;
    const y1Percent = (limitMax - activeRangeMin) / dY * 100;
    const y2Percent = (limitMax - activeRangeMax) / dY * 100;

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

                <div className="d-flex align-items-center justify-content-between mt-2 mb-1">
                    <label className="form-label small text-muted mb-0 fw-bold d-flex align-items-center">
                        <span className="me-3">2. Mapped Range Assignment</span>
                        {(title === 'Saturation' || title === 'Lightness') && (
                            <div className="d-flex align-items-center fw-normal border rounded px-1" style={{ background: '#f8f9fa' }}>
                                <span className="small text-muted me-2" style={{ fontSize: '0.7rem' }}>Base Hue (°):</span>
                                <input 
                                    type="number" 
                                    className="form-control form-control-sm border-0 bg-transparent text-primary fw-bold" 
                                    style={{ width: '50px', height: '22px', fontSize: '0.75rem', padding: '0px' }} 
                                    value={baseHue} 
                                    onChange={e => setBaseHue(Number(e.target.value))} 
                                />
                            </div>
                        )}
                    </label>
                    <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>Drag the endpoints of the line!</span>
                </div>
                
                <div className="border rounded bg-light p-1 border-top-0 rounded-top-0 flex-grow-1" style={{ minHeight: '160px', position: 'relative' }}>
                    <Plot
                        data={mapData}
                        layout={mapLayout}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                    />
                    
                    {/* SVG Interactive Overlay Engine */}
                    <svg
                        ref={svgRef}
                        style={{ position: 'absolute', top: 15, bottom: 20, left: 40, right: 40, width: 'calc(100% - 80px)', height: 'calc(100% - 35px)', overflow: 'visible', zIndex: 10, touchAction: 'none' }}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        <line 
                            x1="0%" y1={`${y1Percent}%`} 
                            x2="100%" y2={`${y2Percent}%`} 
                            stroke="black" strokeWidth="3" 
                        />
                        <circle 
                            cx="0%" cy={`${y1Percent}%`} r="8" 
                            fill="black" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }} 
                            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDraggingAnchor(0); }} 
                        />
                        <circle 
                            cx="100%" cy={`${y2Percent}%`} r="8" 
                            fill="black" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }} 
                            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDraggingAnchor(1); }} 
                        />
                    </svg>
                </div>

            </div>
            <div className="card-footer text-end p-2 flex-shrink-0 bg-white">
                <button className="btn btn-secondary btn-sm" onClick={closePopup}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default StyleElementSettings;
