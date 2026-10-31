// Re-export types so the consumer can use them
export * from './types';
export * from './config';

// Import internal dependencies
import { DEFAULT_CONFIG } from './config';
import { QRMatrix, QRCodeConfig } from './types';
import { selectMode } from './encoder/modeSelector';
import { getMinimumVersion } from './encoder/capacity';
import { encodeData } from './encoder/dataEncoder';
import { generateErrorCorrectionCodewords } from './ecc/reedSolomon';
import { initializeMatrix } from './matrix/functionalPatterns';
import { placeData } from './matrix/dataPlacement';
import { chooseBestMask } from './matrix/masking';
import { finalizeMatrix } from './matrix/finalizer';

/**
 * Generates a QR Code Matrix (2D boolean array) from the given configuration.
 * * @param config Configuration object (data, version, ecl, mode)
 * @returns A 2D array of booleans (true = black/dark, false = white/light)
 * @throws {CapacityError} If data is too large for the version/standard.
 * @throws {EncodingError} If data contains characters invalid for the selected mode.
 */
export function generateQRCode(config: QRCodeConfig): QRMatrix {
    // 1. Apply Defaults
    const mode = selectMode(config.data, config.mode);
    const ecl = config.ecl || DEFAULT_CONFIG.ecl;
    const quietZone = config.quietZone ?? DEFAULT_CONFIG.quietZone;

    // 2. Determine Version and Capacity
    const versionInfo = getMinimumVersion(config.data, mode, ecl, config.version);

    // 3. Encode Data into Codewords
    const dataCodewords = encodeData(config.data, versionInfo, mode);

    // 4. Generate Error Correction Codewords
    const eccCodewords = generateErrorCorrectionCodewords(dataCodewords, versionInfo);

    // 5. Initialize Matrix (Place Finder, Timing, Alignment Patterns)
    const { matrix: baseMatrix, reserved } = initializeMatrix(versionInfo.version);

    // 6. Place Data and ECC (Interleaved)
    placeData(baseMatrix, reserved, dataCodewords, eccCodewords, versionInfo);

    // 7. Masking (Find optimal mask)
    const { maskId, maskedMatrix } = chooseBestMask(baseMatrix, reserved);

    // 8. Finalize (Add Format and Version Info)
    const finalMatrix = finalizeMatrix(maskedMatrix, versionInfo.version, ecl, maskId);

    // 9. Apply Quiet Zone (Margin)
    if (quietZone > 0) {
        return applyQuietZone(finalMatrix, quietZone);
    }

    return finalMatrix;
}

/**
 * Helper to wrap the matrix in a white border (Quiet Zone).
 */
function applyQuietZone(matrix: QRMatrix, size: number): QRMatrix {
    const oldSize = matrix.length;
    const newSize = oldSize + size * 2;

    // Create new white matrix
    const newMatrix: QRMatrix = Array.from({ length: newSize }, () => Array(newSize).fill(false));

    // Copy the QR code into the center
    for (let r = 0; r < oldSize; r++) {
        for (let c = 0; c < oldSize; c++) {
            newMatrix[r + size][c + size] = matrix[r][c];
        }
    }

    return newMatrix;
}

// --- Renderers ---

/**
 * Renders the QR Matrix as a UTF-8 string using block characters.
 * Useful for console logging.
 */
export function renderToString(matrix: QRMatrix): string {
    return matrix
        .map((row) => {
            return row.map((cell) => (cell ? '██' : '  ')).join('');
        })
        .join('\n');
}

/**
 * Renders the QR Matrix as an SVG string (white background, black modules).
 * Adjacent dark modules in a row are merged into a single path segment.
 */
export function renderToSVG(matrix: QRMatrix, size: number = 300): string {
    const modCount = matrix.length;
    const modSize = size / modCount;

    let path = '';

    for (let r = 0; r < modCount; r++) {
        let c = 0;
        while (c < modCount) {
            if (!matrix[r][c]) {
                c++;
                continue;
            }
            const start = c;
            while (c < modCount && matrix[r][c]) {
                c++;
            }
            const width = (c - start) * modSize;
            path += `M${start * modSize},${r * modSize}h${width}v${modSize}h-${width}z`;
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`
        + `<rect width="${size}" height="${size}" fill="white"/>`
        + `<path d="${path}" fill="black"/>`
        + '</svg>';
}
