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
