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

    const signStr = val < 0 ? "-" : " ";
    const absVal = Math.abs(val);

    if (format === 'scientific') {
        return `${signStr}${absVal.toExponential(sigDigits - 1)}`;
    }

    if (format === 'engineering') {
        let exp = Math.floor(Math.log10(absVal) / 3) * 3;
        let mantissa = absVal / Math.pow(10, exp);
        
        if (parseFloat(mantissa.toPrecision(sigDigits)) >= 1000) {
            mantissa /= 1000;
            exp += 3;
        }

        const mantissaStr = mantissa.toPrecision(sigDigits);
        // Align decimal point by padding left part (up to 3 digits)
        const dotIndex = mantissaStr.indexOf('.');
        const preDot = dotIndex === -1 ? mantissaStr : mantissaStr.substring(0, dotIndex);
        const paddedPreDot = preDot.padStart(3, ' ');
        const postDot = dotIndex === -1 ? '' : mantissaStr.substring(dotIndex);
        
        return `${signStr}${paddedPreDot}${postDot}${exp !== 0 ? 'e' + exp : ''}`;
    }

    return val.toString();
}
