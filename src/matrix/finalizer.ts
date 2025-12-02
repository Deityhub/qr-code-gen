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

    // 1. Place Format Information (15 bits)
    const formatData = getFormatBits(ecl, maskId);

    // Bits are placed 0 (LSB) to 14 (MSB)
    // There are two copies.

    // Copy 1: Around Top-Left Finder
    // Indices in FormatData: 14..0
    // Map to specific coordinates:
    // Bits 14-9 -> (0..5, 8)
    // Bit 8 -> (7, 8)
    // Bit 7 -> (8, 8)
    // Bit 6 -> (8, 7)
    // Bits 5-0 -> (8, 5..0)

    for (let i = 0; i < 15; i++) {
        const bit = (formatData >> i) & 1;
        const isDark = bit === 1;

        // Copy 1 (Top Left)
        if (i <= 5) {
            // 0-5
            finalMatrix[8][i] = isDark;
        } else if (i === 6) {
            finalMatrix[8][7] = isDark;
        } else if (i === 7) {
            // The corner, usually overlaps but here we explicit
            finalMatrix[8][8] = isDark;
        } else if (i === 8) {
            finalMatrix[7][8] = isDark;
        } else {
            // 9-14
            finalMatrix[14 - i][8] = isDark;
        }

        // Copy 2 (Split between Top-Right and Bottom-Left)
        // Bits 14-8 -> (8, size-1 .. size-8)  [Bottom-Left of Top-Right finder area] -- WAIT.
        // Correction: Spec says:
        // Bits 0-7 -> (8, size-1 ... size-8)  [Near Top Right]
        // Bits 8-14 -> (size-7 ... size-1, 8) [Near Bottom Left]

        if (i < 7) {
            finalMatrix[8][size - 1 - i] = isDark;
        } else {
            finalMatrix[size - 8 + (i - 7)][8] = isDark;
        }
    }

    // Dark Module fixed check (already done in init, but Format overlaps one)
    // The "Dark Module" is at (4V+9, 8).
    // Format bits do not overwrite the Dark Module.

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
