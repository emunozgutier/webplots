import SideMenu from './components/SideMenu';
import PlotTableArea from './components/PlotTableArea';
import TopMenuBar from './components/TopMenuBar';
import { useWorkspaceStore } from './store/Workspace/useWorkspaceStore';
import PopupMenu from './components/PopupMenu';
import TutorialGDP from './components/InkyHelper/tutorialGDP/TutorialGDP';
import SwimTest from './components/InkyHelper/SwimTest/SwimTest';
import DropFileOverlay from './components/DropFileOverlay';
import Analytics from './Analytics';
import DebugOverlay from './components/DebugOverlay';
import './App.css';

function App() {
  const { isTopMenuBarOpen } = useWorkspaceStore();

  if (window.location.pathname.includes('/beta/swimtest')) {
    return <SwimTest />;
  }

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 position-relative">
      <DropFileOverlay />
      {isTopMenuBarOpen && <TopMenuBar />}

      <main className="d-flex flex-row flex-grow-1 overflow-hidden" role="main">
        <div className="flex-row flex-grow-1 w-100 h-100 d-flex">
          <SideMenu />
          <PlotTableArea />
          <PopupMenu />
          <DebugOverlay />
        </div>
      </main>
      <TutorialGDP />
      <Analytics />
    </div>
  );
}

export default App;
