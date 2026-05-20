
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
import './App.css';

function App() {
  const { isTopMenuBarOpen, workspaces, activeWorkspaceId } = useWorkspaceStore();

  if (window.location.pathname.includes('/beta/swimtest')) {
    return <SwimTest />;
  }

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 position-relative">
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
}

export default App
