import { describe, expect, test } from 'vitest';
import { generateQRCode } from '../src/index';
import { RS_BLOCK_INFO, ECL_INDICATORS } from '../src/constants';
import { initializeMatrix } from '../src/matrix/functionalPatterns';
import { encodeData } from '../src/encoder/dataEncoder';
import { generateErrorCorrectionCodewords } from '../src/ecc/reedSolomon';
import { ErrorCorrectionLevel } from '../src/types';

// These tests read a finished symbol back the way a scanner does (ISO/IEC 18004 layout),
// independently of the code that writes it.

const MASKS = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number) => r % 2 === 0,
    (_r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

const LEVELS: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
const VERSIONS = [1, 2, 6, 7, 10, 23, 40];

// 15-bit format string for (level, mask): BCH(15,5) remainder with generator 0x537, XOR 0x5412.
function expectedFormat(ecl: ErrorCorrectionLevel, mask: number): number {
    const data = (ECL_INDICATORS[ecl] << 3) | mask;
    let rem = data << 10;
    for (let i = 14; i >= 10; i--) {
        if ((rem >> i) & 1) {
            rem ^= 0x537 << (i - 10);
        }
    }
    return ((data << 10) | rem) ^ 0x5412;
}

function bitsAt(matrix: boolean[][], cells: [number, number][]): number {
    return cells.reduce((acc, [r, c], i) => acc | ((matrix[r][c] ? 1 : 0) << i), 0);
}

function formatCopies(matrix: boolean[][]): [number, number] {
    const size = matrix.length;
    const copy1: [number, number][] = [];
    const copy2: [number, number][] = [];
    for (let i = 0; i < 15; i++) {
        // Copy 1: top-left, around the finder
        copy1.push(i < 6 ? [i, 8] : i === 6 ? [7, 8] : i === 7 ? [8, 8] : i === 8 ? [8, 7] : [8, 14 - i]);
        // Copy 2: split between the top-right and bottom-left finders
        copy2.push(i < 8 ? [8, size - 1 - i] : [size - 15 + i, 8]);
    }
    return [bitsAt(matrix, copy1), bitsAt(matrix, copy2)];
}

describe('symbol layout', () => {
    test.each(VERSIONS)('version %i: format info, timing patterns and dark module', (version) => {
        for (const ecl of LEVELS) {
            const matrix = generateQRCode({ data: 'A', version, ecl, quietZone: 0 });
            const size = matrix.length;

            const [copy1, copy2] = formatCopies(matrix);
            expect(copy1, `${version}-${ecl} copy 1`).toBe(copy2);
            const mask = ((copy1 ^ 0x5412) >> 10) & 7;
            expect(copy1, `${version}-${ecl}`).toBe(expectedFormat(ecl, mask));

            // The dark module is always dark and is not part of the format info
            expect(matrix[size - 8][8], `${version}-${ecl} dark module`).toBe(true);

            // Timing patterns alternate along row 6 and column 6 between the finders
            for (let i = 8; i < size - 8; i++) {
                expect(matrix[6][i], `${version}-${ecl} row timing ${i}`).toBe(i % 2 === 0);
                expect(matrix[i][6], `${version}-${ecl} col timing ${i}`).toBe(i % 2 === 0);
            }
        }
    });

    test.each(VERSIONS)('version %i: codewords read back in zigzag order match the encoder', (version) => {
        for (const ecl of LEVELS) {
            const data = '0123456789';
            const matrix = generateQRCode({ data, version, ecl, quietZone: 0, mode: 'Numeric' });
            const size = matrix.length;
            const info = RS_BLOCK_INFO[version][ecl];
            const { reserved } = initializeMatrix(version);

            const [format] = formatCopies(matrix);
            const mask = MASKS[((format ^ 0x5412) >> 10) & 7];

            // Standard zigzag read (direction taken from the column, not tracked across the timing column)
            const bits: number[] = [];
            for (let right = size - 1; right >= 1; right -= 2) {
                if (right === 6) {
                    right = 5;
                }
                for (let vert = 0; vert < size; vert++) {
                    for (let j = 0; j < 2; j++) {
                        const c = right - j;
                        const upward = ((right + 1) & 2) === 0;
                        const r = upward ? size - 1 - vert : vert;
                        if (!reserved[r][c]) {
                            bits.push(matrix[r][c] !== mask(r, c) ? 1 : 0);
                        }
                    }
                }
            }
            const codewords: number[] = [];
            for (let i = 0; i + 7 < bits.length; i += 8) {
                codewords.push(parseInt(bits.slice(i, i + 8).join(''), 2));
            }

            // De-interleave into blocks
            const blocks: number[][] = [];
            for (const group of info.blocks) {
                for (let i = 0; i < group.numBlocks; i++) {
                    blocks.push(Array(group.dataCodewordsPerBlock));
                }
            }
            let p = 0;
            const longest = Math.max(...blocks.map((b) => b.length));
            for (let i = 0; i < longest; i++) {
                for (const block of blocks) {
                    if (i < block.length) {
                        block[i] = codewords[p++];
                    }
                }
            }
            const readEcc: number[][] = blocks.map(() => Array(info.ecCodewordsPerBlock));
            for (let i = 0; i < info.ecCodewordsPerBlock; i++) {
                for (const block of readEcc) {
                    block[i] = codewords[p++];
                }
            }

            const expectedData = encodeData(data, info, 'Numeric');
            expect(blocks.flat(), `${version}-${ecl} data`).toEqual(expectedData);
            expect(readEcc.flat(), `${version}-${ecl} ecc`).toEqual(generateErrorCorrectionCodewords(expectedData, info));
        }
    });
});
