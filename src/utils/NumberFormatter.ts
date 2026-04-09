/**
 * Formats a number according to the specified format and significant digits.
 * 
 * @param val The number to format
 * @param format 'generic' | 'engineering' | 'scientific'
 * @param sigDigits Number of significant digits to keep
 * @returns Formatted string
 */
export function formatNumber(
    val: number | null | undefined, 
    format: 'generic' | 'engineering' | 'scientific', 
    sigDigits: number
): string {
    if (val === null || val === undefined) return '';
    if (isNaN(val)) return String(val);

    // If it's not a finite number, return as string (Infinity, NaN)
    if (!Number.isFinite(val)) return String(val);

    if (format === 'generic') {
        return val.toString();
    }

    if (val === 0) return "0";

    const sign = val < 0 ? "-" : "";
    const absVal = Math.abs(val);

    if (format === 'scientific') {
        return val.toExponential(sigDigits - 1);
    }

    if (format === 'engineering') {
        // Engineering notation: exponent must be a multiple of 3
        // Mantissa must be in [1.0, 1000.0)
        let exp = Math.floor(Math.log10(absVal) / 3) * 3;
        let mantissa = absVal / Math.pow(10, exp);
        
        // Handle edge case where mantissa might round up to 1000 due to precision issues
        if (parseFloat(mantissa.toPrecision(sigDigits)) >= 1000) {
            mantissa /= 1000;
            exp += 3;
        }

        return `${sign}${mantissa.toPrecision(sigDigits)}${exp !== 0 ? 'e' + exp : ''}`;
    }

    return val.toString();
}
