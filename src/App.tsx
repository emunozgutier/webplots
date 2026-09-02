import SideMenu from './components/SideMenu';
import PlotTableArea from './components/PlotTableArea';
import TopMenuBar from './components/TopMenuBar';
import { useWorkspaceStore } from './store/Workspace/useWorkspaceStore';

import { useAxisSideMenuStore } from './store/SideMenu/useAxisSideMenuStore';
import { usePlotTypeSideMenuStore } from './store/SideMenu/usePlotTypeSideMenuStore';
import { useStyleSideMenuStore } from './store/SideMenu/useStyleSideMenuStore';
import { useFilterSideMenuStore } from './store/SideMenu/useFilterSideMenuStore';
import { useGroupSideMenuStore } from './store/SideMenu/useGroupSideMenuStore';
import { useInkRatioStore } from './store/SideMenu/useInkRatioStore';
import { usePlotLayoutStore } from './store/PlotTable/usePlotLayoutStore';
import { useTraceConfigStore } from './store/PlotTable/useTraceConfigStore';
import { useSubplotSideMenuStore } from './store/SideMenu/useSubplotSideMenuStore';
import { useTableStore } from './store/PlotTable/useTableStore';
import { useAnimationSideMenuStore } from './store/SideMenu/useAnimationSideMenuStore';
import { useAnnotationSideMenuStore } from './store/SideMenu/useAnnotationSideMenuStore';
import { useAppLocalStore } from './store/useAppLocalStore';

import PopupMenu from './components/PopupMenu';
import TutorialGDP from './components/InkyHelper/tutorialGDP/TutorialGDP';
import SwimTest from './components/InkyHelper/SwimTest/SwimTest';
import DropFileOverlay from './components/DropFileOverlay';
import Analytics from './Analytics';
import './App.css';

function App() {

  // Expose all stores to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).stores = {
      axis: useAxisSideMenuStore,
      plotType: usePlotTypeSideMenuStore,
      style: useStyleSideMenuStore,
      filter: useFilterSideMenuStore,
      group: useGroupSideMenuStore,
      ink: useInkRatioStore,
      layout: usePlotLayoutStore,
      trace: useTraceConfigStore,
      subplot: useSubplotSideMenuStore,
      table: useTableStore,
      animation: useAnimationSideMenuStore,
      annotation: useAnnotationSideMenuStore,
      appLocal: useAppLocalStore,
      workspace: useWorkspaceStore
    };
  }

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
          
        </div>
      </main>
      <TutorialGDP />
      <Analytics />
    </div>
  );
}

export default App;
