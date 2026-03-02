
import React, { useRef, useState } from 'react';
import { NavDropdown, Navbar, Nav, Container, Modal, Button } from 'react-bootstrap';
import { useCsvDataStore } from '../store/CsvDataStore';
import Papa from 'papaparse';
import type { CsvDataStore } from '../store/CsvDataStore';
import { useWorkspaceStore, workspaceRegistry } from '../store/WorkspaceStore';
import { getSmallDataset, getLargeColumnDataset, getSimulationDataset, getBinningTestData } from '../utils/TestDatasets';

interface VersionData {
    commit_title: string;
    commit_message: string;
    version_string: string;
}

const TopMenuBar: React.FC = () => {
    const { data, columns, setPlotData, setColumns, loadProject: loadPlotDataProject } = useCsvDataStore();
    const { isBetaMode, toggleBetaMode } = useWorkspaceStore();

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
                        if (cols.length > 0) {
                            const activeStores = workspaceRegistry.get(useWorkspaceStore.getState().activeWorkspaceId);
                            if (activeStores) activeStores.axisSideMenuStore.getState().setXAxis(cols[0]);
                        }

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
            if (cols.length > 0) {
                const activeStores = workspaceRegistry.get(useWorkspaceStore.getState().activeWorkspaceId);
                if (activeStores) activeStores.axisSideMenuStore.getState().setXAxis(cols[0]);
            }
        }
    };

    const handleLoadWeatherData = async () => {
        try {
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}weather_data.json`);
            if (response.ok) {
                const rawData = await response.json();
                const flattenedData: any[] = [];

                // Flatten the nested JSON structure into an array of objects
                for (const city of Object.keys(rawData)) {
                    const cityData = rawData[city];
                    const daily = cityData.daily;

                    if (daily && daily.time) {
                        for (let i = 0; i < daily.time.length; i++) {
                            const dateStr = daily.time[i];
                            const dateObj = new Date(dateStr);

                            // Calculate day out of the year
                            const start = new Date(dateObj.getFullYear(), 0, 0);
                            const diff = (dateObj.getTime() - start.getTime()) + ((start.getTimezoneOffset() - dateObj.getTimezoneOffset()) * 60 * 1000);
                            const oneDay = 1000 * 60 * 60 * 24;
                            const dayOfYear = Math.floor(diff / oneDay);

                            flattenedData.push({
                                city: city,
                                date: dateStr,
                                year: dateObj.getFullYear(),
                                day_out_of_the_year: dayOfYear,
                                temp_day_high: daily.temperature_2m_max?.[i] ?? null,
                                temp_day_low: daily.temperature_2m_min?.[i] ?? null,
                                sunrise_time: daily.sunrise?.[i] ?? null,
                                sunset_time: daily.sunset?.[i] ?? null,
                                latitude: cityData.latitude,
                                longitude: cityData.longitude,
                                temperature_2m_mean: daily.temperature_2m_mean?.[i] ?? null,
                                rain_sum: daily.rain_sum?.[i] ?? null,
                                surface_pressure_mean: daily.surface_pressure_mean?.[i] ?? null
                            });
                        }
                    }
                }

                if (flattenedData.length > 0) {
                    setPlotData(flattenedData);
                    const cols = Object.keys(flattenedData[0]);
                    setColumns(cols);
                    const activeStores = workspaceRegistry.get(useWorkspaceStore.getState().activeWorkspaceId);
                    if (activeStores) {
                        if (cols.length > 1) { // Assuming 'city' is index 0 and 'date' is index 1
                            activeStores.axisSideMenuStore.getState().setXAxis(cols[1]);
                        } else if (cols.length > 0) {
                            activeStores.axisSideMenuStore.getState().setXAxis(cols[0]);
                        }
                    }
                }
            } else {
                console.error("Failed to fetch weather data.");
                alert("Could not load weather data.");
            }
        } catch (error) {
            console.error("Error fetching weather json:", error);
            alert("Error loading weather data.");
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
                            <NavDropdown.Item onClick={() => handleLoadTestData('simulation')}>
                                Simulation Dataset (Trig)
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLoadWeatherData}>
                                Sample Weather Data
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
                    <div className="d-flex align-items-center gap-2">
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
                        <Button
                            variant={isBetaMode ? "warning" : "outline-secondary"}
                            size="sm"
                            onClick={toggleBetaMode}
                            title="Toggle Beta Features"
                            className="fw-bold"
                        >
                            <i className="bi bi-tools me-1"></i> {isBetaMode ? 'Beta: ON' : 'Beta Mode'}
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
        </Navbar>
    );
};

export default TopMenuBar;
