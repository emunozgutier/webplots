
import type { CsvDataStore } from '../store/useCsvDataStore';

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

export const getBinningTestData = (): CsvDataStore[] => {
    const data: CsvDataStore[] = [];
    for (let i = 0; i < 20; i++) {
        data.push({
            "ManyUnique": i, // 20 unique values
            "FewUnique1": i % 2, // 2 unique values
            "FewUnique2": i % 3, // 3 unique values
            "Value": Math.random() * 100
        });
    }
    return data;
};

export const getVoltageRegulatorData = (): CsvDataStore[] => {
    const data: CsvDataStore[] = [];
    const ambientTemps = [25, 85];
    const voltages = [3.3, 5.0, 12.0];
    const numSteps = 100;
    const maxTime = 1000; // seconds

    // Device specific variations. 
    // Target Delta ~20C. finalVar adds up to 20% variance.
    // tau is the time constant. tauVar adds variance to ramp rate.
    // vSens makes some devices more sensitive to input voltage.
    const devices = [
        { name: 'VR1', finalVar: 1.0, tauVar: 1.0, vSens: 1.0 },
        { name: 'VR2', finalVar: 1.2, tauVar: 0.8, vSens: 1.5 },
        { name: 'VR3', finalVar: 0.8, tauVar: 1.2, vSens: 0.5 },
        { name: 'VR4', finalVar: 0.9, tauVar: 1.1, vSens: 2.0 },
    ];

    for (const ambT of ambientTemps) {
        for (const v of voltages) {
            for (let step = 0; step <= numSteps; step++) {
                const time = (step / numSteps) * maxTime;
                
                const row: CsvDataStore = {
                    "Time_s": time,
                    "Ambient_Temp_C": ambT,
                    "Input_Voltage_V": v,
                };
                
                for (const dev of devices) {
                    const baseDelta = 20;
                    // Voltage sensitivity: higher voltage -> higher temp, scaled by dev.vSens
                    const vFactor = 1 + (v - 5.0) * 0.05 * dev.vSens;
                    const finalDelta = baseDelta * dev.finalVar * vFactor;
                    const tau = 200 * dev.tauVar; // base time constant is 200s
                    
                    const temp = ambT + finalDelta * (1 - Math.exp(-time / tau));
                    // Add some noise (0.1 C)
                    const noise = (Math.random() - 0.5) * 0.1;
                    row[`${dev.name}_Temp_C`] = temp + noise;
                }
                data.push(row);
            }
        }
    }
    return data;
};
