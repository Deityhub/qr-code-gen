import { QRMatrix } from '../types';

// The 8 Mask Pattern Functions defined by ISO 18004
// We use _ prefix for unused parameters to satisfy strict linters.
type MaskFunc = (r: number, c: number) => boolean;

const MASKS: MaskFunc[] = [
    (r, c) => (r + c) % 2 === 0,
    (r, _c) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/**
 * Calculates the penalty score for a QR matrix based on the 4 ISO rules.
 * Lower is better.
 */
function calculatePenalty(matrix: QRMatrix): number {
    const size = matrix.length;
    let score = 0;

    // --- Rule 1: 5+ consecutive modules of same color (Row/Col) ---
    // Penalty: 3 + (length - 5)
    for (let r = 0; r < size; r++) {
        let runRow = 1;
        let runCol = 1;
        for (let c = 1; c < size; c++) {
            // Check Row
            if (matrix[r][c] === matrix[r][c - 1]) {
                runRow++;
                if (runRow === 5) {
                    score += 3;
                }
                if (runRow > 5) {
                    score += 1;
                }
            } else {
                runRow = 1;
            }
            // Check Col (swap r/c access)
            if (matrix[c][r] === matrix[c - 1][r]) {
                runCol++;
                if (runCol === 5) {
                    score += 3;
                }
                if (runCol > 5) {
                    score += 1;
                }
            } else {
                runCol = 1;
            }
        }
    }

    // --- Rule 2: 2x2 blocks of same color ---
    // Penalty: 3 * (number of blocks)
    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const val = matrix[r][c];
            if (
                val === matrix[r][c + 1] &&
                val === matrix[r + 1][c] &&
                val === matrix[r + 1][c + 1]
            ) {
                score += 3;
            }
        }
    }

    // --- Rule 3: Patterns looking like Finder Patterns ---
    // Pattern: 1 0 1 1 1 0 1 (Dark-Light-D-D-D-L-D)
    // Needs 4 light modules on either side.
    // Penalty: 40 points per occurrence

    // Helper closure to check a single array (row or column)
    const checkRow = (row: boolean[]) => {
        // We look for sequence T F T T T F T
        for (let c = 0; c < size - 6; c++) {
            if (
                row[c] &&
                !row[c + 1] &&
                row[c + 2] &&
                row[c + 3] &&
                row[c + 4] &&
                !row[c + 5] &&
                row[c + 6]
            ) {
                // Found the core pattern. Check for 4 whites on left or right.
                const leftSafe =
                    c - 4 >= 0 && !row[c - 1] && !row[c - 2] && !row[c - 3] && !row[c - 4];
                const rightSafe =
                    c + 10 < size && !row[c + 7] && !row[c + 8] && !row[c + 9] && !row[c + 10];

                if (leftSafe || rightSafe) {
                    score += 40;
                }
            }
        }
    };

    // Check Rows
    for (let r = 0; r < size; r++) {
        checkRow(matrix[r]);
    }
    // Check Cols (transpose logic)
    for (let c = 0; c < size; c++) {
        const col: boolean[] = [];
        for (let r = 0; r < size; r++) {
            col.push(matrix[r][c]);
        }
        checkRow(col);
    }

    // --- Rule 4: Dark Module Ratio ---
    // Penalty: Based on deviation from 50%
    let darkCount = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                darkCount++;
            }
        }
    }
    const totalModules = size * size;
    const percent = (darkCount / totalModules) * 100;
    // Step: Previous multiple of 5 deviation from 50
    // e.g. 45% or 55% -> deviation 5 -> k=1 -> score 10
    const deviation = Math.abs(percent - 50);
    const k = Math.floor(deviation / 5);
    score += k * 10;

    return score;
}

/**
 * Tries all 8 masks and returns the best one (lowest penalty).
 */
export function chooseBestMask(
    baseMatrix: QRMatrix,
    reserved: boolean[][],
): { maskId: number; maskedMatrix: QRMatrix } {
    let bestScore = Infinity;
    let bestMaskId = 0;

    // Default to a copy of base in case something fails, though logic guarantees assignment
    let bestMatrix: QRMatrix = baseMatrix.map((row) => [...row]);

    const size = baseMatrix.length;

    for (let id = 0; id < 8; id++) {
        const maskFn = MASKS[id];

        // Clone matrix
        const testMatrix = baseMatrix.map((row) => [...row]);

        // Apply Mask
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                // Only invert if NOT reserved (i.e., only Data and ECC bits)
                if (!reserved[r][c]) {
                    if (maskFn(r, c)) {
                        testMatrix[r][c] = !testMatrix[r][c];
                    }
                }
            }
        }

        // Score
        const score = calculatePenalty(testMatrix);

        if (score < bestScore) {
            bestScore = score;
            bestMaskId = id;
            bestMatrix = testMatrix;
        }
    }

    return { maskId: bestMaskId, maskedMatrix: bestMatrix };
}
