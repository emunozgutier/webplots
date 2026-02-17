
export interface AxisMenuData {
    xAxis: string;
    yAxis: string;
}

export interface PlotArea {
    enableLogAxis: boolean;
    plotTitle: string;
    axisMenuData: AxisMenuData;
}

export interface PlotData {
    [key: string]: string | number;
}
