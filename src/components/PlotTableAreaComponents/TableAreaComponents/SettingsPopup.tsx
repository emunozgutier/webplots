import React from 'react';
import { Card, Button, Tabs, Tab } from 'react-bootstrap';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import General from './SettingsComponents/General';
import NumberFormat from './SettingsComponents/NumberFormat';
import Gaussian from './SettingsComponents/Gaussian';

const SettingsPopup: React.FC = () => {
    const { closePopup } = useWorkspaceLocalStore();

    return (
        <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-2 border-0">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <i className="bi bi-gear-fill me-2 fs-5"></i>
                    Table Settings
                </h5>
                <Button variant="link" className="text-white p-0" onClick={closePopup}>
                    <i className="bi bi-x-lg fs-5"></i>
                </Button>
            </Card.Header>
            <Card.Body className="p-0 d-flex flex-column" style={{ minHeight: '400px' }}>
                <Tabs
                    defaultActiveKey="general"
                    id="settings-tabs"
                    className="px-3 pt-2 bg-light border-bottom"
                >
                    <Tab eventKey="general" title="General" className="p-4">
                        <General />
                    </Tab>
                    <Tab eventKey="format" title="Formatting" className="p-4">
                        <NumberFormat />
                    </Tab>
                    <Tab eventKey="gaussian" title="Gaussian" className="p-4">
                        <Gaussian />
                    </Tab>
                </Tabs>

                <div className="mt-auto p-3 d-flex justify-content-center border-top bg-light">
                    <Button 
                        variant="primary" 
                        onClick={closePopup} 
                        className="px-5 py-2 rounded-pill fw-bold shadow-sm"
                        style={{ background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)', border: 'none' }}
                    >
                        Apply & Close
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SettingsPopup;
