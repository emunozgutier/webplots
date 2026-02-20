
import type { CsvDataStore } from '../store/CsvDataStore';

export const getSmallDataset = (): CsvDataStore[] => {
    return [
        { "Date": "2023-01-01", "Value A": 10, "Value B": 100 },
        { "Date": "2023-01-02", "Value A": 15, "Value B": 120 },
        { "Date": "2023-01-03", "Value A": 8, "Value B": 90 },
        { "Date": "2023-01-04", "Value A": 20, "Value B": 150 },
        { "Date": "2023-01-05", "Value A": 12, "Value B": 110 }
    ];
};

export const getLargeColumnDataset = (): CsvDataStore[] => {
    const data: CsvDataStore[] = [];
    for (let i = 0; i < 10; i++) {
        const row: CsvDataStore = { "id": i };
        for (let j = 0; j < 50; j++) {
            row[`Col_Long_Name_${j}`] = Math.random() * 100;
        }
        data.push(row);
    }
    return data;
};

export const getSimulationDataset = (): CsvDataStore[] => {
    const data: CsvDataStore[] = [];
    for (let i = 0; i < 100; i++) {
        const t = i * 0.1;
        data.push({
            "Time": t,
            "Sine": Math.sin(t),
            "Cosine": Math.cos(t),
            "Tangent": Math.tan(t),
            "Sync": Math.sin(t) * Math.sin(t * 5),
            "Noisy": Math.sin(t) + (Math.random() - 0.5) * 0.2,
            "Square": Math.sign(Math.sin(t)),
            "Sawtooth": (t % 2) - 1
        });
    }
    return data;
};
