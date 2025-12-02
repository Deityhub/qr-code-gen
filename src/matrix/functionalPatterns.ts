import { ALIGNMENT_PATTERN_COORDS } from '../constants';
import { QRMatrix } from '../types';

/**
 * Returns a tuple containing:
 * 1. The QR Matrix (initialized with False/White)
 * 2. A "Reserved" Matrix (True = occupied by functional pattern, do not overwrite)
 */
export function initializeMatrix(version: number): { matrix: QRMatrix; reserved: boolean[][] } {
    const size = version * 4 + 17;

    // Create N x N matrices
    const matrix: QRMatrix = Array.from({ length: size }, () => Array(size).fill(false));
    const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Helper to set a module and mark it reserved
    const setModule = (r: number, c: number, value: boolean) => {
        if (r >= 0 && r < size && c >= 0 && c < size) {
            matrix[r][c] = value;
            reserved[r][c] = true;
        }
    };

    // Helper to draw a square ring
    const drawRect = (r: number, c: number, w: number, h: number, value: boolean) => {
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                setModule(r + i, c + j, value);
            }
        }
    };

    // --- 1. Finder Patterns ---
    // 7x7 outer black, 5x5 inner white, 3x3 inner black
    // Located at Top-Left, Top-Right, Bottom-Left
    const addFinder = (r: number, c: number) => {
        drawRect(r, c, 7, 7, true); // Outer Box (Black)
        drawRect(r + 1, c + 1, 5, 5, false); // Inner Ring (White)
        drawRect(r + 2, c + 2, 3, 3, true); // Inner Box (Black)
    };

    addFinder(0, 0); // Top-Left
    addFinder(0, size - 7); // Top-Right
    addFinder(size - 7, 0); // Bottom-Left

    // --- 2. Separators ---
    // White lines of width 1 around the Finder Patterns
    const addSeparator = (r: number, c: number, w: number, h: number) => {
        drawRect(r, c, w, h, false);
    };

    // Top-Left Separator
    addSeparator(7, 0, 8, 1);
    addSeparator(0, 7, 1, 8);

    // Top-Right Separator
    addSeparator(7, size - 8, 8, 1);
    addSeparator(0, size - 8, 1, 8);

    // Bottom-Left Separator
    addSeparator(size - 8, 0, 8, 1);
    addSeparator(size - 8, 7, 1, 8);

    // --- 3. Alignment Patterns ---
    // 5x5 patterns drawn at specific coordinates for V2+
    if (version > 1) {
        const coords = ALIGNMENT_PATTERN_COORDS[version];
        for (const r of coords) {
            for (const c of coords) {
                // Don't draw if it overlaps with Finder Patterns
                if (reserved[r][c]) {
                    continue;
                }

                // Alignment Pattern: 5x5 Black, 3x3 White, 1x1 Black
                // Coordinates provided are Centers. We need top-left.
                const tr = r - 2;
                const tc = c - 2;
                drawRect(tr, tc, 5, 5, true);
                drawRect(tr + 1, tc + 1, 3, 3, false);
                setModule(r, c, true);
            }
        }
    }

    // --- 4. Timing Patterns ---
    // Alternating Black/White tracks at Row 6 and Col 6
    for (let i = 8; i < size - 8; i++) {
        const val = i % 2 === 0;
        // Horizontal (Row 6)
        if (!reserved[6][i]) {
            setModule(6, i, val);
        }
        // Vertical (Col 6)
        if (!reserved[i][6]) {
            setModule(i, 6, val);
        }
    }

    // --- 5. Dark Module ---
    // Always black at (4 * V + 9, 8)
    setModule(4 * version + 9, 8, true);

    // --- 6. Reserve Format/Version Areas ---
    // We don't write data here yet, but we must mark them reserved so data bits skip them.

    // Format Info (around finders)
    // Vertical strip at Top-Left
    drawRect(0, 8, 1, 9, false); // reserve, value doesn't matter yet
    // Horizontal strip at Top-Left
    drawRect(8, 0, 9, 1, false);
    // Vertical strip at Bottom-Left
    drawRect(size - 7, 8, 1, 7, false);
    // Horizontal strip at Top-Right
    drawRect(8, size - 8, 8, 1, false);

    // Version Info (V7+) - 3x6 blocks near Top-Right and Bottom-Left
    if (version >= 7) {
        drawRect(0, size - 11, 3, 6, false); // Top-Right neighbor
        drawRect(size - 11, 0, 6, 3, false); // Bottom-Left neighbor
    }

    return { matrix, reserved };
}
