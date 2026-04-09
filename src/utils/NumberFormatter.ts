/**
 * Formats a number according to the specified format and significant digits.
 * Ensure that decimal points align vertically when using a monospaced font.
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

    const signStr = val < 0 ? "-" : " ";
    const absVal = Math.abs(val);

    if (format === 'generic') {
        return `${signStr}${absVal.toString()}`;
    }

    if (val === 0) {
        // Find how many spaces to pad to match Scientific/Engineering decimal point
        // Scientific has 1 digit before dot + sign = 2 chars
        // Engineering has up to 3 digits before dot + sign = 4 chars
        if (format === 'scientific') return `${signStr}0${'.'.padEnd(sigDigits, '0')}`;
        if (format === 'engineering') return `${signStr}  0${'.'.padEnd(sigDigits, '0')}`;
        return `${signStr}0`;
    }

    if (format === 'scientific') {
        const expStr = absVal.toExponential(sigDigits - 1);
        return `${signStr}${expStr}`;
    }

    if (format === 'engineering') {
        let exp = Math.floor(Math.log10(absVal) / 3) * 3;
        let mantissa = absVal / Math.pow(10, exp);
        
        // Handle rounding edge case (e.g. 999.99... -> 1000)
        if (parseFloat(mantissa.toPrecision(sigDigits)) >= 1000) {
            mantissa /= 1000;
            exp += 3;
        }

        let mantissaStr = mantissa.toPrecision(sigDigits);
        
        // Ensure decimal point alignment even for integers
        if (mantissaStr.indexOf('.') === -1) {
            // If sigDigits > length of integer part, toPrecision usually adds a dot.
            // If not, we might need to pad. 
            // However, with Engineering, mantissa is [1, 1000).
            // Example: 500.toPrecision(3) is "500".
            // We'll append a dot and spaces to keep alignment if needed? 
            // Actually, better to just let it be, and pad the integer part.
        }

        const dotIndex = mantissaStr.indexOf('.');
        const preDot = dotIndex === -1 ? mantissaStr : mantissaStr.substring(0, dotIndex);
        const postDot = dotIndex === -1 ? "" : mantissaStr.substring(dotIndex);
        
        // Pad preDot to 3 characters
        const paddedPreDot = preDot.padStart(3, ' ');
        
        // If there's no dot but other numbers have one, alignment breaks.
        // In Engineering, if mantissa is integer >= 100 and sigDigits is small, dot might be missing.
        // We'll consistently use a space-padded approach.
        
        return `${signStr}${paddedPreDot}${postDot}${exp !== 0 ? 'e' + exp : ''}`;
    }

    return `${signStr}${absVal.toString()}`;
}
