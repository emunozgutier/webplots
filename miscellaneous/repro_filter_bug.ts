
import { Step_3_ink_ratio_filter, TraceData } from '../src/utils/DataFrameLib';

const testFiltering = () => {
    const trace: TraceData = {
        yCol: 'val',
        groupName: 'test',
        fullTraceName: 'test',
        xData: [],
        yData: [],
        rowIndices: []
    };

    // Point 1 at day 5
    trace.xData.push(5);
    trace.yData.push(-12.7);
    trace.rowIndices.push(0);

    // Add 300 dummy points to push Point 1 out of the 200-window
    for (let i = 0; i < 300; i++) {
        trace.xData.push(100 + i);
        trace.yData.push(100 + i);
        trace.rowIndices.push(i + 1);
    }

    // Point 2 at day 5 (or very close)
    trace.xData.push(5.1);
    trace.yData.push(-12.8);
    trace.rowIndices.push(301);

    const config = {
        inkRatio: 0, // max filtering
        chartWidth: 1000,
        chartHeight: 1000,
        pointRadius: 10, // diameter 20
        useCustomRadius: false,
        customRadius: 20,
        enableLogAxis: false
    };

    const results = Step_3_ink_ratio_filter([trace], config);
    const resultTrace = results[0];

    console.log("Original points:", trace.xData.length);
    console.log("Filtered points:", resultTrace.xData.length);
    
    const p1InResult = resultTrace.xData.some((x, i) => x === 5 && resultTrace.yData[i] === -12.7);
    const p2InResult = resultTrace.xData.some((x, i) => x === 5.1 && resultTrace.yData[i] === -12.8);

    console.log("Point 1 kept:", p1InResult);
    console.log("Point 2 kept:", p2InResult);

    if (p1InResult && p2InResult) {
        console.log("BUG REPRODUCED: Both close points kept despite being < minPixelDist apart because of the 200-window limit.");
    } else {
        console.log("Points merged correctly.");
    }
};

testFiltering();
