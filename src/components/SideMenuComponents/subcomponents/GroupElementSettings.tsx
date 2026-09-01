import React, { useState, useEffect } from 'react';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import type { GroupSettings } from '../../../store/SideMenu/useGroupSideMenuStore';
import { useAppLocalStore } from '../../../store/useAppLocalStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import Plot from 'react-plotly.js';
import { v4 as uuidv4 } from 'uuid';
import { roundToSignificantDigits, toEngineeringString } from '../../../utils/TableMathLib';
import { useTraceConfigStore } from '../../../store/PlotTable/useTraceConfigStore';
import { COLOR_PALETTES } from '../../../utils/ColorPalettes';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { HexColorPicker } from 'react-colorful';
import { OverlayTrigger, Popover, Dropdown } from 'react-bootstrap';
import { useStyleSideMenuStore } from '../../../store/SideMenu/useStyleSideMenuStore';

const SYMBOLS = [
    { id: 'circle', label: 'Circle', icon: 'bi-circle-fill' },
    { id: 'square', label: 'Square', icon: 'bi-square-fill' },
    { id: 'diamond', label: 'Diamond', icon: 'bi-diamond-fill' },
    { id: 'cross', label: 'Cross', icon: 'bi-plus-lg' },
    { id: 'x', label: 'X', icon: 'bi-x-lg' },
    { id: 'triangle-up', label: 'Triangle', icon: 'bi-triangle-fill' },
    { id: 'star', label: 'Star', icon: 'bi-star-fill' }
];

interface GroupElementSettingsProps {
    column: string;
}

const GroupElementSettings: React.FC<GroupElementSettingsProps> = ({ column }) => {
    const { groupSideMenuData, setGroupSettings } = useGroupSideMenuStore();
    const { closePopup } = useAppLocalStore();
    const { data } = useCsvDataStore();
    const { traceConfig, setColorPalette, setPaletteColorOrder, updatePaletteColor } = useTraceConfigStore();
    const { colorData, setColorData } = useStyleSideMenuStore();

    const currentColors = traceConfig.currentPaletteColors || [];
    const activeTraceCount = traceConfig.activeTraces?.length || 0;

    const [localSettings, setLocalSettings] = useState<GroupSettings>({
        mode: 'auto',
        bins: []
    });

    // Extract numeric column data for preview and categoric data for counts
    const { numericData, dataMin, dataMax, isNumeric, categoryCounts, sortedCats } = React.useMemo(() => {
        if (!data || data.length === 0) return { numericData: [], dataMin: 0, dataMax: 100, isNumeric: false, categoryCounts: {}, sortedCats: [] };
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
        const sortedCats = Object.keys(counts).sort();
        return { numericData: nums, dataMin: min, dataMax: max, isNumeric: isNum, categoryCounts: counts, sortedCats };
    }, [data, column]);

    useEffect(() => {
        let initialMode: 'color' | 'symbol' | 'none' = 'color';
        if (colorData.shape.source === 'group') {
            initialMode = 'symbol';
        } else if (colorData.hue.source === 'manual' && colorData.shape.source === 'manual') {
            initialMode = 'none';
        }

        let saved = groupSideMenuData.groupSettings[column] 
            ? JSON.parse(JSON.stringify(groupSideMenuData.groupSettings[column])) 
            : null;

        if (saved) {
            saved.styleMode = initialMode;
            
            // Re-hydrate styles from colorData overrides
            if (isNumeric) {
                saved.bins.forEach((bin: any) => {
                    bin.color = colorData.groupColorOverrides?.[bin.label] || '';
                    bin.symbol = colorData.groupSymbolOverrides?.[bin.label] || '';
                });
            } else {
                saved.categoryStyles = {};
                sortedCats.forEach(cat => {
                    const color = colorData.groupColorOverrides?.[cat] || '';
                    const symbol = colorData.groupSymbolOverrides?.[cat] || '';
                    if (color || symbol) {
                        saved.categoryStyles[cat] = { color, symbol };
                    }
                });
            }

            if (isNumeric && saved.bins.length === 0 && saved.mode !== 'auto') {
                setLocalSettings({ mode: 'manual', bins: generateDefaultBins(dataMin, dataMax), styleMode: initialMode });
            } else {
                setLocalSettings(saved);
            }
        } else {
            const defaultSettings: GroupSettings = isNumeric 
                ? { mode: 'manual', bins: generateDefaultBins(dataMin, dataMax), styleMode: initialMode }
                : { mode: 'auto', bins: [], styleMode: initialMode };
            
            setLocalSettings(defaultSettings);
        }
    }, [column, groupSideMenuData.groupSettings, dataMin, dataMax, isNumeric, sortedCats, colorData.hue.source, colorData.shape.source, colorData.groupColorOverrides, colorData.groupSymbolOverrides]);

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
        const colorOverrides = { ...colorData.groupColorOverrides };
        const symbolOverrides = { ...colorData.groupSymbolOverrides };

        if (!isNumeric) {
            Object.entries(localSettings.categoryStyles || {}).forEach(([cat, style]) => {
                const key = cat;
                if ((style as any).color) colorOverrides[key] = (style as any).color;
                else delete colorOverrides[key];
                if ((style as any).symbol) symbolOverrides[key] = (style as any).symbol;
                else delete symbolOverrides[key];
            });
        } else {
            localSettings.bins.forEach((bin: any) => {
                const key = bin.label;
                if (bin.color) colorOverrides[key] = bin.color;
                else delete colorOverrides[key];
                if (bin.symbol) symbolOverrides[key] = bin.symbol;
                else delete symbolOverrides[key];
            });
        }

        const styleMode = localSettings.styleMode || 'color';
        let hueSource = colorData.hue.source;
        let shapeSource = colorData.shape.source;

        if (styleMode === 'color') {
            hueSource = 'group';
            shapeSource = 'manual';
        } else if (styleMode === 'symbol') {
            hueSource = 'manual';
            shapeSource = 'group';
        } else {
            hueSource = 'manual';
            shapeSource = 'manual';
        }

        setColorData({
            groupColorOverrides: colorOverrides,
            groupSymbolOverrides: symbolOverrides,
            hue: { ...colorData.hue, source: hueSource, enabled: hueSource === 'group' ? true : colorData.hue.enabled },
            shape: { ...colorData.shape, source: shapeSource, enabled: shapeSource === 'group' ? true : colorData.shape.enabled }
        });

        // Strip color and symbol array before saving to GroupSideMenu since they are now in StyleSideMenu
        const cleanSettings = JSON.parse(JSON.stringify(localSettings));
        if (cleanSettings.bins) {
            cleanSettings.bins.forEach((b: any) => { delete b.color; delete b.symbol; });
        }
        if (cleanSettings.categoryStyles) {
            Object.keys(cleanSettings.categoryStyles).forEach(k => {
                delete cleanSettings.categoryStyles[k].color;
                delete cleanSettings.categoryStyles[k].symbol;
            });
        }

        setGroupSettings(column, cleanSettings);
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

    const updateCategoryStyle = (cat: string, field: 'color' | 'symbol', value: string) => {
        setLocalSettings((prev: any) => {
            const currentStyles = prev.categoryStyles || {};
            const catStyle = currentStyles[cat] || {};
            if (!value) {
                const newCatStyle = { ...catStyle };
                delete newCatStyle[field];
                return { ...prev, categoryStyles: { ...currentStyles, [cat]: newCatStyle } };
            }
            return {
                ...prev,
                categoryStyles: {
                    ...currentStyles,
                    [cat]: { ...catStyle, [field]: value }
                }
            };
        });
    };

    const renderStyleControls = (colorVal: string | undefined, symbolVal: string | undefined, onColorChange: (val: string) => void, onSymbolChange: (val: string) => void, isCategorical: boolean = false, defaultColor?: string) => {
        const mode = localSettings.styleMode || 'color';
        if (mode === 'none') return null;

        const effectiveColor = colorVal || (isCategorical ? defaultColor : '#888888');
        const showClear = !!colorVal || !!symbolVal;

        return (
            <div className={`d-flex align-items-center bg-light rounded px-1 border`} style={{ height: '30px' }}>
                {mode === 'color' && (
                    <>
                        <div className="d-flex align-items-center position-relative">
                            <input 
                                type="color" 
                                className="form-control form-control-color form-control-sm p-0 border-0" 
                                style={{ width: '22px', height: '22px', cursor: 'pointer', opacity: (colorVal || isCategorical) ? 1 : 0.4 }} 
                                value={effectiveColor} 
                                onChange={(e) => onColorChange(e.target.value)} 
                                title={colorVal ? "Custom Color" : (isCategorical ? "Assigned Color" : "Auto Color (Click to override)")}
                            />
                            {!colorVal && !isCategorical && <div className="position-absolute top-50 start-50 translate-middle pe-none" style={{ fontSize: '12px', color: '#444'}}>?</div>}
                        </div>
                        {showClear && (
                            <button type="button" className="btn btn-link p-0 text-muted ms-1 text-decoration-none lh-1 me-1" style={{ fontSize: '1rem' }} onClick={() => onColorChange('')} title="Clear Color">&times;</button>
                        )}
                    </>
                )}
                {mode === 'symbol' && (
                    <>
                        <Dropdown>
                            <Dropdown.Toggle as="button" className="btn btn-sm btn-link p-0 text-decoration-none shadow-none text-secondary d-flex align-items-center" style={{ minWidth: '100px', fontSize: '0.75rem' }}>
                                {symbolVal ? (
                                    <>
                                        <i className={`bi ${SYMBOLS.find(s => s.id === symbolVal)?.icon || 'bi-circle'} me-2`}></i>
                                        {SYMBOLS.find(s => s.id === symbolVal)?.label || symbolVal}
                                    </>
                                ) : (
                                    <span className="text-muted">Auto Shape</span>
                                )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="p-2 shadow border-0" style={{ minWidth: '180px' }}>
                                <div className="d-flex flex-wrap gap-2">
                                    {SYMBOLS.map((s) => (
                                        <button
                                            key={s.id}
                                            className={`btn btn-sm ${symbolVal === s.id ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center`}
                                            style={{ width: '32px', height: '32px' }}
                                            onClick={() => { onSymbolChange(s.id); document.body.click(); }}
                                            title={s.label}
                                        >
                                            <i className={`bi ${s.icon}`}></i>
                                        </button>
                                    ))}
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>
                        {symbolVal && (
                            <button type="button" className="btn btn-link p-0 text-muted ms-1 text-decoration-none lh-1 me-1" style={{ fontSize: '1rem' }} onClick={() => onSymbolChange('')} title="Clear Shape">&times;</button>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderColorPicker = (color: string, index: number) => (
        <Popover id={`popover-color-group-${index}`}>
            <Popover.Body>
                <HexColorPicker color={color} onChange={(newColor) => updatePaletteColor(index, newColor)} />
            </Popover.Body>
        </Popover>
    );

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(currentColors);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPaletteColorOrder(items);
    };

    return (
        <div className="card shadow w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Group Settings: {column}</h5>
                <button className="btn-close" onClick={closePopup}></button>
            </div>

            <div className="card-body overflow-auto">
                <div className="mb-3 d-flex align-items-center justify-content-between p-2 bg-light rounded border">
                    <label className="form-label mb-0 fw-bold small">Customize Individual Groups By:</label>
                    <select 
                        className="form-select form-select-sm" 
                        style={{ width: '150px' }}
                        value={localSettings.styleMode || 'color'}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, styleMode: e.target.value as any }))}
                    >
                        <option value="color">Colors Only</option>
                        <option value="symbol">Markers Only</option>
                        <option value="none">None (Hide Options)</option>
                    </select>
                </div>

                {localSettings.styleMode !== 'none' && (!localSettings.styleMode || localSettings.styleMode === 'color') && (
                    <div className="mb-4 bg-light p-3 rounded border">
                        <label className="form-label small fw-bold">Dynamic Color Palette</label>
                        <div className="text-muted small mb-2">Configure the automatic palette for your groups. You can still set specific overrides below.</div>
                        <div className="d-flex mb-2">
                            <Dropdown onSelect={(eventKey) => eventKey && setColorPalette(eventKey)} className="me-2 flex-grow-1">
                                <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 d-flex justify-content-between align-items-center bg-white">
                                    {traceConfig.colorPalette || 'Default'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="w-100 shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {Object.keys(COLOR_PALETTES).map(paletteName => (
                                        <Dropdown.Item key={paletteName} eventKey={paletteName} active={traceConfig.colorPalette === paletteName}>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <span>{paletteName}</span>
                                                <div className="d-flex ms-2">
                                                    {COLOR_PALETTES[paletteName].slice(0, 5).map((c, i) => (
                                                        <div key={i} style={{ width: '12px', height: '12px', backgroundColor: c, marginRight: '1px' }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="palette-colors-group" direction="horizontal">
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`d-flex align-items-center p-2 rounded border ${snapshot.isDraggingOver ? 'bg-white shadow-sm' : 'bg-white'}`}
                                        style={{ minHeight: '60px', position: 'relative', overflowX: 'auto' }}
                                    >
                                        <div
                                            className="position-absolute border border-primary border-2 rounded"
                                            style={{
                                                left: '4px', top: '4px', bottom: '4px',
                                                width: `${Math.min(activeTraceCount, currentColors.length) * 48}px`,
                                                pointerEvents: 'none', zIndex: 0, backgroundColor: 'rgba(13, 110, 253, 0.05)'
                                            }}
                                        ></div>
                                        {currentColors.map((color, index) => (
                                            <Draggable key={`${index}-${color}`} draggableId={`group-${index}-${color}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="m-1 position-relative flex-shrink-0"
                                                        style={{ ...provided.draggableProps.style, zIndex: snapshot.isDragging ? 1000 : 1 }}
                                                    >
                                                        <OverlayTrigger trigger="click" placement="bottom" overlay={renderColorPicker(color, index)} rootClose>
                                                            <div
                                                                className="rounded-circle shadow-sm border"
                                                                style={{ width: '40px', height: '40px', backgroundColor: color, cursor: 'grab' }}
                                                                title={`Color ${index + 1}`}
                                                            />
                                                        </OverlayTrigger>
                                                        {index < activeTraceCount && (
                                                            <div className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.6rem' }}>
                                                                {index + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                )}

                {!isNumeric ? (
                    <div className="mb-3 border rounded p-3 bg-white">
                        <h6 className="fw-bold mb-3">Categorical Values</h6>
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {Object.entries(categoryCounts)
                                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                                .map(([cat, count]) => {
                                    const alphabetIndex = sortedCats.indexOf(cat);
                                    const defaultColor = currentColors[alphabetIndex % currentColors.length] || '#000000';
                                    return (
                                        <div key={cat} className="d-flex justify-content-between align-items-center border-bottom pb-1 pt-1">
                                            <div className="d-flex align-items-center text-truncate" style={{ maxWidth: '45%' }}>
                                                <span className="badge bg-secondary rounded-pill me-2">{count}</span>
                                                <span className="text-truncate" title={cat}>
                                                    {cat === '' || cat === 'undefined' || cat === 'null' ? <em className="text-muted">(Empty/Null)</em> : cat}
                                                </span>
                                            </div>
                                            {renderStyleControls(
                                                localSettings.categoryStyles?.[cat]?.color,
                                                localSettings.categoryStyles?.[cat]?.symbol,
                                                (val) => updateCategoryStyle(cat, 'color', val),
                                                (val) => updateCategoryStyle(cat, 'symbol', val),
                                                true,
                                                defaultColor
                                            )}
                                        </div>
                                    );
                                })}
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
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex gap-2 align-items-center flex-grow-1 me-2">
                                                <span className="badge bg-secondary">{index + 1}</span>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Label (e.g. High)"
                                                    value={bin.label}
                                                    onChange={(e) => updateBin(bin.id, 'label', e.target.value)}
                                                />
                                            </div>
                                            {renderStyleControls(
                                                bin.color,
                                                bin.symbol,
                                                (val) => updateBin(bin.id, 'color', val),
                                                (val) => updateBin(bin.id, 'symbol', val)
                                            )}
                                            <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => removeBin(bin.id)}>&times;</button>
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

export default GroupElementSettings;
