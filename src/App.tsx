
import type { Data } from 'plotly.js';
import SideMenu from './components/SideMenu';
import PlotArea from './components/PlotArea';
import TopMenuBar from './components/TopMenuBar';
import { useAppStore } from './store';
import './App.css';

function App() {
  const {
    data,
    columns,
    plotArea,
    setXAxis,
    setYAxis
  } = useAppStore();

  const getPlotData = (): Data[] => {
    const { xAxis, yAxis } = plotArea.axisMenuData;
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

  const { xAxis, yAxis } = plotArea.axisMenuData;

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <TopMenuBar />

      <div className="row flex-grow-1 g-0">
        <SideMenu
          onFileUpload={() => { }} // No-op, handled by TopMenuBar
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
