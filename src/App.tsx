import React, { useState } from 'react';
import Papa from 'papaparse';
import type { Data } from 'plotly.js';
import SideMenu from './components/SideMenu';
import PlotArea from './components/PlotArea';
import './App.css';

interface PlotData {
  [key: string]: string | number;
}

function App() {
  const [data, setData] = useState<PlotData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const parsedData = results.data as PlotData[];
          if (parsedData.length > 0) {
            setData(parsedData);
            const cols = Object.keys(parsedData[0]);
            setColumns(cols);
            // Default to first two columns if available
            if (cols.length > 0) setXAxis(cols[0]);
            if (cols.length > 1) setYAxis(cols[1]);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  const getPlotData = (): Data[] => {
    if (!data.length || !xAxis || !yAxis) return [];

    const x = data.map(row => row[xAxis]);
    const y = data.map(row => row[yAxis]);

    return [{
      x: x,
      y: y,
      mode: 'lines',
      type: 'scatter'
    } as Data];
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <nav className="navbar navbar-dark bg-primary shadow-sm px-4">
        <span className="navbar-brand mb-0 h1">WebPlots CSV Visualizer</span>
      </nav>

      <div className="row flex-grow-1 g-0">
        <SideMenu
          onFileUpload={handleFileUpload}
          columns={columns}
          xAxis={xAxis}
          setXAxis={setXAxis}
          yAxis={yAxis}
          setYAxis={setYAxis}
        />
        <PlotArea
          data={getPlotData()}
          xAxis={xAxis}
          yAxis={yAxis}
          hasData={data.length > 0}
        />
      </div>
    </div>
  );
}

export default App
