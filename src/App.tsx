
import SideMenu from './components/SideMenu';
import PlotArea from './components/PlotArea';
import TopMenuBar from './components/TopMenuBar';
import { useAppStateStore } from './store/AppStateStore';
import PopupMenu from './components/PopupMenu';
import './App.css';

function App() {
  const { isTopMenuBarOpen } = useAppStateStore();

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 position-relative">
      <PopupMenu />
      {isTopMenuBarOpen && <TopMenuBar />}

      <div className="d-flex flex-row flex-grow-1 overflow-hidden">
        {/* SideMenu handles its own collapsed width, but if we wanted to hide it completely we could do it here. 
            However, requirements said "store if the SideMenu is open". 
            SideMenu component currently handles "open" as expanded vs "closed" as collapsed (50px).
            So we probably should keep rendering it but let it handle its state via the store.
        */}
        <SideMenu />
        <PlotArea />
      </div>
    </div>
  );
}

export default App
