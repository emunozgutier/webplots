
import React, { useRef, useState } from 'react';
import { NavDropdown, Navbar, Nav, Container, Modal, Button } from 'react-bootstrap';
import { useCsvDataStore } from '../store/CsvDataStore';
import { usePlotLayoutStore } from '../store/PlotLayoutStore';
import Papa from 'papaparse';
import type { CsvDataStore } from '../store/CsvDataStore';
import { useAxisSideMenuStore } from '../store/AxisSideMenuStore';
import { useGroupSideMenuStore } from '../store/GroupSideMenuStore';
import { getSmallDataset, getLargeColumnDataset, getSimulationDataset, getBinningTestData } from '../utils/TestDatasets';

interface VersionData {
    commit_title: string;
    commit_message: string;
    version_string: string;
}

const TopMenuBar: React.FC = () => {
    const { data, columns, setPlotData, setColumns, loadProject: loadPlotDataProject } = useCsvDataStore();

    const { sideMenuData, setXAxis, loadProject: loadSideMenuProject } = useAxisSideMenuStore();
    const { groupSideMenuData, loadProject: loadGroupSideMenuProject } = useGroupSideMenuStore();
    const { plotLayout, loadProject: loadPlotLayoutProject } = usePlotLayoutStore();

    const csvInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);

    const [showVersionModal, setShowVersionModal] = useState(false);
    const [versionData, setVersionData] = useState<VersionData | null>(null);

    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const parsedData = results.data as CsvDataStore[];
                    if (parsedData.length > 0) {
                        setPlotData(parsedData);
                        const cols = Object.keys(parsedData[0]);
                        setColumns(cols);
                        if (cols.length > 0) setXAxis(cols[0]);

                    }
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }
        // Reset input
        if (event.target) event.target.value = '';
    };

    const handleSaveProject = () => {
        const projectState = {
            data,
            columns,
            sideMenuData,
            groupSideMenuData,
            plotLayout
        };
        const blob = new Blob([JSON.stringify(projectState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `webplots_project_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const projectState = JSON.parse(content);

                    if (projectState.data && projectState.columns) {
                        loadPlotDataProject(projectState.data, projectState.columns);
                    }

                    if (projectState.sideMenuData) {
                        loadSideMenuProject(projectState.sideMenuData.xAxis, projectState.sideMenuData.yAxis, projectState.sideMenuData.plotType);

                        // Handle backwards compatibility where group details were in sideMenuData
                        if (projectState.groupSideMenuData) {
                            loadGroupSideMenuProject(projectState.groupSideMenuData.groupAxis, projectState.groupSideMenuData.groupSettings);
                        } else {
                            loadGroupSideMenuProject(projectState.sideMenuData.groupAxis, projectState.sideMenuData.groupSettings);
                        }
                    } else if (projectState.plotArea && projectState.plotArea.axisMenuData) {
                        // Migration for old project files
                        loadSideMenuProject(projectState.plotArea.axisMenuData.xAxis, projectState.plotArea.axisMenuData.yAxis);
                        loadGroupSideMenuProject(projectState.plotArea.axisMenuData.groupAxis, projectState.plotArea.axisMenuData.groupSettings);
                    }

                    if (projectState.plotLayout) {
                        loadPlotLayoutProject(projectState.plotLayout);
                    } else if (projectState.plotArea) {
                        // Clean up old axisMenuData if present in the loaded object before setting
                        const { axisMenuData, ...cleanPlotArea } = projectState.plotArea;
                        // Map old PlotArea to PlotLayout (typescript should be lenient with extra/missing optional props)
                        loadPlotLayoutProject(cleanPlotArea as any); // Cast to avoid strict type issues with migration
                    }
                } catch (error) {
                    console.error('Error loading project:', error);
                    alert('Invalid project file.');
                }
            };
            reader.readAsText(file);
        }
        // Reset input
        if (event.target) event.target.value = '';
    };

    const handleLoadTestData = (datasetType: 'small' | 'large' | 'simulation' | 'binning') => {
        let testData: CsvDataStore[] = [];
        switch (datasetType) {
            case 'small':
                testData = getSmallDataset();
                break;
            case 'large':
                testData = getLargeColumnDataset();
                break;
            case 'simulation':
                testData = getSimulationDataset();
                break;
            case 'binning':
                testData = getBinningTestData();
                break;
        }

        if (testData.length > 0) {
            setPlotData(testData);
            const cols = Object.keys(testData[0]);
            setColumns(cols);
            if (cols.length > 0) setXAxis(cols[0]);
        }
    };

    const handleShowVersion = async () => {
        try {
            // Check if we are in production or dev environment using base url
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}version.json`);
            if (response.ok) {
                const data: VersionData = await response.json();
                setVersionData(data);
            } else {
                console.error("Failed to fetch version data.");
                setVersionData(null);
            }
        } catch (error) {
            console.error("Error fetching version json:", error);
            setVersionData(null);
        }
        setShowVersionModal(true);
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="px-4 shadow-sm">
            <Container fluid className="p-0">
                <Navbar.Brand href="#home">WebPlots</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <NavDropdown title="File" id="file-nav-dropdown">
                            <NavDropdown.Item onClick={() => csvInputRef.current?.click()}>
                                Load CSV File
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={() => projectInputRef.current?.click()}>
                                Load Project
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={handleSaveProject}>
                                Save Project
                            </NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown title="Test" id="test-nav-dropdown">
                            <NavDropdown.Item onClick={() => handleLoadTestData('small')}>
                                Small Dataset (3 cols)
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleLoadTestData('large')}>
                                Large Dataset (50 cols)
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleLoadTestData('simulation')}>
                                Simulation Dataset (Trig)
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleLoadTestData('binning')}>
                                Binning Test (Many Unique)
                            </NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown title="Help" id="help-nav-dropdown">
                            <NavDropdown.Item onClick={() => alert('WebPlots v1.0\n\n- Load CSV to visualize data.\n- Save/Load Project to persist your work.')}>
                                About
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={handleShowVersion}>
                                Version
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>

            {/* Hidden Inputs */}
            <input
                type="file"
                ref={csvInputRef}
                style={{ display: 'none' }}
                accept=".csv"
                onChange={handleCsvUpload}
            />
            <input
                type="file"
                ref={projectInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleLoadProject}
            />

            {/* Version Modal */}
            <Modal show={showVersionModal} onHide={() => setShowVersionModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Version Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {versionData ? (
                        <div>
                            <p><strong>Version:</strong> {versionData.version_string}</p>
                            <p><strong>Commit Title:</strong> {versionData.commit_title}</p>
                            <p><strong>Commit Message:</strong></p>
                            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
                                {versionData.commit_message}
                            </pre>
                        </div>
                    ) : (
                        <p>Loading version data or not available...</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowVersionModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Navbar>
    );
};

export default TopMenuBar;
