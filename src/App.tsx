import { useEffect } from 'react';
import SideMenu from './components/SideMenu';
import PlotTableArea from './components/PlotTableArea';
import TopMenuBar from './components/TopMenuBar';
import WorkspaceTabs from './components/WorkspaceTabs';
import { WorkspaceProvider } from './store/Workspace/WorkspaceProvider';
import { useWorkspaceStore } from './store/Workspace/useWorkspaceStore';
import PopupMenu from './components/PopupMenu';
import TutorialGDP from './components/InkyHelper/tutorialGDP/TutorialGDP';
import SwimTest from './components/InkyHelper/SwimTest/SwimTest';
import Analytics from './Analytics';
import { useWindowDim } from './store/useWindowDim';
import debounce from 'lodash/debounce';
import './App.css';

function App() {
  const { isTopMenuBarOpen, workspaces, activeWorkspaceId } = useWorkspaceStore();
  const updateActualDimensions = useWindowDim((state) => state.updateActualDimensions);
  const preset = useWindowDim((state) => state.preset);
  const width = useWindowDim((state) => state.width);
  const height = useWindowDim((state) => state.height);

  useEffect(() => {
    // Set initial size
    updateActualDimensions(window.innerWidth, window.innerHeight);

    const handleResize = debounce(() => {
      updateActualDimensions(window.innerWidth, window.innerHeight);
    }, 150);

    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [updateActualDimensions]);

  useEffect(() => {
    if (preset !== 'actual') {
      window.dispatchEvent(new Event('resize'));
    }
  }, [width, height, preset]);

  if (window.location.pathname.includes('/beta/swimtest')) {
    return <SwimTest />;
  }

  const isActual = preset === 'actual';

  const appContent = (
    <div 
      className="container-fluid d-flex flex-column p-0 position-relative"
      style={{
        width: isActual ? '100%' : `${width}px`,
        height: isActual ? '100vh' : `${height}px`,
        maxWidth: '100%',
        maxHeight: '100%',
        border: isActual ? 'none' : '1px solid rgba(0, 0, 0, 0.15)',
        borderRadius: isActual ? '0' : '12px',
        boxShadow: isActual ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.15)',
        backgroundColor: '#fff',
        overflow: 'hidden',
        transition: 'width 0.3s ease, height 0.3s ease, border-radius 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      {isTopMenuBarOpen && <TopMenuBar />}
      <WorkspaceTabs />

      <main className="d-flex flex-row flex-grow-1 overflow-hidden" role="main">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`flex-row flex-grow-1 w-100 h-100 ${ws.id === activeWorkspaceId ? 'd-flex' : 'd-none'}`}
          >
            <WorkspaceProvider workspaceId={ws.id}>
              <SideMenu />
              <PlotTableArea />
              <PopupMenu />
            </WorkspaceProvider>
          </div>
        ))}
      </main>
      <TutorialGDP />
      <Analytics />
    </div>
  );

  if (isActual) {
    return appContent;
  }

  return (
    <div 
      className="w-100 vh-100 d-flex align-items-center justify-content-center"
      style={{ 
        backgroundColor: '#e9ecef', 
        padding: '20px',
        overflow: 'auto'
      }}
    >
      {appContent}
    </div>
  );
}

export default App;
