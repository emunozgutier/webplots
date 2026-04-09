/**
 * Formats a number according to the specified format and significant digits.
 * Ensure that decimal points align vertically when using a monospaced font.
 * 
 * Target Alignment:
 * - Scientific: Sign at index 0, digit at index 1, dot at index 2 (3rd character).
 * - Engineering: Sign at index 0, digit slots at indices 1-3, dot at index 4 (5th character).
 * 
 * @param val The number to format
 * @param format 'generic' | 'engineering' | 'scientific'
 * @param sigDigits Number of significant digits to keep
 * @returns Formatted string
 */
export function formatNumber(
    val: number | null | undefined, 
    format: 'generic' | 'engineering' | 'scientific', 
    sigDigits: number,
    alignDecimal: boolean = true
): string {
    if (val === null || val === undefined) return '';
    if (isNaN(val)) return String(val);

    // If it's not a finite number, return as string (Infinity, NaN)
    if (!Number.isFinite(val)) return String(val);

    const signStr = alignDecimal ? (val < 0 ? "-" : " ") : (val < 0 ? "-" : "");
    const absVal = Math.abs(val);

    // Default Generic formatting with optional sign alignment
    if (format === 'generic') {
        const str = absVal.toString();
        return `${signStr}${str}`;
    }

    if (val === 0) {
        if (format === 'scientific') {
            // Index 0: sign, 1: '0', 2: '.', 3+: '0's
            const fractional = sigDigits > 1 ? '.'.padEnd(sigDigits, '0') : (alignDecimal ? ' ' : '');
            if (alignDecimal) return `${signStr}0${fractional}`;
            return `0${sigDigits > 1 ? '.'.padEnd(sigDigits, '0') : ''}`;
        }
        if (format === 'engineering') {
            const fractional = sigDigits > 1 ? '.'.padEnd(sigDigits, '0') : (alignDecimal ? ' ' : '');
            if (alignDecimal) return `${signStr}  0${fractional}`;
            return `0${sigDigits > 1 ? '.'.padEnd(sigDigits, '0') : ''}`;
        }
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

        const mantissaStr = mantissa.toPrecision(sigDigits);
        const dotIndex = mantissaStr.indexOf('.');
        
        let preDot: string;
        let postDot: string;

        if (dotIndex === -1) {
            preDot = mantissaStr;
            // If dot is missing, we need a placeholder for alignment
            postDot = alignDecimal ? ' ' : ''; 
        } else {
            preDot = mantissaStr.substring(0, dotIndex);
            postDot = mantissaStr.substring(dotIndex);
        }
        
        const paddedPreDot = alignDecimal ? preDot.padStart(3, ' ') : preDot;
        
        return `${signStr}${paddedPreDot}${postDot}${exp !== 0 ? 'e' + exp : ''}`;
    }

    return `${signStr}${absVal.toString()}`;
}
