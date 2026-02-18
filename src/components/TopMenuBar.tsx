
import React, { useRef } from 'react';
import { NavDropdown, Navbar, Nav, Container } from 'react-bootstrap';
import { usePlotDataStore } from '../store/PlotDataStore';
import { useSideMenuStore } from '../store/SideMenuStore';
import { usePlotAreaStore } from '../store/PlotAreaStore';
import Papa from 'papaparse';
import type { PlotData } from '../store/PlotDataStore';

const TopMenuBar: React.FC = () => {
    const { data, columns, setPlotData, setColumns, loadProject: loadPlotDataProject } = usePlotDataStore();
    const { sideMenuData, setXAxis, addYAxisColumn, loadProject: loadSideMenuProject } = useSideMenuStore();
    const { plotArea, loadProject: loadPlotAreaProject } = usePlotAreaStore();

    const csvInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);

    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const parsedData = results.data as PlotData[];
                    if (parsedData.length > 0) {
                        setPlotData(parsedData);
                        const cols = Object.keys(parsedData[0]);
                        setColumns(cols);
                        if (cols.length > 0) setXAxis(cols[0]);
                        if (cols.length > 1) {
                            // Clear existing columns first? For now just add the first one.
                            // Ideally loadProject would handle this reset, but here we are manual.
                            // Let's assume the user wants to start fresh.
                            // Since we don't have clearYAxis, we relying on loadSideMenuProject or just adding.
                            // Given the store structure, we might need a reset action, but for now let's just add.
                            addYAxisColumn(cols[1]);
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
        const projectState = {
            data,
            columns,
            sideMenuData,
            plotArea
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
                        loadSideMenuProject(projectState.sideMenuData.xAxis, projectState.sideMenuData.yAxis);
                    } else if (projectState.plotArea && projectState.plotArea.axisMenuData) {
                        // Migration for old project files
                        loadSideMenuProject(projectState.plotArea.axisMenuData.xAxis, projectState.plotArea.axisMenuData.yAxis);
                    }

                    if (projectState.plotArea) {
                        // Clean up old axisMenuData if present in the loaded object before setting
                        const { axisMenuData, ...cleanPlotArea } = projectState.plotArea;
                        loadPlotAreaProject(cleanPlotArea);
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

                        <NavDropdown title="Help" id="help-nav-dropdown">
                            <NavDropdown.Item onClick={() => alert('WebPlots v1.0\n\n- Load CSV to visualize data.\n- Save/Load Project to persist your work.')}>
                                About
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
        </Navbar>
    );
};

export default TopMenuBar;
