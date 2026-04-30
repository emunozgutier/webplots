import React, { useMemo, useState, useRef } from 'react';
import Plot from 'react-plotly.js';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import { useWorkspaceStore } from '../../../store/Workspace/useWorkspaceStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useStyleSideMenuStore, type StyleSideMenuData } from '../../../store/SideMenu/useStyleSideMenuStore';
import { calculateLogBase } from '../../../utils/TableMathLib';
import type { StyleElementProps } from './StyleElement';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const StyleElementSettings: React.FC<StyleElementProps> = ({ title, updateFn, type }) => {
    const { closePopup } = useWorkspaceLocalStore();
    const { isDebugMode } = useWorkspaceStore();
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
    const [draggingAnchor, setDraggingAnchor] = useState<0 | 1 | 2 | null>(null);
    const [dragMidPoint, setDragMidPoint] = useState<[number, number] | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [sliderHeight, setSliderHeight] = useState(125); // Target height of our horizontal rotated slider

    const defaultBaseHue = typeof hueGlobal.value === 'number' ? hueGlobal.value : 0;
    const [baseHue, setBaseHue] = useState<number>(defaultBaseHue);
    const [useLogScale, setUseLogScale] = useState<boolean>(false);

    if (type !== 'number' || !currentMapping || typeof (currentMapping as any).value !== 'string') {
        return null;
    }

    // Resize observer to lock the offset slider width exactly to the SVG plot height
    React.useEffect(() => {
        if (!svgRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.height > 0) {
                    setSliderHeight(entry.contentRect.height);
                }
            }
        });
        observer.observe(svgRef.current);
        return () => observer.disconnect();
    }, []);

    const mapping = currentMapping as import('../../../store/SideMenu/useStyleSideMenuStore').AestheticMapping;
    const mappingType = mapping.mappingType || 'linear';
    let defaultMidPoint: [number, number] = [0.5, 0.5];
    if (mappingType === 'curve') defaultMidPoint = [0.1, 0.9];
    
    const midPoint: [number, number] = mapping.midPoint || defaultMidPoint;
    const activeMidPoint: [number, number] = dragMidPoint || midPoint;
    const [activeCx, activeCy]: [number, number] = activeMidPoint;

    const { 
        min, max, binCenters, bins, barColors, rangeMin, rangeMax 
    } = useMemo(() => {
        let dataMin = Infinity;
        let dataMax = -Infinity;
        const vals: number[] = [];
        
        for (let i = 0; i < data.length; i++) {
            const v = parseFloat(String(data[i][mapping.value]));
            if (!isNaN(v)) {
                vals.push(v);
                if (v < dataMin) dataMin = v;
                if (v > dataMax) dataMax = v;
            }
        }

        if (dataMin === Infinity) {
            dataMin = 0;
            dataMax = 0;
        }
        
        const rMin = Number(currentMapping.range ? currentMapping.range[0] : (title === 'Node Size' ? 1 : 0));
        const rMax = Number(currentMapping.range ? currentMapping.range[1] : (title === 'Hue/Color' ? 360 : (title === 'Saturation' || title === 'Lightness' ? 100 : (title === 'Node Size' ? 20 : 100))));

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
            
            let x = spanX !== 0 ? (constrainedVal - domainVal[0]) / spanX : 0;
            x = clamp(x, 0, 1);

            let pct = x;
            if (mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') {
                const cx = Math.max(0.001, Math.min(0.999, activeCx));
                const cy = Math.max(0.001, Math.min(0.999, activeCy));
                const isExp = cy <= cx || mappingType === 'exponential';
                if (isExp) {
                    const kRaw = Math.log(cy) / Math.log(cx);
                    const k = clamp(kRaw, 1, 30);
                    pct = Math.pow(x, k);
                } else {
                    const B = calculateLogBase(cx, cy);
                    pct = Math.log(1 + (B - 1) * x) / Math.log(B);
                }
            }

            return rMin + pct * (rMax - rMin);
        };

        const barColorsArray = binCentersArray.map(center => {
            const mappedVal = mapToRange(center);
            if (title === 'Hue/Color') {
                const offsetVal = mapping.offset || 0;
                const wrappedHue = ((mappedVal + offsetVal) % 360 + 360) % 360; 
                return `hsl(${wrappedHue}, 80%, 50%)`;
            } else if (title === 'Saturation') {
                const cVal = clamp(mappedVal, 0, 100);
                return `hsl(${baseHue}, ${cVal}%, 50%)`;
            } else if (title === 'Lightness') {
                const cVal = clamp(mappedVal, 0, 100);
                return `hsl(${baseHue}, 80%, ${cVal}%)`;
            }
            return '#6c757d';
        });

        return { min: dataMin, max: dataMax, binCenters: binCentersArray, bins: binsArray, barColors: barColorsArray, rangeMin: rMin, rangeMax: rMax };
    }, [data, mapping.value, mapping.range, mapping.offset, title, baseHue, mappingType, activeCx, activeCy]);


    // Define visual bounds strictly so the HTML SVG scales precisely to coordinate logic
    const limitMin = title === 'Node Size' ? 1 : 0;
    const limitMax = title === 'Hue/Color' ? 360 : 100;

    const activeRangeMin = clamp(dragRange ? dragRange[0] : rangeMin, limitMin, limitMax);
    const activeRangeMax = clamp(dragRange ? dragRange[1] : rangeMax, limitMin, limitMax);

    const handlePointerMove = (e: React.PointerEvent) => {
        if (draggingAnchor === null || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const yOffset = clamp(e.clientY - rect.top, 0, rect.height);
        const percent = yOffset / rect.height;
        const val = limitMax - percent * (limitMax - limitMin);
        
        if (draggingAnchor === 0) setDragRange([val, activeRangeMax]);
        else if (draggingAnchor === 1) setDragRange([activeRangeMin, val]);
        else if (draggingAnchor === 2) {
            const xOffset = clamp(e.clientX - rect.left, 0, rect.width);
            const newCx = xOffset / rect.width;
            
            const currentYPercent = (yOffset / rect.height) * 100;
            const diff = y2Percent - y1Percent;
            let newCy = diff !== 0 ? (currentYPercent - y1Percent) / diff : 0.5;
            newCy = clamp(newCy, 0, 1);
            
            setDragMidPoint([newCx, newCy]);
        }
    };

    const handlePointerUp = () => {
        if (draggingAnchor !== null) {
            const oldAnchor = draggingAnchor;
            setDraggingAnchor(null);
            if (oldAnchor === 0 || oldAnchor === 1) {
                updateFn({ range: [activeRangeMin, activeRangeMax] });
            } else if (oldAnchor === 2) {
                updateFn({ midPoint: activeMidPoint });
                setDragMidPoint(null);
            }
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
        yaxis: { 
            fixedrange: true, 
            title: { text: 'Count', font: { size: 10 } }, 
            showgrid: false,
            type: useLogScale ? 'log' : 'linear'
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        bargap: 0.05
    }), [min, max, useLogScale]);

    // Plotly is absolutely purged of ALL drag state overlay logic. True visual data only.
    const mapData: any = useMemo(() => ([
        ...(title === 'Hue/Color' || title === 'Saturation' || title === 'Lightness' ? [{
            x: max > min ? [min, max] : [min - 1, min + 1],
            y: Array.from({ length: 73 }, (_, i) => title === 'Hue/Color' ? i * 5 : (i / 72) * 100),
            z: Array.from({ length: 73 }, (_, i) => [title === 'Hue/Color' ? i * 5 : (i / 72) * 100, title === 'Hue/Color' ? i * 5 : (i / 72) * 100]),
            type: 'heatmap' as const,
            colorscale: Array.from({ length: 37 }, (_, i) => {
                const fraction = i / 36;
                if (title === 'Hue/Color') {
                    const offsetVal = mapping.offset || 0;
                    return [fraction, `hsl(${((fraction * 360) + offsetVal) % 360}, 80%, 50%)`];
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
        }] : []),
        ...(title === 'Node Size' ? [0.15, 0.5, 0.85].map(xFrac => {
            const effectiveMin = max > min ? min : min - 1;
            const effectiveMax = max > min ? max : min + 1;
            const numDemos = 5;
            return {
                x: Array.from({ length: numDemos }, () => effectiveMin + (effectiveMax - effectiveMin) * xFrac),
                y: Array.from({ length: numDemos }, (_, i) => limitMin + i * (limitMax - limitMin) / (numDemos - 1)),
                mode: 'markers' as const,
                type: 'scatter' as const,
                marker: {
                    size: Array.from({ length: numDemos }, (_, i) => limitMin + i * (limitMax - limitMin) / (numDemos - 1)),
                    sizemode: (mapping.sizeMode || 'diameter') as 'diameter' | 'area',
                    color: 'rgba(108, 117, 125, 0.15)',
                    line: {
                        color: 'rgba(108, 117, 125, 0.4)',
                        width: 1
                    }
                },
                hoverinfo: 'none' as const,
                showlegend: false
            };
        }) : [])
    ]), [title, min, max, baseHue, limitMin, limitMax, mapping.offset]);

    const mapLayout: any = useMemo(() => ({
        margin: { t: 15, r: 40, l: 40, b: 20 },
        // Fixed y-axis bounds ensures the custom 100% SVG line accurately overlaps physical data coordinate systems
        xaxis: { range: [min, max], fixedrange: true, showgrid: false, zeroline: false, showline: true, showticklabels: true },
        yaxis: { 
            fixedrange: true, 
            visible: true, 
            range: [limitMin, limitMax],
            showgrid: title === 'Node Size',
            gridcolor: 'rgba(0,0,0,0.05)',
            zeroline: false,
            showticklabels: title === 'Node Size',
            showline: title === 'Node Size',
            tickfont: { size: 10 }
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        showlegend: false,
        dragmode: false
    }), [min, max, limitMin, limitMax, title]);

    // Fast mapping calculations for absolute position anchoring
    const dY = (limitMax - limitMin) || 1;
    const y1Percent = (limitMax - activeRangeMin) / dY * 100;
    const y2Percent = (limitMax - activeRangeMax) / dY * 100;

    const segments = [];
    const numPoints = 20;
    for (let i = 0; i < numPoints; i++) {
        const xA = i / numPoints;
        const xB = (i + 1) / numPoints;

        let pctA = xA;
        if (mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') {
            const cx = Math.max(0.001, Math.min(0.999, activeCx));
            const cy = Math.max(0.001, Math.min(0.999, activeCy));
            const isExp = cy <= cx || mappingType === 'exponential';
            if (isExp) {
                const kRaw = Math.log(cy) / Math.log(cx);
                const k = clamp(kRaw, 1, 30);
                pctA = Math.pow(xA, k);
            } else {
                const B = calculateLogBase(cx, cy);
                pctA = Math.log(1 + (B - 1) * xA) / Math.log(B);
            }
        }

        let pctB = xB;
        if (mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') {
            const cx = Math.max(0.001, Math.min(0.999, activeCx));
            const cy = Math.max(0.001, Math.min(0.999, activeCy));
            const isExp = cy <= cx || mappingType === 'exponential';
            if (isExp) {
                const kRaw = Math.log(cy) / Math.log(cx);
                const k = clamp(kRaw, 1, 30);
                pctB = Math.pow(xB, k);
            } else {
                const B = calculateLogBase(cx, cy);
                pctB = Math.log(1 + (B - 1) * xB) / Math.log(B);
            }
        }

        const yaPercent = y1Percent + pctA * (y2Percent - y1Percent);
        const ybPercent = y1Percent + pctB * (y2Percent - y1Percent);

        segments.push(
            <line 
                key={i}
                x1={`${xA * 100}%`} y1={`${yaPercent}%`} 
                x2={`${xB * 100}%`} y2={`${ybPercent}%`} 
                stroke="black" strokeWidth="3" 
            />
        );
    }

    return (
        <div className="card shadow w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fs-6">Adjust Range for {title}</h5>
                <button className="btn-close" onClick={closePopup}></button>
            </div>
            <div className="card-body p-3 overflow-auto" style={{ display: 'flex', flexDirection: 'column' }}>
                
                <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label small text-muted mb-0 fw-bold">1. Histogram Frequency</label>
                    <div className="form-check form-switch small mb-0 d-flex align-items-center">
                        <input 
                            className="form-check-input mt-0 me-2" 
                            type="checkbox" 
                            role="switch" 
                            id="logScaleSwitch" 
                            style={{ cursor: 'pointer', transform: 'scale(0.8)' }}
                            checked={useLogScale} 
                            onChange={(e) => setUseLogScale(e.target.checked)} 
                        />
                        <label className="form-check-label small text-muted mb-0" htmlFor="logScaleSwitch" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                            Log Scale
                        </label>
                    </div>
                </div>
                <div className="d-flex flex-row border rounded bg-light border-bottom-0 rounded-bottom-0" style={{ flexShrink: 0, height: '140px' }}>
                    {title === 'Hue/Color' && (
                        <div className="border-end border-bottom-0" style={{ width: '45px', minWidth: '45px' }}>
                            {/* Invisible spacer to explicitly align the Plotly layout with the offset map underneath */}
                        </div>
                    )}
                    <div className="flex-grow-1 p-1" style={{ overflow: 'hidden' }}>
                        <Plot
                            data={histData}
                            layout={histLayout}
                            config={{ displayModeBar: false }}
                            style={{ width: '100%', height: '100%' }}
                            useResizeHandler={true}
                        />
                    </div>
                </div>

                <div className="mt-2 mb-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label small text-muted mb-0 fw-bold d-flex align-items-center">
                            <span className="me-2">2. Mapped Range Assignment</span>
                        </label>
                        <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>Drag the endpoints of the line!</span>
                    </div>
                    
                    <div className="d-flex align-items-center mt-1">
                        <div className="d-flex align-items-center fw-normal border rounded px-2 py-1 w-100" style={{ background: '#f8f9fa' }}>
                            <span className="small text-muted me-2" style={{ fontSize: '0.75rem' }}>Mapping Type:</span>
                            <select 
                                className="form-select form-select-sm border-0 bg-transparent text-primary fw-bold" 
                                style={{ width: 'auto', height: '22px', fontSize: '0.75rem', padding: '0px 35px 0px 5px', cursor: 'pointer' }}
                                value={mappingType}
                                onChange={e => {
                                    const newType = e.target.value as any;
                                    let newMid = midPoint;
                                    if ((newType === 'curve' || newType === 'exponential' || newType === 'logarithmic') && mappingType !== 'curve' && mappingType !== 'exponential' && mappingType !== 'logarithmic') newMid = [0.5, 0.5];
                                    updateFn({ mappingType: newType, midPoint: newMid });
                                }}
                            >
                                <option value="linear">Line</option>
                                <option value="curve">Exp/Log</option>
                            </select>

                            {(title === 'Saturation' || title === 'Lightness') && (
                                <div className="d-flex align-items-center ms-auto border-start ps-2">
                                    <span className="small text-muted me-2" style={{ fontSize: '0.75rem' }}>Target Base Hue:</span>
                                    <select 
                                        className="form-select form-select-sm border-0 bg-transparent text-primary fw-bold" 
                                        style={{ width: 'auto', height: '22px', fontSize: '0.75rem', padding: '0px 35px 0px 5px', cursor: 'pointer' }} 
                                        value={baseHue} 
                                        onChange={e => setBaseHue(Number(e.target.value))} 
                                    >
                                        {[
                                            { name: "Red", hue: 0 },
                                            { name: "Orange", hue: 30 },
                                            { name: "Yellow", hue: 60 },
                                            { name: "Yellow-Green", hue: 90 },
                                            { name: "Green", hue: 120 },
                                            { name: "Spring Green", hue: 150 },
                                            { name: "Cyan", hue: 180 },
                                            { name: "Azure", hue: 210 },
                                            { name: "Blue", hue: 240 },
                                            { name: "Violet", hue: 270 },
                                            { name: "Magenta", hue: 300 },
                                            { name: "Rose", hue: 330 },
                                        ].map(color => (
                                            <option key={color.hue} value={color.hue}>{color.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {title === 'Node Size' && (
                                <div className="d-flex align-items-center ms-auto border-start ps-2">
                                    <span className="small text-muted me-2" style={{ fontSize: '0.75rem' }}>Scaling Mode:</span>
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button 
                                            type="button" 
                                            className={`btn ${mapping.sizeMode === 'diameter' || !mapping.sizeMode ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => updateFn({ sizeMode: 'diameter' })}
                                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', zIndex: 0 }}
                                        >
                                            Radius
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${mapping.sizeMode === 'area' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => updateFn({ sizeMode: 'area' })}
                                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', zIndex: 0 }}
                                        >
                                            Area
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="d-flex flex-row flex-grow-1 border rounded bg-light border-top-0 rounded-top-0" style={{ minHeight: '160px' }}>
                    {title === 'Hue/Color' && (
                        <div className="d-flex flex-column align-items-center justify-content-center border-end bg-white" style={{ width: '45px', minWidth: '45px' }}>
                            <span className="small text-muted mb-2" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Offset</span>
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '25px', position: 'relative' }}>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="360" 
                                    value={mapping.offset || 0} 
                                    onChange={(e) => updateFn({ offset: Number(e.target.value) })}
                                    style={{ 
                                        width: `${sliderHeight}px`,
                                        height: '20px',
                                        transform: 'rotate(-90deg)',
                                        transformOrigin: 'center',
                                        cursor: 'pointer',
                                        position: 'absolute'
                                    }}
                                />
                            </div>
                            <span className="small mt-2" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>{mapping.offset || 0}&deg;</span>
                        </div>
                    )}
                    <div className="flex-grow-1 p-1" style={{ position: 'relative', overflow: 'hidden' }}>
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
                            {segments}
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
                            {(mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') && (
                                <circle 
                                    cx={`${activeCx * 100}%`} cy={`${y1Percent + activeCy * (y2Percent - y1Percent)}%`} r="6" 
                                    fill="white" stroke="black" strokeWidth="2" style={{ cursor: 'move' }} 
                                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDraggingAnchor(2); }} 
                                />
                            )}
                        </svg>
                    </div>
                </div>
                <div className="flex-shrink-0 bg-white" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="text-center mt-2 p-1 border rounded" style={{ fontSize: '0.75rem', fontFamily: 'monospace', backgroundColor: '#e9ecef', color: '#000' }}>
                        <strong>Eq:</strong> Y = {activeRangeMin.toFixed(1)} + {(activeRangeMax - activeRangeMin).toFixed(1)} &times; {
                            (mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') ? (
                                (activeCy <= activeCx || mappingType === 'exponential') ? <span>X<sup>{clamp(Math.log(Math.max(0.001, Math.min(0.999, activeCy))) / Math.log(Math.max(0.001, Math.min(0.999, activeCx))), 1, 30).toFixed(2)}</sup></span>
                                : <span>log<sub>{calculateLogBase(activeCx, activeCy).toFixed(1)}</sub>(1 + {(calculateLogBase(activeCx, activeCy)-1).toFixed(1)} &times; X)</span>
                            )
                            : <span>X</span>
                        } <span className="text-muted" style={{fontSize: '0.65rem'}}>(X in 0..1)</span>
                    </div>
                    {isDebugMode && (
                        <div title="Debug Feature: Real-time calculation coordinates for the bezier curve mapping engine.">
                            <table className="table table-sm table-bordered mt-1 text-center text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                                <thead className="table-light">
                                    <tr><th>Anchor</th><th>Data (X)</th><th>Vis Parameter (Y)</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Start Point</td><td>0%</td><td>{activeRangeMin.toFixed(1)}</td></tr>
                                    {(mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') && <tr><td>Curve Midpoint</td><td>{(activeCx * 100).toFixed(1)}%</td><td>{(activeRangeMin + ((activeCy > activeCx && mappingType !== 'exponential') ? Math.log(1 + (calculateLogBase(activeCx, activeCy) - 1) * 0.5) / Math.log(calculateLogBase(activeCx, activeCy)) : Math.pow(0.5, clamp(Math.log(Math.max(0.001, Math.min(0.999, activeCy))) / Math.log(Math.max(0.001, Math.min(0.999, activeCx))), 1, 30))) * (activeRangeMax - activeRangeMin)).toFixed(1)}</td></tr>}
                                    <tr><td>End Point</td><td>100%</td><td>{activeRangeMax.toFixed(1)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}
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
