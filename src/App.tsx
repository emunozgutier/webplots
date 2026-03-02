
import SideMenu from './components/SideMenu';
import PlotTableArea from './components/PlotTableArea';
import TopMenuBar from './components/TopMenuBar';
import WorkspaceTabs from './components/WorkspaceTabs';
import { WorkspaceProvider } from './store/WorkspaceContext';
import { useWorkspaceStore } from './store/WorkspaceStore';
import './App.css';

function App() {
  const { isTopMenuBarOpen, workspaces, activeWorkspaceId } = useWorkspaceStore();

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 position-relative">
      {isTopMenuBarOpen && <TopMenuBar />}
      <WorkspaceTabs />

      <div className="d-flex flex-row flex-grow-1 overflow-hidden">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`flex-row flex-grow-1 w-100 h-100 ${ws.id === activeWorkspaceId ? 'd-flex' : 'd-none'}`}
          >
            <WorkspaceProvider workspaceId={ws.id}>
              <SideMenu />
              <PlotTableArea />
            </WorkspaceProvider>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App
