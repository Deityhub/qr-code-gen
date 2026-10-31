import { QRMatrix, ErrorCorrectionLevel } from '../types';
import { ECL_INDICATORS } from '../constants';

// --- BCH Math Helpers ---

/**
 * Calculates BCH (Bose-Chaudhuri-Hocquenghem) code for fixed info.
 * This is different from Reed-Solomon. It uses simple bitwise division modulo a polynomial.
 */
function calculateBCH(data: number, dataBits: number, poly: number, polyBits: number): number {
    // 1. Shift data to left to make room for checksum bits
    // The number of checksum bits is (polyBits - 1)
    let d = data << (polyBits - 1);

    // 2. Perform division
    // We iterate from the MSB. If MSB is 1, XOR with poly.
    // The "MSB" position shifts as we move down.

    // Total bits we are working with is dataBits + (polyBits - 1)
    const totalBits = dataBits + (polyBits - 1);

    for (let i = totalBits - 1; i >= polyBits - 1; i--) {
        if ((d >> i) & 1) {
            d ^= poly << (i - (polyBits - 1));
        }
    }

    // The result 'd' acts as the remainder. However, we only want the last N bits.
    // But since we did the XORs in place, 'd' now holds the remainder in the lower bits.
    return d;
}

// --- Format Information ---
// 15 bits: 2 data (ECL) + 3 data (Mask) + 10 BCH.
// Generator Poly: x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 (10100110111 -> 0x537)
// XOR Mask: 101010000010010 (0x5412)
function getFormatBits(ecl: ErrorCorrectionLevel, maskId: number): number {
    const eclVal = ECL_INDICATORS[ecl];
    const data = (eclVal << 3) | maskId; // 5 bits

    const bch = calculateBCH(data, 5, 0x537, 11);
    const fullBits = (data << 10) | bch;

    return fullBits ^ 0x5412;
}

// --- Version Information ---
// 18 bits: 6 data (Version) + 12 BCH.
// Generator Poly: x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1 (1111100100101 -> 0x1F25)
// No XOR Mask.
function getVersionBits(version: number): number {
    // Version is just the number (e.g. 7)
    const bch = calculateBCH(version, 6, 0x1f25, 13);
    return (version << 12) | bch;
}

// --- Main Finalizer ---

export function finalizeMatrix(
    matrix: QRMatrix,
    version: number,
    ecl: ErrorCorrectionLevel,
    maskId: number,
): QRMatrix {
    const size = matrix.length;
    const finalMatrix = matrix.map((row) => [...row]); // Copy

    // 1. Place Format Information (15 bits, bit 0 = LSB), two copies (ISO 18004 section 7.9.1):
    //   Copy 1: column 8, bits 0-5 on rows 0-5, bits 6-7 on rows 7-8, bits 8-14 on the bottom rows
    //           (size-7 .. size-1). The dark module at (size-8, 8) is NOT part of the format info.
    //   Copy 2: row 8, bits 0-7 on columns size-1 .. size-8, bit 8 on column 7, bits 9-14 on columns 5..0.
    const formatData = getFormatBits(ecl, maskId);

    for (let i = 0; i < 15; i++) {
        const isDark = ((formatData >> i) & 1) === 1;

        // Copy 1 (column 8)
        if (i < 6) {
            finalMatrix[i][8] = isDark;
        } else if (i < 8) {
            finalMatrix[i + 1][8] = isDark;
        } else {
            finalMatrix[size - 15 + i][8] = isDark;
        }

        // Copy 2 (row 8)
        if (i < 8) {
            finalMatrix[8][size - 1 - i] = isDark;
        } else if (i === 8) {
            finalMatrix[8][7] = isDark;
        } else {
            finalMatrix[8][14 - i] = isDark;
        }
    }

    // 2. Place Version Information (Version >= 7)
    if (version >= 7) {
        const versionData = getVersionBits(version);

        // 18 bits. Placed in 6x3 blocks.
        // Block 1: Bottom-Left (near finder) -> rows (size-11..size-9), cols (0..5)
        // Block 2: Top-Right (near finder) -> rows (0..5), cols (size-11..size-9)

        for (let i = 0; i < 18; i++) {
            const bit = (versionData >> i) & 1;
            const isDark = bit === 1;

            // Calc r, c inside the 6x3 block
            const r = Math.floor(i / 3);
            const c = i % 3;

            // Block 1 (Bottom Left) - Placed as 6x3
            // Row: size - 11 + c, Col: r
            finalMatrix[size - 11 + c][r] = isDark;

            // Block 2 (Top Right) - Placed as 3x6
            // Row: r, Col: size - 11 + c
            finalMatrix[r][size - 11 + c] = isDark;
        }
    }

    return finalMatrix;
}
