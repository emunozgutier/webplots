import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useWorkspaceStore } from '../../store/Workspace/useWorkspaceStore';

interface BetaModeProps {
    show: boolean;
    onHide: () => void;
}

const BetaMode: React.FC<BetaModeProps> = ({ show, onHide }) => {
    const { isDebugMode, toggleDebugMode } = useWorkspaceStore();

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center">
                    <i className="bi bi-tools me-2 text-warning"></i> Beta Mode Features
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted small">
                    Enable Beta Mode to preview and test experimental styling algorithms before they are fully released. 
                    These features are intended for advanced users and may be unstable.
                </p>
                <div className="border rounded p-3 mb-3 bg-light">
                    <Form.Check 
                        type="switch"
                        id="beta-mode-switch"
                        label={<span className="fw-bold">Enable Beta Features</span>}
                        checked={isDebugMode}
                        onChange={toggleDebugMode}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                
                <h6 className="fw-bold fs-6">Currently in Beta:</h6>
                <ul className="small text-muted mb-0">
                    <li className="mb-2">
                        <strong>Saturation Control:</strong> A highly complex property for adjusting raw HSL saturation limits. Modifying saturation curves manually requires a proper understanding of data-to-color-space mapping.
                    </li>
                    <li>
                        <strong>Trajectory Calculator Coordinates:</strong> Real-time debugging table detailing the Bezier mapping anchors and their actual X/Y boundary evaluations within the Style Element popup.
                    </li>
                </ul>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default BetaMode;
