
import SideMenu from './components/SideMenu';
import PlotArea from './components/PlotArea';
import TopMenuBar from './components/TopMenuBar';
import './App.css';

function App() {
  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <TopMenuBar />

      <div className="d-flex flex-row flex-grow-1 overflow-hidden">
        <SideMenu />
        <PlotArea />
      </div>
    </div>
  );
}

export default App
