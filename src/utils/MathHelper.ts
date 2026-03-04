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

export interface GaussianStats {
    hasGaussianTest: boolean;
    isGaussian: boolean;
    gaussianScore: number;
}

/**
 * Calculates whether an array of numeric values follows a Gaussian (normal) distribution.
 * Returns heuristics based on the Empirical Rule, Skewness, and Excess Kurtosis.
 */
export const calculateGaussianStats = (numericValues: number[], avg: number, stdDev: number, count: number): GaussianStats => {
    let gaussianScore = 0;
    let isGaussian = false;
    let hasGaussianTest = false;

    if (stdDev > 0 && count > 10) {
        hasGaussianTest = true;
        let within1Sd = 0;
        let within2Sd = 0;
        let within3Sd = 0;

        let skewness = 0;
        let kurtosis = 0;

        for (let v of numericValues) {
            let z = (v - avg) / stdDev;
            if (Math.abs(z) <= 1) within1Sd++;
            if (Math.abs(z) <= 2) within2Sd++;
            if (Math.abs(z) <= 3) within3Sd++;

            let z2 = z * z;
            let z3 = z2 * z;
            let z4 = z2 * z2;
            skewness += z3;
            kurtosis += z4;
        }

        let p1 = within1Sd / count;
        let p2 = within2Sd / count;
        let p3 = within3Sd / count;

        skewness /= count;
        kurtosis = (kurtosis / count) - 3; // Excess kurtosis (normal=0)

        // Compare to empirical rule for normal distribution (~68%, ~95%, ~99.7%)
        let err1 = Math.abs(p1 - 0.6827);
        let err2 = Math.abs(p2 - 0.9545);
        let err3 = Math.abs(p3 - 0.9973);

        let shapeError = (Math.abs(skewness) + Math.abs(kurtosis)) / 2;
        let distributionError = (err1 + err2 + err3) / 1.5;

        let totalError = distributionError + shapeError;

        // Convert to a percentage, capping at 100, floor at 0
        let confidence = Math.max(0, 100 - (totalError * 100));
        gaussianScore = Math.round(confidence);

        // 70% threshold roughly captures normally distributed data without being too strict
        isGaussian = gaussianScore >= 70;
    }

    return { hasGaussianTest, isGaussian, gaussianScore };
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

