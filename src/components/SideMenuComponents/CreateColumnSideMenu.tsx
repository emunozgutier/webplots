import React, { useState } from 'react';
import { useCsvDataStore } from '../../store/CsvDataStore';

const CreateColumnSideMenu: React.FC = () => {
    const { data, columns, setPlotData, setColumns } = useCsvDataStore();
    const [col1, setCol1] = useState<string>('');
    const [col2, setCol2] = useState<string>('');
    const [operandType, setOperandType] = useState<'column' | 'fixed'>('column');
    const [fixedValue, setFixedValue] = useState<string>('');
    const [operation, setOperation] = useState<string>('+');
    const [newColName, setNewColName] = useState<string>('');
    const [targetSubstring, setTargetSubstring] = useState<string>('');
    const [replacementSubstring, setReplacementSubstring] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleApply = () => {
        if (!col1 || !operation || !newColName) {
            setError('Please fill all required fields.');
            return;
        }
        if (operation !== 'replace') {
            if (operandType === 'column' && !col2) {
                setError('Please select Column 2.');
                return;
            }
            if (operandType === 'fixed' && !fixedValue) {
                setError('Please provide a fixed value.');
                return;
            }
        }
        if (operation === 'replace' && !targetSubstring) {
            setError('Target substring cannot be empty.');
            return;
        }
        if (columns.includes(newColName)) {
            setError('Column name already exists.');
            return;
        }

        const newData = data.map(row => {
            const val1 = row[col1];
            let result: string | number | null = null;

            if (operation === 'replace') {
                const strVal = val1 != null ? String(val1) : '';
                result = strVal.split(targetSubstring).join(replacementSubstring);
            } else if (operation === 'concat') {
                const val2 = operandType === 'column' ? row[col2] : fixedValue;
                result = `${val1 ?? ''}${val2 ?? ''}`;
            } else {
                const val2 = operandType === 'column' ? row[col2] : fixedValue;
                const num1 = Number(val1);
                const num2 = Number(val2);

                if (isNaN(num1) || isNaN(num2)) {
                    result = null;
                } else {
                    switch (operation) {
                        case '+': result = num1 + num2; break;
                        case '-': result = num1 - num2; break;
                        case '*': result = num1 * num2; break;
                        case '/': result = num2 !== 0 ? num1 / num2 : null; break;
                        case '^': result = Math.pow(num1, num2); break;
                    }
                }
            }

            return { ...row, [newColName]: result };
        });

        setColumns([...columns, newColName]);
        setPlotData(newData);
        setError('');
        setNewColName('');
    };

    return (
        <div className="p-3 h-100 overflow-y-auto">
            <h6 className="fw-bold mb-3 border-bottom pb-2">Create New Column</h6>

            <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Column 1</label>
                <select className="form-select form-select-sm" value={col1} onChange={e => setCol1(e.target.value)}>
                    <option value="">Select column...</option>
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Operation</label>
                <select className="form-select form-select-sm" value={operation} onChange={e => setOperation(e.target.value)}>
                    <option value="+">+ (Add)</option>
                    <option value="-">- (Subtract)</option>
                    <option value="*">* (Multiply)</option>
                    <option value="/">/ (Divide)</option>
                    <option value="^">^ (Power)</option>
                    <option value="concat">concat (Merge strings)</option>
                    <option value="replace">replace (Replace substring)</option>
                </select>
            </div>

            {operation !== 'replace' ? (
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-secondary mb-0">Operand 2</label>
                        <div className="d-flex gap-2">
                            <div className="form-check form-check-inline mb-0 me-0">
                                <input className="form-check-input" type="radio" name="operandType" id="opCol" value="column" checked={operandType === 'column'} onChange={() => setOperandType('column')} />
                                <label className="form-check-label small" htmlFor="opCol" style={{ cursor: 'pointer' }}>Column</label>
                            </div>
                            <div className="form-check form-check-inline mb-0 me-0">
                                <input className="form-check-input" type="radio" name="operandType" id="opFixed" value="fixed" checked={operandType === 'fixed'} onChange={() => setOperandType('fixed')} />
                                <label className="form-check-label small" htmlFor="opFixed" style={{ cursor: 'pointer' }}>Fixed Value</label>
                            </div>
                        </div>
                    </div>
                    {operandType === 'column' ? (
                        <select className="form-select form-select-sm" value={col2} onChange={e => setCol2(e.target.value)}>
                            <option value="">Select column...</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    ) : (
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={fixedValue}
                            onChange={e => setFixedValue(e.target.value)}
                            placeholder="Enter fixed value..."
                        />
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Target Substring</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={targetSubstring}
                            onChange={e => setTargetSubstring(e.target.value)}
                            placeholder="Find..."
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Replacement</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={replacementSubstring}
                            onChange={e => setReplacementSubstring(e.target.value)}
                            placeholder="Replace with..."
                        />
                    </div>
                </>
            )}

            <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">New Column Name</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    placeholder="e.g. Total, Ratio..."
                />
            </div>

            {error && <div className="alert alert-danger px-2 py-1 small mb-3">{error}</div>}

            <button className="btn btn-primary btn-sm w-100 mt-2" onClick={handleApply}>
                <i className="bi bi-plus-circle me-1"></i> Create Column
            </button>
        </div>
    );
};

export default CreateColumnSideMenu;
