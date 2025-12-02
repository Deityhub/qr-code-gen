// The primitive polynomial for GF(2^8) used by QR Codes: x^8 + x^4 + x^3 + x^2 + 1
// Binary: 100011101 => Decimal: 285 => Hex: 0x11D
const GF_POLY = 0x11d;

const LOG_TABLE = new Uint8Array(256);
const ANTILOG_TABLE = new Uint8Array(256);

// --- Initialization ---
// Pre-compute Log and Antilog tables to speed up multiplication/division.
(function initializeGaloisTables() {
    let value = 1;
    for (let i = 0; i < 256; i++) {
        ANTILOG_TABLE[i] = value;
        LOG_TABLE[value] = i;

        value <<= 1; // Multiply by 2 (shift left)
        if (value & 0x100) {
            // If we overflow 8 bits (>= 256)
            value ^= GF_POLY; // XOR with the primitive polynomial
        }
    }
})();

// --- Core Arithmetic ---

/**
 * Adds two numbers in GF(2^8).
 * In Galois Fields, addition is equivalent to bitwise XOR.
 */
export function gfAdd(a: number, b: number): number {
    return a ^ b;
}

/**
 * Multiplies two numbers in GF(2^8) using the Log/Antilog tables.
 * Formula: antilog((log(a) + log(b)) % 255)
 */
export function gfMultiply(a: number, b: number): number {
    if (a === 0 || b === 0) {
        return 0;
    }
    return ANTILOG_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

/**
 * Divides two numbers in GF(2^8).
 * Formula: antilog((log(a) - log(b) + 255) % 255)
 */
export function gfDivide(a: number, b: number): number {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    if (a === 0) {
        return 0;
    }
    return ANTILOG_TABLE[(LOG_TABLE[a] - LOG_TABLE[b] + 255) % 255];
}

// --- Polynomial Operations ---

/**
 * Multiplies two polynomials (arrays of coefficients).
 */
export function gfPolyMultiply(p1: number[], p2: number[]): number[] {
    const len1 = p1.length;
    const len2 = p2.length;
    const result = new Uint8Array(len1 + len2 - 1);

    for (let i = 0; i < len1; i++) {
        for (let j = 0; j < len2; j++) {
            const product = gfMultiply(p1[i], p2[j]);
            result[i + j] = gfAdd(result[i + j], product);
        }
    }
    return Array.from(result);
}

/**
 * Divides a polynomial (dividend) by a generator polynomial (divisor)
 * and returns the **remainder**. The remainder represents the ECC codewords.
 */
export function gfPolyRemainder(dividend: number[], divisor: number[]): number[] {
    // Clone dividend to avoid mutation
    const result = [...dividend];

    // We process the dividend until the result length is smaller than the divisor
    for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
        const coef = result[i];

        // If the leading coefficient is 0, we just skip to the next
        if (coef !== 0) {
            // Subtract (XOR) the divisor scaled by the leading coefficient
            for (let j = 1; j < divisor.length; j++) {
                const val = gfMultiply(divisor[j], coef);
                result[i + j] = gfAdd(result[i + j], val);
            }
        }
    }

    // The remainder is the last N coefficients, where N = divisor.length - 1
    return result.slice(dividend.length - divisor.length + 1);
}
