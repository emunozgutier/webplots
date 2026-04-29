
const chartWidth = 500;
const chartHeight = 700;
const pointRadius = 8;
const useCustomRadius = true;
const customRadius = 146;
const inkRatio = 1;

const xData = [];
const yData = [];

// Generate dense data (0 to 1)
for (let i = 0; i <= 100; i++) {
    xData.push(i / 100);
    yData.push(i / 100);
}

// Manually simulate filterPoints function from PlotlyHelpers.ts
const minPixelDist = useCustomRadius
    ? customRadius
    : pointRadius * 2 * (1 - inkRatio);

console.log(`Min Distance: ${minPixelDist}`);

const xMin = 0;
const xMax = 1;
const yMin = 0;
const yMax = 1;

const xRangeVal = 1;
const yRangeVal = 1;

const xToPx = (val) => {
    const normalized = (val - xMin) / xRangeVal;
    return normalized * chartWidth;
};

const yToPx = (val) => {
    const normalized = (val - yMin) / yRangeVal;
    return (1 - normalized) * chartHeight; // Y is inverted in screen coords
};

const filteredX = [];
const filteredY = [];
const points = [];

for (let i = 0; i < xData.length; i++) {
    const px = xToPx(xData[i]);
    const py = yToPx(yData[i]);
    let keep = true;

    for (let j = 0; j < points.length; j++) {
        const dx = px - points[j].px;
        const dy = py - points[j].py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minPixelDist) {
            keep = false;
            // console.log(`Point ${i} (${px.toFixed(1)}, ${py.toFixed(1)}) dropped. Too close to point ${j} (${points[j].px.toFixed(1)}, ${points[j].py.toFixed(1)}). Dist: ${dist.toFixed(1)} < ${minPixelDist}`);
            break;
        }
    }

    if (keep) {
        points.push({ px, py });
        filteredX.push(xData[i]);
        filteredY.push(yData[i]);
        console.log(`Point ${i} kept at (${px.toFixed(1)}, ${py.toFixed(1)})`);
    }
}

console.log(`Input points: ${xData.length}`);
console.log(`Filtered points: ${filteredX.length}`);
