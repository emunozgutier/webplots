import { useAxisSideMenuStore } from '../store/SideMenu/useAxisSideMenuStore';
import { usePlotTypeSideMenuStore } from '../store/SideMenu/usePlotTypeSideMenuStore';

export const resetActiveWorkspace = () => {
    useAxisSideMenuStore.setState({ sideMenuData: { plotType: 'scatter', xAxis: '', yAxis: [] } });
    usePlotTypeSideMenuStore.setState({ plotTypeSideMenuData: { plotType: 'scatter' } });
};
