import { describe, expect, test } from 'vitest';
import { gfAdd, gfMultiply, gfDivide, gfPolyRemainder } from '../src/ecc/galois';
import { generateErrorCorrectionCodewords } from '../src/ecc/reedSolomon';

describe('ECC: Galois Field Arithmetic', () => {
    test('gfAdd (XOR)', () => {
        expect(gfAdd(0, 0)).toBe(0);
        expect(gfAdd(10, 10)).toBe(0); // 10 XOR 10 = 0
        expect(gfAdd(1, 2)).toBe(3); // 01 XOR 10 = 11 (3)
    });

    test('gfMultiply (Log/Antilog)', () => {
        expect(gfMultiply(0, 50)).toBe(0);
        expect(gfMultiply(1, 50)).toBe(50);
        // 3 (x+1) * 7 (x^2+x+1) = x^3 + ... in GF(2^8) = 9
        expect(gfMultiply(3, 7)).toBe(9);
    });

    test('gfDivide', () => {
        expect(gfDivide(50, 50)).toBe(1);
        expect(gfDivide(9, 7)).toBe(3); // Inverse of multiply
        expect(() => gfDivide(10, 0)).toThrow();
    });
});

describe('ECC: Polynomial Operations', () => {
    test('gfPolyRemainder calculates correct remainder', () => {
        // MANUAL CALCULATION TEST CASE
        // Let's divide x^2 by a known Generator (x^2 + 3x + 2)
        // 1. Divisor (Generator): [1, 3, 2]
        // 2. Dividend (Data '1' shifted by 2): x^2 -> [1, 0, 0]

        // Operation:
        // x^2 / (x^2 + 3x + 2)
        // = 1 with remainder (-3x - 2)
        // In GF(2^8), subtraction is XOR.
        // -3 becomes 3 (11), -2 becomes 2 (10).
        // Expected Remainder: 3x + 2 -> [3, 2]

        const dividend = [1, 0, 0];
        const divisor = [1, 3, 2];

        const remainder = gfPolyRemainder(dividend, divisor);

        expect(remainder).toEqual([3, 2]);
    });
});

describe('ECC: Reed-Solomon', () => {
    test('Generates correct ECC codewords for Version 1-M', () => {
        // V1-M has 16 data codewords and 10 ECC codewords.
        const data = Array(16).fill(0x10); // 16 bytes of 0x10
        const versionInfo = {
            version: 1,
            totalCodewords: 26,
            ecCodewordsPerBlock: 10,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
        };

        const ecc = generateErrorCorrectionCodewords(data, versionInfo);

        expect(ecc.length).toBe(10);
        // Basic sanity check: ensure it's not empty/zeros
        expect(ecc.some((byte) => byte !== 0)).toBe(true);
    });
});
