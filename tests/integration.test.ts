import { describe, expect, test } from 'vitest';
import { generateQRCode, renderToString } from '../src/index';

describe('Integration: generateQRCode', () => {
    test('Generates a Version 1 QR Code (Basic)', () => {
        const matrix = generateQRCode({
            data: 'TEST',
            version: 1,
            ecl: 'M',
        });

        // V1 is 21x21 modules
        // + 4 modules quiet zone on each side (total 8)
        // Expected size = 29
        expect(matrix.length).toBe(29);
        expect(matrix[0].length).toBe(29);

        // Verify Quiet Zone (Top Left pixel should be white)
        expect(matrix[0][0]).toBe(false);

        // Verify Finder Pattern (Top Left of actual QR)
        // The quiet zone is 4, so the QR starts at index 4,4
        // Finder pattern center is Black (True)
        // 4+3 = 7 (row), 4+3 = 7 (col) is center of finder? No, 3,3 relative to QR.
        // (4+0, 4+0) is top-left of finder (Black)
        expect(matrix[4][4]).toBe(true);
    });

    test('Handles Shift JIS Kanji Data End-to-End', () => {
        const hiragana = String.fromCharCode(0x3053, 0x3093); // "こん"
        const matrix = generateQRCode({
            data: hiragana,
            ecl: 'L',
        });

        // Just ensuring it runs without error and produces a matrix
        expect(matrix.length).toBeGreaterThan(0);
        // Optional: Render to string to manually inspect in test logs
        console.log(renderToString(matrix));
    });

    test('Respects specific version request', () => {
        const matrix = generateQRCode({
            data: 'A',
            version: 10, // Force V10
            ecl: 'M',
        });

        // V10 is 57x57
        // + 8 quiet zone = 65
        expect(matrix.length).toBe(65);
    });
});
