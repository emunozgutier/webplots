import { performance } from 'perf_hooks';
import { sortData } from '../src/utils/TableMathLib';

const POINTS = 1_000_000;
const CYCLES = 10;
const ITERATIONS = 10;

// Generate 1e6 points of 10 cycles of sine, as objects
const generateData = (): { value: number }[] => {
    const data = new Array(POINTS);
    for (let i = 0; i < POINTS; i++) {
        // x goes from 0 to 2 * PI * CYCLES
        const x = (i / POINTS) * (2 * Math.PI * CYCLES);
        data[i] = { value: Math.sin(x) };
    }
    return data;
};

const runBenchmark = () => {
    console.log(`Generating ${POINTS.toLocaleString()} object points of a sine wave...`);
    const initialData = generateData();
    console.log('Data generation complete.\n');

    console.log(`Running TableMathLib.sortData benchmark: ${POINTS.toLocaleString()} objects, ${ITERATIONS} times.\n`);

    const times: number[] = [];

    for (let i = 1; i <= ITERATIONS; i++) {
        // Shallow copy the array (we are just changing the order of the objects)
        const dataToSort = [...initialData];

        const startTime = performance.now();
        
        // Use the application's actual sort function
        sortData(dataToSort, { key: 'value', direction: 'asc' });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        console.log(`Iteration ${i}: ${duration.toFixed(2)} ms`);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`\nAverage time: ${avg.toFixed(2)} ms`);
};

runBenchmark();
