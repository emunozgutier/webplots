/**
 * Rounds a number to a specified number of significant digits.
 * @param value The number to round.
 * @param sigDigits The number of significant digits.
 * @returns The rounded number.
 */
export const roundToSignificantDigits = (value: number, sigDigits: number = 3): number => {
    if (value === 0) return 0;
    if (isNaN(value) || !isFinite(value)) return value;
    return parseFloat(value.toPrecision(sigDigits));
};

/**
 * Returns a string representation of a number in engineering format
 * using standard K, M, G, m, u, n symbols, rounded to specified significant digits.
 * @param value The number to format.
 * @param sigDigits The number of significant digits.
 * @returns The engineering formatted string.
 */
export const toEngineeringString = (value: number, sigDigits: number = 3): string => {
    if (value === 0) return '0';
    if (isNaN(value)) return 'NaN';
    if (!isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';

    const absValue = Math.abs(value);

    // Find the power of 10
    const log10 = Math.log10(absValue);
    // Find the nearest multiple of 3 below the log10
    let exp = Math.floor(log10 / 3) * 3;

    // Prefixes mapping
    const prefixes: Record<number, string> = {
        9: 'G',    // Giga
        6: 'M',    // Mega
        3: 'K',    // Kilo
        0: '',
        [-3]: 'm', // milli
        [-6]: 'u', // micro
        [-9]: 'n'  // nano
    };

    // If out of bounds of our prefixes, use standard exponential formatting
    if (exp > 9 || exp < -9) {
        return Number(value.toPrecision(sigDigits)).toExponential();
    }

    const scaledValue = value / Math.pow(10, exp);
    // Round the scaled value to the significant digits
    let roundedScaledValue = parseFloat(scaledValue.toPrecision(sigDigits));

    // It's possible rounding pushes the value up to 1000 (e.g. 999.9 -> 1000 at 3 sig digits)
    if (Math.abs(roundedScaledValue) >= 1000 && exp < 9) {
        roundedScaledValue = roundedScaledValue / 1000;
        exp += 3;
    }

    const prefix = prefixes[exp] !== undefined ? prefixes[exp] : `e${exp}`;

    // ParseFloat drops any trailing zeroes for a cleaner output
    const finalValue = parseFloat(roundedScaledValue.toPrecision(sigDigits));
    return `${finalValue}${prefix}`;
};

export interface GaussianComponent {
    mean: number;
    stdDev: number;
    weight: number;
}

export interface GaussianStats {
    hasGaussianTest: boolean;
    isGaussian: boolean;
    gaussianScore: number;
    components: GaussianComponent[];
}

/**
 * Calculates whether an array of numeric values follows a Gaussian Mixture distribution (up to 4 peaks).
 * Uses Kernel Density Estimation (KDE) approximation and peak finding.
 */
export const calculateGaussianStats = (numericValues: number[], stdDev: number, count: number): GaussianStats => {
    let gaussianScore = 0;
    let isGaussian = false;
    let hasGaussianTest = false;
    let components: GaussianComponent[] = [];

    if (stdDev > 0 && count > 10) {
        hasGaussianTest = true;

        // 1. Build Histogram
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const range = max - min;

        if (range > 0) {
            const numBins = 60;
            const binSize = range / numBins;
            const hist = new Array(numBins).fill(0);

            for (let i = 0; i < count; i++) {
                let idx = Math.floor((numericValues[i] - min) / binSize);
                if (idx >= numBins) idx = numBins - 1;
                hist[idx]++;
            }

            // 2. Smooth Histogram (Gaussian kernel)
            const smoothed = new Array(numBins).fill(0);
            const kernel = [0.06, 0.24, 0.40, 0.24, 0.06]; // Approximation
            const kOffset = 2;

            for (let i = 0; i < numBins; i++) {
                let sum = 0;
                let weightSum = 0;
                for (let k = 0; k < kernel.length; k++) {
                    const idx = i + k - kOffset;
                    if (idx >= 0 && idx < numBins) {
                        sum += hist[idx] * kernel[k];
                        weightSum += kernel[k];
                    }
                }
                smoothed[i] = sum / weightSum;
            }

            // 3. Find Peaks
            let peaks: { index: number; value: number }[] = [];
            for (let i = 1; i < numBins - 1; i++) {
                if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
                    peaks.push({ index: i, value: smoothed[i] });
                }
            }

            // Check edges
            if (smoothed[0] > smoothed[1]) peaks.push({ index: 0, value: smoothed[0] });
            if (smoothed[numBins - 1] > smoothed[numBins - 2]) peaks.push({ index: numBins - 1, value: smoothed[numBins - 1] });

            // 4. Filter and Sort
            peaks.sort((a, b) => b.value - a.value);
            const maxVal = peaks.length > 0 ? peaks[0].value : 0;

            // Ignore peaks < 10% of max peak, and max 4 peaks
            let validPeaks = peaks.filter(p => p.value >= maxVal * 0.1).slice(0, 4);

            // 5. Estimate Parameters (Mean, Sigma, Weight)
            let rawComponents = [];
            let totalEstimatedArea = 0;

            for (let p of validPeaks) {
                const meanVal = min + (p.index + 0.5) * binSize;

                // FWHM (Full Width at Half Maximum)
                const halfMax = p.value / 2;
                let leftIdx = p.index;
                while (leftIdx > 0 && smoothed[leftIdx] > halfMax) leftIdx--;
                let rightIdx = p.index;
                while (rightIdx < numBins - 1 && smoothed[rightIdx] > halfMax) rightIdx++;

                const fwhmBins = rightIdx - leftIdx || 1; // min 1 bin
                const fwhmVal = fwhmBins * binSize;

                // Sigma = FWHM / 2.355
                let peakStdDev = fwhmVal / 2.355;
                if (peakStdDev === 0) peakStdDev = binSize; // avoid 0

                const area = p.value * peakStdDev;
                totalEstimatedArea += area;

                rawComponents.push({ mean: meanVal, stdDev: peakStdDev, rawWeight: area });
            }

            if (rawComponents.length > 0) {
                // Normalize weights
                components = rawComponents.map(c => ({
                    mean: c.mean,
                    stdDev: c.stdDev,
                    weight: c.rawWeight / totalEstimatedArea
                }));

                // 6. Calculate Confidence Score (Fit)
                let errorSum = 0;

                for (let i = 0; i < numBins; i++) {
                    const x = min + (i + 0.5) * binSize;
                    const empiricalPdf = smoothed[i] / (count * binSize);

                    let modelPdf = 0;
                    for (let comp of components) {
                        const z = (x - comp.mean) / comp.stdDev;
                        modelPdf += comp.weight * (1 / (comp.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
                    }

                    errorSum += Math.abs(empiricalPdf - modelPdf) * binSize;
                }

                // Map Error to score. Score 0 to 100.
                const confidence = Math.max(0, 100 - (errorSum * 150));
                gaussianScore = Math.round(confidence);

                isGaussian = gaussianScore >= 60 && components.length > 0 && components.length <= 4;
            }
        }
    }

    // Sort components by mean ascending, for displaying left-to-right
    components.sort((a, b) => a.mean - b.mean);

    return { hasGaussianTest, isGaussian, gaussianScore, components };
};

export const generateTestGaussianData = (): { data: any[], columns: string[] } => {
    const generateGaussian = (mean = 0, stdDev = 1) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    };

    const generateGaussianMixture = (gaussians: { mean: number, stdDev: number, weight: number }[]) => {
        const totalWeight = gaussians.reduce((sum, g) => sum + g.weight, 0);
        let rand = Math.random() * totalWeight;

        let selectedGaussian = gaussians[0];
        for (const g of gaussians) {
            if (rand <= g.weight) {
                selectedGaussian = g;
                break;
            }
            rand -= g.weight;
        }

        return generateGaussian(selectedGaussian.mean, selectedGaussian.stdDev);
    };

    const HIGH_COUNT = 10000;
    const LOW_COUNT = 100;

    const mixtures = {
        g1: [{ mean: 50, stdDev: 10, weight: 1 }],
        g2: [
            { mean: 30, stdDev: 5, weight: 0.5 },
            { mean: 70, stdDev: 5, weight: 0.5 }
        ],
        g3: [
            { mean: 20, stdDev: 4, weight: 0.33 },
            { mean: 50, stdDev: 4, weight: 0.33 },
            { mean: 80, stdDev: 4, weight: 0.33 }
        ],
        g4: [
            { mean: 15, stdDev: 3, weight: 0.25 },
            { mean: 40, stdDev: 3, weight: 0.25 },
            { mean: 65, stdDev: 3, weight: 0.25 },
            { mean: 90, stdDev: 3, weight: 0.25 }
        ]
    };

    const columns = [
        'High_1_Gaussian', 'Low_1_Gaussian',
        'High_2_Gaussian', 'Low_2_Gaussian',
        'High_3_Gaussian', 'Low_3_Gaussian',
        'High_4_Gaussian', 'Low_4_Gaussian'
    ];

    const data: any[] = [];

    for (let i = 0; i < HIGH_COUNT; i++) {
        const row: any = {};

        row['High_1_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g1).toFixed(4));
        row['High_2_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g2).toFixed(4));
        row['High_3_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g3).toFixed(4));
        row['High_4_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g4).toFixed(4));

        if (i < LOW_COUNT) {
            row['Low_1_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g1).toFixed(4));
            row['Low_2_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g2).toFixed(4));
            row['Low_3_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g3).toFixed(4));
            row['Low_4_Gaussian'] = parseFloat(generateGaussianMixture(mixtures.g4).toFixed(4));
        }

        data.push(row);
    }

    return { data, columns };
};

