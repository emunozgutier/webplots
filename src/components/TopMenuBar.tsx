
import React, { useRef, useState, useEffect } from 'react';
import { NavDropdown, Navbar, Nav, Container, Modal, Button } from 'react-bootstrap';
import { useCsvDataStore } from '../store/useCsvDataStore';
import { useDemoData } from '../store/useDemoData';
import Papa from 'papaparse';
import type { CsvDataStore } from '../store/useCsvDataStore';
import { useWorkspaceStore, workspaceRegistry } from '../store/Workspace/useWorkspaceStore';
import { resetActiveWorkspace } from '../utils/workspaceReset';
import { getSmallDataset, getLargeColumnDataset, getSimulationDataset, getBinningTestData } from '../utils/TestDatasets';
import { generateTestGaussianData } from '../utils/TableMathLib';
import BetaMode from './TopMenuBar/BetaMode';
import { useAnalyticsStore } from '../store/useAnalytics';

interface VersionData {
    commit_title: string;
    commit_message: string;
    version_string: string;
}

const TopMenuBar: React.FC = () => {
    const { data, columns, setPlotData, setColumns, loadProject: loadPlotDataProject } = useCsvDataStore();
    const isTutorialActive = useWorkspaceStore((state) => state.isTutorialActive);
    const { isWeatherLoading, isGapminderLoading } = useDemoData();

    const csvInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);

    const [showVersionModal, setShowVersionModal] = useState(false);
    const [showBetaModal, setShowBetaModal] = useState(false);
    const [versionData, setVersionData] = useState<VersionData | null>(null);
    const status = useAnalyticsStore((state) => state.status);
    const setConsent = useAnalyticsStore((state) => state.setConsent);
    const resetConsent = useAnalyticsStore((state) => state.resetConsent);
    const isAnalyticsEnabled = status === 'granted';

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const baseUrl = import.meta.env.BASE_URL || '/';
                const response = await fetch(`${baseUrl}version.json`);
                if (response.ok) {
                    const data: VersionData = await response.json();
                    setVersionData(data);
                }
            } catch (error) {
                console.error("Error fetching version on mount:", error);
            }
        };
        fetchVersion();
    }, []);

    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const parsedData = results.data as CsvDataStore[];
                    if (parsedData.length > 0) {
                        resetActiveWorkspace();
                        setPlotData(parsedData);
                        const cols = Object.keys(parsedData[0]);
                        setColumns(cols);
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
        const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
        const activeStores = workspaceRegistry.get(activeWorkspaceId);

        if (!activeStores) {
            alert('No active workspace found to save.');
            return;
        }

        const projectState = {
            data,
            columns,
            sideMenuData: activeStores.axisSideMenuStore.getState().sideMenuData,
            plotTypeSideMenuData: activeStores.plotTypeSideMenuStore.getState().plotTypeSideMenuData,
            groupSideMenuData: activeStores.groupSideMenuStore.getState().groupSideMenuData,
            plotLayout: activeStores.plotLayoutStore.getState().plotLayout
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

                    const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
                    const activeStores = workspaceRegistry.get(activeWorkspaceId);
                    if (!activeStores) return;

                    if (projectState.data && projectState.columns) {
                        loadPlotDataProject(projectState.data, projectState.columns);
                    }

                    if (projectState.plotTypeSideMenuData?.plotType) {
                        activeStores.plotTypeSideMenuStore.getState().loadProject(projectState.plotTypeSideMenuData.plotType);
                    } else if (projectState.sideMenuData?.plotType) {
                        activeStores.plotTypeSideMenuStore.getState().loadProject(projectState.sideMenuData.plotType);
                    }

                    if (projectState.sideMenuData) {
                        activeStores.axisSideMenuStore.getState().loadProject(projectState.sideMenuData.xAxis, projectState.sideMenuData.yAxis, projectState.sideMenuData.plotType);

                        // Handle backwards compatibility where group details were in sideMenuData
                        if (projectState.groupSideMenuData) {
                            activeStores.groupSideMenuStore.getState().loadProject(projectState.groupSideMenuData.groupAxis, projectState.groupSideMenuData.groupSettings);
                        } else {
                            activeStores.groupSideMenuStore.getState().loadProject(projectState.sideMenuData.groupAxis, projectState.sideMenuData.groupSettings);
                        }
                    } else if (projectState.plotArea && projectState.plotArea.axisMenuData) {
                        // Migration for old project files
                        activeStores.axisSideMenuStore.getState().loadProject(projectState.plotArea.axisMenuData.xAxis, projectState.plotArea.axisMenuData.yAxis);
                        activeStores.groupSideMenuStore.getState().loadProject(projectState.plotArea.axisMenuData.groupAxis, projectState.plotArea.axisMenuData.groupSettings);
                    }

                    if (projectState.plotLayout) {
                        activeStores.plotLayoutStore.getState().loadProject(projectState.plotLayout);
                    } else if (projectState.plotArea) {
                        // Clean up old axisMenuData if present in the loaded object before setting
                        const { axisMenuData, ...cleanPlotArea } = projectState.plotArea;
                        // Map old PlotArea to PlotLayout (typescript should be lenient with extra/missing optional props)
                        activeStores.plotLayoutStore.getState().loadProject(cleanPlotArea as any); // Cast to avoid strict type issues with migration
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

    const handleLoadTestData = (datasetType: 'small' | 'large' | 'simulation' | 'binning' | 'gaussian') => {
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
            case 'gaussian':
                testData = generateTestGaussianData().data as CsvDataStore[];
                break;
        }

        if (testData.length > 0) {
            resetActiveWorkspace();
            setPlotData(testData);
            const cols = Object.keys(testData[0]);
            setColumns(cols);
        }
    };

    const handleLoadWeatherData = async () => {
        try {
            await useDemoData.getState().loadWeatherData();
        } catch (error) {
            console.error("Error loading weather data:", error);
            alert("Error loading weather data.");
        }
    };

    const handleLoadGapminderData = async () => {
        try {
            await useDemoData.getState().loadGapminderData();
        } catch (error) {
            console.error("Error loading gapminder data:", error);
            alert("Error loading gapminder data.");
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

    const handleNewProject = async () => {
        if (window.confirm("Are you sure you want to start a new project? This will clear all current data, plots, and workspaces. This action cannot be undone.")) {
            try {
                // Clear the IndexedDB instance used by Zustand persist (idb-keyval)
                const { clear } = await import('idb-keyval');
                await clear();
            } catch (e) {
                console.error("Failed to clear indexedDB", e);
            }

            // Clear standard local storage
            localStorage.clear();

            // Reload the page to clear any in-memory state and re-initialize from empty storage
            window.location.reload();
        }
    };

    const handleToggleAnalytics = () => {
        if (isAnalyticsEnabled) {
            setConsent('denied');
        } else {
            resetConsent();
        }
    };

    return (
        <Navbar bg="dark" variant="dark" expand="md" className="px-4 shadow-sm">
            <Container fluid className="p-0">
                <Navbar.Brand href="#home" className="d-flex align-items-center p-0">
                    <img
                        src={`${import.meta.env.BASE_URL || '/'}logo_full.png`}
                        alt="WebPlots Logo"
                        height="40"
                        className="d-inline-block align-top"
                    />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <NavDropdown title="File" id="file-nav-dropdown">
                            <NavDropdown.Item onClick={handleNewProject} className="text-danger">
                                New Project
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
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
                            <NavDropdown.Item onClick={() => handleLoadTestData('simulation')}>
                                Simulation Dataset (Trig)
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => handleLoadTestData('gaussian')}>
                                Gaussian Mixture Dataset
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLoadWeatherData} disabled={isWeatherLoading}>
                                {isWeatherLoading ? "Loading Weather Data..." : "Sample Weather Data"}
                            </NavDropdown.Item>
                            <NavDropdown.Item id="test-nav-gapminder" onClick={handleLoadGapminderData} disabled={isGapminderLoading}>
                                {isGapminderLoading ? "Loading GDP Data..." : "World Life Expect vs GDP"}
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={() => {
                                // Generate 1e6 points
                                const numPoints = 1_000_000;
                                const data: CsvDataStore[] = new Array(numPoints);
                                for (let i = 0; i < numPoints; i++) {
                                    const t = (i / numPoints) * 10 * 2 * Math.PI; // Ten full cycles
                                    data[i] = {
                                        "Time": t,
                                        "Sine": Math.sin(t)
                                    };
                                }
                                resetActiveWorkspace();
                                setPlotData(data);
                                setColumns(["Time", "Sine"]);
                                const activeStores = workspaceRegistry.get(useWorkspaceStore.getState().activeWorkspaceId);
                                if (activeStores) activeStores.axisSideMenuStore.getState().setXAxis("Time");
                            }}>
                                1e6 Points Sine Wave
                            </NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown title="Help" id="help-nav-dropdown">
                            {!isTutorialActive && (
                                <>
                                    <NavDropdown.Item onClick={() => useWorkspaceStore.getState().setIsTutorialActive(true)}>
                                        Talk to Inky
                                    </NavDropdown.Item>
                                    <NavDropdown.Divider />
                                </>
                            )}
                            <NavDropdown.Item onClick={() => alert('WebPlots v1.0\n\n- Load CSV to visualize data.\n- Save/Load Project to persist your work.')}>
                                About
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={handleShowVersion}>
                                Version
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleToggleAnalytics}>
                                {isAnalyticsEnabled ? 'Disable Analytics' : 'Enable Analytics'}
                            </NavDropdown.Item>
                            <NavDropdown.Item onClick={() => setShowBetaModal(true)}>
                                Beta Mode
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <div className="d-flex align-items-center gap-3">
                        {versionData && (
                            <span
                                className="text-secondary small fw-bold"
                                style={{ cursor: 'pointer', opacity: 0.8 }}
                                onClick={() => setShowVersionModal(true)}
                                title="Click for details"
                            >
                                v{versionData.version_string.replace('v', '')}
                            </span>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            href="https://github.com/emunozgutier/webplots"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="fw-bold"
                            title="See me on GitHub"
                        >
                            <i className="bi bi-github me-1"></i> See me on GitHub
                        </Button>
                    </div>
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

            {/* Beta Mode Modal */}
            <BetaMode show={showBetaModal} onHide={() => setShowBetaModal(false)} />
        </Navbar>
    );
};

export default TopMenuBar;
