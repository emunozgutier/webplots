import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

interface TableAreaBatchButtonsProps {
    currentBatch: number;
    totalBatches: number;
    onBatchChange: (batch: number) => void;
}

const TableAreaBatchButtons: React.FC<TableAreaBatchButtonsProps> = ({
    currentBatch,
    totalBatches,
    onBatchChange,
}) => {
    const isFirst = currentBatch === 0;
    const isLast = currentBatch === totalBatches - 1;

    return (
        <div className="d-flex flex-column h-100 bg-light border-start" style={{ width: '60px' }}>
            <div className="d-flex flex-column align-items-center py-3 gap-3">
                <ButtonGroup vertical className="gap-1 shadow-sm">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={isFirst}
                        onClick={() => onBatchChange(0)}
                        title="First Batch"
                    >
                        <i className="bi bi-chevron-double-up"></i>
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={isFirst}
                        onClick={() => onBatchChange(currentBatch - 1)}
                        title="Previous Batch"
                    >
                        <i className="bi bi-chevron-up"></i>
                    </Button>
                </ButtonGroup>

                <div className="d-flex flex-column align-items-center">
                    <span className="small text-muted fw-bold">Batch</span>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="fw-bold my-1"
                        style={{ cursor: 'default' }}
                    >
                        {currentBatch + 1}
                    </Button>
                    <span className="small text-muted fw-bold">of</span>
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="fw-bold mt-1"
                        onClick={() => onBatchChange(totalBatches - 1)}
                        title="Jump to Last Batch"
                    >
                        {totalBatches}
                    </Button>
                </div>

                <ButtonGroup vertical className="gap-1 shadow-sm">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={isLast}
                        onClick={() => onBatchChange(currentBatch + 1)}
                        title="Next Batch"
                    >
                        <i className="bi bi-chevron-down"></i>
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={isLast}
                        onClick={() => onBatchChange(totalBatches - 1)}
                        title="Last Batch"
                    >
                        <i className="bi bi-chevron-double-down"></i>
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    );
};

export default TableAreaBatchButtons;
