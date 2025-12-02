import { ErrorCorrectionLevel, VersionInfo, EncodingMode } from './types';

// Maps Error Correction Level to the 2-bit indicator used in Format Info
// L = 01 (1), M = 00 (0), Q = 11 (3), H = 10 (2)
export const ECL_INDICATORS: Record<ErrorCorrectionLevel, number> = {
    L: 0b01,
    M: 0b00,
    Q: 0b11,
    H: 0b10,
};

// --- 1. Indicators ---

// Mode indicators (4 bits)
export const MODE_INDICATORS: Record<EncodingMode | 'Terminator', number> = {
    Numeric: 0b0001,
    Alphanumeric: 0b0010,
    Byte: 0b0100,
    Kanji: 0b1000,
    Terminator: 0b0000,
};

// Alphanumeric Character Map
export const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
export const ALPHANUMERIC_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHANUMERIC_CHARS.length; i++) {
    ALPHANUMERIC_MAP[ALPHANUMERIC_CHARS[i]] = i;
}

// --- 2. Character Count Indicator Bits ---

export function getCountIndicatorLength(version: number, mode: EncodingMode): number {
    if (version >= 1 && version <= 9) {
        switch (mode) {
            case 'Numeric':
                return 10;
            case 'Alphanumeric':
                return 9;
            case 'Byte':
                return 8;
            case 'Kanji':
                return 8;
        }
    } else if (version >= 10 && version <= 26) {
        switch (mode) {
            case 'Numeric':
                return 12;
            case 'Alphanumeric':
                return 11;
            case 'Byte':
                return 16;
            case 'Kanji':
                return 10;
        }
    } else if (version >= 27 && version <= 40) {
        switch (mode) {
            case 'Numeric':
                return 14;
            case 'Alphanumeric':
                return 13;
            case 'Byte':
                return 16;
            case 'Kanji':
                return 12;
        }
    }
    return 0;
}

// --- 3. Alignment Pattern Coordinates ---
// Center coordinates for alignment patterns (Versions 2-40)
export const ALIGNMENT_PATTERN_COORDS: Record<number, number[]> = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
    11: [6, 30, 54],
    12: [6, 32, 58],
    13: [6, 34, 62],
    14: [6, 26, 46, 66],
    15: [6, 26, 48, 70],
    16: [6, 26, 50, 74],
    17: [6, 30, 54, 78],
    18: [6, 30, 56, 82],
    19: [6, 30, 58, 86],
    20: [6, 34, 62, 90],
    21: [6, 28, 50, 72, 94],
    22: [6, 26, 50, 74, 98],
    23: [6, 30, 54, 78, 102],
    24: [6, 28, 54, 80, 106],
    25: [6, 32, 58, 84, 110],
    26: [6, 30, 58, 86, 114],
    27: [6, 34, 62, 90, 118],
    28: [6, 26, 50, 74, 98, 122],
    29: [6, 30, 54, 78, 102, 126],
    30: [6, 26, 52, 78, 104, 130],
    31: [6, 30, 56, 82, 108, 134],
    32: [6, 34, 60, 86, 112, 138],
    33: [6, 30, 58, 86, 114, 142],
    34: [6, 34, 62, 90, 118, 146],
    35: [6, 30, 54, 78, 102, 126, 150],
    36: [6, 24, 50, 76, 102, 128, 154],
    37: [6, 28, 54, 80, 106, 132, 158],
    38: [6, 32, 58, 84, 110, 136, 162],
    39: [6, 26, 54, 82, 110, 138, 166],
    40: [6, 30, 58, 86, 114, 142, 170],
};

// --- 4. Reed-Solomon Block Information (Full Capacity Table V1-V40) ---
// Structure: [Version][ECL] -> { version, totalCodewords, ecCodewordsPerBlock, blocks: [{num, data}, ...] }

export const RS_BLOCK_INFO: Record<number, Record<ErrorCorrectionLevel, VersionInfo>> = {
    1: {
        L: {
            version: 1,
            totalCodewords: 26,
            ecCodewordsPerBlock: 7,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 19 }],
        },
        M: {
            version: 1,
            totalCodewords: 26,
            ecCodewordsPerBlock: 10,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
        },
        Q: {
            version: 1,
            totalCodewords: 26,
            ecCodewordsPerBlock: 13,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 13 }],
        },
        H: {
            version: 1,
            totalCodewords: 26,
            ecCodewordsPerBlock: 17,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 9 }],
        },
    },
    2: {
        L: {
            version: 2,
            totalCodewords: 44,
            ecCodewordsPerBlock: 10,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 34 }],
        },
        M: {
            version: 2,
            totalCodewords: 44,
            ecCodewordsPerBlock: 16,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 28 }],
        },
        Q: {
            version: 2,
            totalCodewords: 44,
            ecCodewordsPerBlock: 22,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 22 }],
        },
        H: {
            version: 2,
            totalCodewords: 44,
            ecCodewordsPerBlock: 28,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
        },
    },
    3: {
        L: {
            version: 3,
            totalCodewords: 70,
            ecCodewordsPerBlock: 15,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 55 }],
        },
        M: {
            version: 3,
            totalCodewords: 70,
            ecCodewordsPerBlock: 26,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 44 }],
        },
        Q: {
            version: 3,
            totalCodewords: 70,
            ecCodewordsPerBlock: 18,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 17 }],
        },
        H: {
            version: 3,
            totalCodewords: 70,
            ecCodewordsPerBlock: 22,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 13 }],
        },
    },
    4: {
        L: {
            version: 4,
            totalCodewords: 100,
            ecCodewordsPerBlock: 20,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 80 }],
        },
        M: {
            version: 4,
            totalCodewords: 100,
            ecCodewordsPerBlock: 18,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 32 }],
        },
        Q: {
            version: 4,
            totalCodewords: 100,
            ecCodewordsPerBlock: 26,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 24 }],
        },
        H: {
            version: 4,
            totalCodewords: 100,
            ecCodewordsPerBlock: 16,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 9 }],
        },
    },
    5: {
        L: {
            version: 5,
            totalCodewords: 134,
            ecCodewordsPerBlock: 26,
            blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 108 }],
        },
        M: {
            version: 5,
            totalCodewords: 134,
            ecCodewordsPerBlock: 24,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 43 }],
        },
        Q: {
            version: 5,
            totalCodewords: 134,
            ecCodewordsPerBlock: 18,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 15 },
                { numBlocks: 2, dataCodewordsPerBlock: 16 },
            ],
        },
        H: {
            version: 5,
            totalCodewords: 134,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 11 },
                { numBlocks: 2, dataCodewordsPerBlock: 12 },
            ],
        },
    },
    6: {
        L: {
            version: 6,
            totalCodewords: 172,
            ecCodewordsPerBlock: 18,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 68 }],
        },
        M: {
            version: 6,
            totalCodewords: 172,
            ecCodewordsPerBlock: 16,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 27 }],
        },
        Q: {
            version: 6,
            totalCodewords: 172,
            ecCodewordsPerBlock: 24,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 19 }],
        },
        H: {
            version: 6,
            totalCodewords: 172,
            ecCodewordsPerBlock: 28,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 15 }],
        },
    },
    7: {
        L: {
            version: 7,
            totalCodewords: 196,
            ecCodewordsPerBlock: 20,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 78 }],
        },
        M: {
            version: 7,
            totalCodewords: 196,
            ecCodewordsPerBlock: 18,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 31 }],
        },
        Q: {
            version: 7,
            totalCodewords: 196,
            ecCodewordsPerBlock: 18,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 14 },
                { numBlocks: 4, dataCodewordsPerBlock: 15 },
            ],
        },
        H: {
            version: 7,
            totalCodewords: 196,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 13 },
                { numBlocks: 1, dataCodewordsPerBlock: 14 },
            ],
        },
    },
    8: {
        L: {
            version: 8,
            totalCodewords: 242,
            ecCodewordsPerBlock: 24,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 97 }],
        },
        M: {
            version: 8,
            totalCodewords: 242,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 38 },
                { numBlocks: 2, dataCodewordsPerBlock: 39 },
            ],
        },
        Q: {
            version: 8,
            totalCodewords: 242,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 18 },
                { numBlocks: 2, dataCodewordsPerBlock: 19 },
            ],
        },
        H: {
            version: 8,
            totalCodewords: 242,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 14 },
                { numBlocks: 2, dataCodewordsPerBlock: 15 },
            ],
        },
    },
    9: {
        L: {
            version: 9,
            totalCodewords: 292,
            ecCodewordsPerBlock: 30,
            blocks: [{ numBlocks: 2, dataCodewordsPerBlock: 116 }],
        },
        M: {
            version: 9,
            totalCodewords: 292,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 36 },
                { numBlocks: 2, dataCodewordsPerBlock: 37 },
            ],
        },
        Q: {
            version: 9,
            totalCodewords: 292,
            ecCodewordsPerBlock: 20,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 16 },
                { numBlocks: 4, dataCodewordsPerBlock: 17 },
            ],
        },
        H: {
            version: 9,
            totalCodewords: 292,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 12 },
                { numBlocks: 4, dataCodewordsPerBlock: 13 },
            ],
        },
    },
    10: {
        L: {
            version: 10,
            totalCodewords: 346,
            ecCodewordsPerBlock: 18,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 68 },
                { numBlocks: 2, dataCodewordsPerBlock: 69 },
            ],
        },
        M: {
            version: 10,
            totalCodewords: 346,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 43 },
                { numBlocks: 1, dataCodewordsPerBlock: 44 },
            ],
        },
        Q: {
            version: 10,
            totalCodewords: 346,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 19 },
                { numBlocks: 2, dataCodewordsPerBlock: 20 },
            ],
        },
        H: {
            version: 10,
            totalCodewords: 346,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 15 },
                { numBlocks: 2, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    11: {
        L: {
            version: 11,
            totalCodewords: 404,
            ecCodewordsPerBlock: 20,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 81 }],
        },
        M: {
            version: 11,
            totalCodewords: 404,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 1, dataCodewordsPerBlock: 50 },
                { numBlocks: 4, dataCodewordsPerBlock: 51 },
            ],
        },
        Q: {
            version: 11,
            totalCodewords: 404,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 22 },
                { numBlocks: 4, dataCodewordsPerBlock: 23 },
            ],
        },
        H: {
            version: 11,
            totalCodewords: 404,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 12 },
                { numBlocks: 8, dataCodewordsPerBlock: 13 },
            ],
        },
    },
    12: {
        L: {
            version: 12,
            totalCodewords: 466,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 92 },
                { numBlocks: 2, dataCodewordsPerBlock: 93 },
            ],
        },
        M: {
            version: 12,
            totalCodewords: 466,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 36 },
                { numBlocks: 2, dataCodewordsPerBlock: 37 },
            ],
        },
        Q: {
            version: 12,
            totalCodewords: 466,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 20 },
                { numBlocks: 6, dataCodewordsPerBlock: 21 },
            ],
        },
        H: {
            version: 12,
            totalCodewords: 466,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 7, dataCodewordsPerBlock: 14 },
                { numBlocks: 4, dataCodewordsPerBlock: 15 },
            ],
        },
    },
    13: {
        L: {
            version: 13,
            totalCodewords: 532,
            ecCodewordsPerBlock: 26,
            blocks: [{ numBlocks: 4, dataCodewordsPerBlock: 107 }],
        },
        M: {
            version: 13,
            totalCodewords: 532,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 8, dataCodewordsPerBlock: 37 },
                { numBlocks: 1, dataCodewordsPerBlock: 38 },
            ],
        },
        Q: {
            version: 13,
            totalCodewords: 532,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 8, dataCodewordsPerBlock: 20 },
                { numBlocks: 4, dataCodewordsPerBlock: 21 },
            ],
        },
        H: {
            version: 13,
            totalCodewords: 532,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 12, dataCodewordsPerBlock: 11 },
                { numBlocks: 4, dataCodewordsPerBlock: 12 },
            ],
        },
    },
    14: {
        L: {
            version: 14,
            totalCodewords: 581,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 115 },
                { numBlocks: 1, dataCodewordsPerBlock: 116 },
            ],
        },
        M: {
            version: 14,
            totalCodewords: 581,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 40 },
                { numBlocks: 5, dataCodewordsPerBlock: 41 },
            ],
        },
        Q: {
            version: 14,
            totalCodewords: 581,
            ecCodewordsPerBlock: 20,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 16 },
                { numBlocks: 5, dataCodewordsPerBlock: 17 },
            ],
        },
        H: {
            version: 14,
            totalCodewords: 581,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 12 },
                { numBlocks: 5, dataCodewordsPerBlock: 13 },
            ],
        },
    },
    15: {
        L: {
            version: 15,
            totalCodewords: 655,
            ecCodewordsPerBlock: 22,
            blocks: [
                { numBlocks: 5, dataCodewordsPerBlock: 87 },
                { numBlocks: 1, dataCodewordsPerBlock: 88 },
            ],
        },
        M: {
            version: 15,
            totalCodewords: 655,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 5, dataCodewordsPerBlock: 41 },
                { numBlocks: 5, dataCodewordsPerBlock: 42 },
            ],
        },
        Q: {
            version: 15,
            totalCodewords: 655,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 5, dataCodewordsPerBlock: 24 },
                { numBlocks: 7, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 15,
            totalCodewords: 655,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 12 },
                { numBlocks: 7, dataCodewordsPerBlock: 13 },
            ],
        },
    },
    16: {
        L: {
            version: 16,
            totalCodewords: 733,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 5, dataCodewordsPerBlock: 98 },
                { numBlocks: 1, dataCodewordsPerBlock: 99 },
            ],
        },
        M: {
            version: 16,
            totalCodewords: 733,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 7, dataCodewordsPerBlock: 45 },
                { numBlocks: 3, dataCodewordsPerBlock: 46 },
            ],
        },
        Q: {
            version: 16,
            totalCodewords: 733,
            ecCodewordsPerBlock: 24,
            blocks: [
                { numBlocks: 15, dataCodewordsPerBlock: 19 },
                { numBlocks: 2, dataCodewordsPerBlock: 20 },
            ],
        },
        H: {
            version: 16,
            totalCodewords: 733,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 15 },
                { numBlocks: 13, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    17: {
        L: {
            version: 17,
            totalCodewords: 815,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 1, dataCodewordsPerBlock: 107 },
                { numBlocks: 5, dataCodewordsPerBlock: 108 },
            ],
        },
        M: {
            version: 17,
            totalCodewords: 815,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 10, dataCodewordsPerBlock: 46 },
                { numBlocks: 1, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 17,
            totalCodewords: 815,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 1, dataCodewordsPerBlock: 22 },
                { numBlocks: 15, dataCodewordsPerBlock: 23 },
            ],
        },
        H: {
            version: 17,
            totalCodewords: 815,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 14 },
                { numBlocks: 17, dataCodewordsPerBlock: 15 },
            ],
        },
    },
    18: {
        L: {
            version: 18,
            totalCodewords: 901,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 5, dataCodewordsPerBlock: 120 },
                { numBlocks: 1, dataCodewordsPerBlock: 121 },
            ],
        },
        M: {
            version: 18,
            totalCodewords: 901,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 9, dataCodewordsPerBlock: 43 },
                { numBlocks: 4, dataCodewordsPerBlock: 44 },
            ],
        },
        Q: {
            version: 18,
            totalCodewords: 901,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 17, dataCodewordsPerBlock: 22 },
                { numBlocks: 1, dataCodewordsPerBlock: 23 },
            ],
        },
        H: {
            version: 18,
            totalCodewords: 901,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 14 },
                { numBlocks: 19, dataCodewordsPerBlock: 15 },
            ],
        },
    },
    19: {
        L: {
            version: 19,
            totalCodewords: 991,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 113 },
                { numBlocks: 4, dataCodewordsPerBlock: 114 },
            ],
        },
        M: {
            version: 19,
            totalCodewords: 991,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 44 },
                { numBlocks: 11, dataCodewordsPerBlock: 45 },
            ],
        },
        Q: {
            version: 19,
            totalCodewords: 991,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 17, dataCodewordsPerBlock: 21 },
                { numBlocks: 4, dataCodewordsPerBlock: 22 },
            ],
        },
        H: {
            version: 19,
            totalCodewords: 991,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 9, dataCodewordsPerBlock: 13 },
                { numBlocks: 16, dataCodewordsPerBlock: 14 },
            ],
        },
    },
    20: {
        L: {
            version: 20,
            totalCodewords: 1085,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 107 },
                { numBlocks: 5, dataCodewordsPerBlock: 108 },
            ],
        },
        M: {
            version: 20,
            totalCodewords: 1085,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 41 },
                { numBlocks: 13, dataCodewordsPerBlock: 42 },
            ],
        },
        Q: {
            version: 20,
            totalCodewords: 1085,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 15, dataCodewordsPerBlock: 24 },
                { numBlocks: 5, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 20,
            totalCodewords: 1085,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 15, dataCodewordsPerBlock: 15 },
                { numBlocks: 10, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    21: {
        L: {
            version: 21,
            totalCodewords: 1156,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 116 },
                { numBlocks: 4, dataCodewordsPerBlock: 117 },
            ],
        },
        M: {
            version: 21,
            totalCodewords: 1156,
            ecCodewordsPerBlock: 26,
            blocks: [{ numBlocks: 17, dataCodewordsPerBlock: 42 }],
        },
        Q: {
            version: 21,
            totalCodewords: 1156,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 17, dataCodewordsPerBlock: 22 },
                { numBlocks: 6, dataCodewordsPerBlock: 23 },
            ],
        },
        H: {
            version: 21,
            totalCodewords: 1156,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 19, dataCodewordsPerBlock: 16 },
                { numBlocks: 6, dataCodewordsPerBlock: 17 },
            ],
        },
    },
    22: {
        L: {
            version: 22,
            totalCodewords: 1258,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 111 },
                { numBlocks: 7, dataCodewordsPerBlock: 112 },
            ],
        },
        M: {
            version: 22,
            totalCodewords: 1258,
            ecCodewordsPerBlock: 28,
            blocks: [{ numBlocks: 17, dataCodewordsPerBlock: 46 }],
        },
        Q: {
            version: 22,
            totalCodewords: 1258,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 7, dataCodewordsPerBlock: 24 },
                { numBlocks: 16, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 22,
            totalCodewords: 1258,
            ecCodewordsPerBlock: 24,
            blocks: [{ numBlocks: 34, dataCodewordsPerBlock: 13 }],
        },
    },
    23: {
        L: {
            version: 23,
            totalCodewords: 1364,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 121 },
                { numBlocks: 5, dataCodewordsPerBlock: 122 },
            ],
        },
        M: {
            version: 23,
            totalCodewords: 1364,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 47 },
                { numBlocks: 14, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 23,
            totalCodewords: 1364,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 24 },
                { numBlocks: 14, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 23,
            totalCodewords: 1364,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 16, dataCodewordsPerBlock: 15 },
                { numBlocks: 14, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    24: {
        L: {
            version: 24,
            totalCodewords: 1474,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 117 },
                { numBlocks: 4, dataCodewordsPerBlock: 118 },
            ],
        },
        M: {
            version: 24,
            totalCodewords: 1474,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 45 },
                { numBlocks: 14, dataCodewordsPerBlock: 46 },
            ],
        },
        Q: {
            version: 24,
            totalCodewords: 1474,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 24 },
                { numBlocks: 16, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 24,
            totalCodewords: 1474,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 30, dataCodewordsPerBlock: 16 },
                { numBlocks: 2, dataCodewordsPerBlock: 17 },
            ],
        },
    },
    25: {
        L: {
            version: 25,
            totalCodewords: 1588,
            ecCodewordsPerBlock: 26,
            blocks: [
                { numBlocks: 8, dataCodewordsPerBlock: 106 },
                { numBlocks: 4, dataCodewordsPerBlock: 107 },
            ],
        },
        M: {
            version: 25,
            totalCodewords: 1588,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 8, dataCodewordsPerBlock: 47 },
                { numBlocks: 13, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 25,
            totalCodewords: 1588,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 7, dataCodewordsPerBlock: 24 },
                { numBlocks: 22, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 25,
            totalCodewords: 1588,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 22, dataCodewordsPerBlock: 15 },
                { numBlocks: 13, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    26: {
        L: {
            version: 26,
            totalCodewords: 1706,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 10, dataCodewordsPerBlock: 114 },
                { numBlocks: 2, dataCodewordsPerBlock: 115 },
            ],
        },
        M: {
            version: 26,
            totalCodewords: 1706,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 19, dataCodewordsPerBlock: 46 },
                { numBlocks: 4, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 26,
            totalCodewords: 1706,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 28, dataCodewordsPerBlock: 22 },
                { numBlocks: 6, dataCodewordsPerBlock: 23 },
            ],
        },
        H: {
            version: 26,
            totalCodewords: 1706,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 33, dataCodewordsPerBlock: 16 },
                { numBlocks: 4, dataCodewordsPerBlock: 17 },
            ],
        },
    },
    27: {
        L: {
            version: 27,
            totalCodewords: 1828,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 8, dataCodewordsPerBlock: 122 },
                { numBlocks: 4, dataCodewordsPerBlock: 123 },
            ],
        },
        M: {
            version: 27,
            totalCodewords: 1828,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 22, dataCodewordsPerBlock: 45 },
                { numBlocks: 3, dataCodewordsPerBlock: 46 },
            ],
        },
        Q: {
            version: 27,
            totalCodewords: 1828,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 8, dataCodewordsPerBlock: 23 },
                { numBlocks: 26, dataCodewordsPerBlock: 24 },
            ],
        },
        H: {
            version: 27,
            totalCodewords: 1828,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 12, dataCodewordsPerBlock: 15 },
                { numBlocks: 28, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    28: {
        L: {
            version: 28,
            totalCodewords: 1921,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 117 },
                { numBlocks: 10, dataCodewordsPerBlock: 118 },
            ],
        },
        M: {
            version: 28,
            totalCodewords: 1921,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 3, dataCodewordsPerBlock: 45 },
                { numBlocks: 23, dataCodewordsPerBlock: 46 },
            ],
        },
        Q: {
            version: 28,
            totalCodewords: 1921,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 24 },
                { numBlocks: 31, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 28,
            totalCodewords: 1921,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 15 },
                { numBlocks: 31, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    29: {
        L: {
            version: 29,
            totalCodewords: 2051,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 7, dataCodewordsPerBlock: 116 },
                { numBlocks: 7, dataCodewordsPerBlock: 117 },
            ],
        },
        M: {
            version: 29,
            totalCodewords: 2051,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 21, dataCodewordsPerBlock: 45 },
                { numBlocks: 7, dataCodewordsPerBlock: 46 },
            ],
        },
        Q: {
            version: 29,
            totalCodewords: 2051,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 1, dataCodewordsPerBlock: 23 },
                { numBlocks: 37, dataCodewordsPerBlock: 24 },
            ],
        },
        H: {
            version: 29,
            totalCodewords: 2051,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 19, dataCodewordsPerBlock: 15 },
                { numBlocks: 26, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    30: {
        L: {
            version: 30,
            totalCodewords: 2185,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 5, dataCodewordsPerBlock: 115 },
                { numBlocks: 10, dataCodewordsPerBlock: 116 },
            ],
        },
        M: {
            version: 30,
            totalCodewords: 2185,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 19, dataCodewordsPerBlock: 47 },
                { numBlocks: 10, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 30,
            totalCodewords: 2185,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 15, dataCodewordsPerBlock: 24 },
                { numBlocks: 25, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 30,
            totalCodewords: 2185,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 23, dataCodewordsPerBlock: 15 },
                { numBlocks: 25, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    31: {
        L: {
            version: 31,
            totalCodewords: 2323,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 13, dataCodewordsPerBlock: 115 },
                { numBlocks: 3, dataCodewordsPerBlock: 116 },
            ],
        },
        M: {
            version: 31,
            totalCodewords: 2323,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 46 },
                { numBlocks: 29, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 31,
            totalCodewords: 2323,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 42, dataCodewordsPerBlock: 24 },
                { numBlocks: 1, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 31,
            totalCodewords: 2323,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 23, dataCodewordsPerBlock: 15 },
                { numBlocks: 28, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    32: {
        L: {
            version: 32,
            totalCodewords: 2465,
            ecCodewordsPerBlock: 30,
            blocks: [{ numBlocks: 17, dataCodewordsPerBlock: 115 }],
        },
        M: {
            version: 32,
            totalCodewords: 2465,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 10, dataCodewordsPerBlock: 46 },
                { numBlocks: 23, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 32,
            totalCodewords: 2465,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 10, dataCodewordsPerBlock: 24 },
                { numBlocks: 35, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 32,
            totalCodewords: 2465,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 19, dataCodewordsPerBlock: 15 },
                { numBlocks: 35, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    33: {
        L: {
            version: 33,
            totalCodewords: 2611,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 17, dataCodewordsPerBlock: 115 },
                { numBlocks: 1, dataCodewordsPerBlock: 116 },
            ],
        },
        M: {
            version: 33,
            totalCodewords: 2611,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 14, dataCodewordsPerBlock: 46 },
                { numBlocks: 21, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 33,
            totalCodewords: 2611,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 29, dataCodewordsPerBlock: 24 },
                { numBlocks: 19, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 33,
            totalCodewords: 2611,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 11, dataCodewordsPerBlock: 15 },
                { numBlocks: 46, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    34: {
        L: {
            version: 34,
            totalCodewords: 2761,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 13, dataCodewordsPerBlock: 115 },
                { numBlocks: 6, dataCodewordsPerBlock: 116 },
            ],
        },
        M: {
            version: 34,
            totalCodewords: 2761,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 14, dataCodewordsPerBlock: 46 },
                { numBlocks: 23, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 34,
            totalCodewords: 2761,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 44, dataCodewordsPerBlock: 24 },
                { numBlocks: 7, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 34,
            totalCodewords: 2761,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 59, dataCodewordsPerBlock: 16 },
                { numBlocks: 1, dataCodewordsPerBlock: 17 },
            ],
        },
    },
    35: {
        L: {
            version: 35,
            totalCodewords: 2876,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 12, dataCodewordsPerBlock: 121 },
                { numBlocks: 7, dataCodewordsPerBlock: 122 },
            ],
        },
        M: {
            version: 35,
            totalCodewords: 2876,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 12, dataCodewordsPerBlock: 47 },
                { numBlocks: 26, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 35,
            totalCodewords: 2876,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 39, dataCodewordsPerBlock: 24 },
                { numBlocks: 14, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 35,
            totalCodewords: 2876,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 22, dataCodewordsPerBlock: 15 },
                { numBlocks: 41, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    36: {
        L: {
            version: 36,
            totalCodewords: 3034,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 121 },
                { numBlocks: 14, dataCodewordsPerBlock: 122 },
            ],
        },
        M: {
            version: 36,
            totalCodewords: 3034,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 6, dataCodewordsPerBlock: 47 },
                { numBlocks: 34, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 36,
            totalCodewords: 3034,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 46, dataCodewordsPerBlock: 24 },
                { numBlocks: 10, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 36,
            totalCodewords: 3034,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 2, dataCodewordsPerBlock: 15 },
                { numBlocks: 64, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    37: {
        L: {
            version: 37,
            totalCodewords: 3196,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 17, dataCodewordsPerBlock: 122 },
                { numBlocks: 4, dataCodewordsPerBlock: 123 },
            ],
        },
        M: {
            version: 37,
            totalCodewords: 3196,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 29, dataCodewordsPerBlock: 46 },
                { numBlocks: 14, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 37,
            totalCodewords: 3196,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 49, dataCodewordsPerBlock: 24 },
                { numBlocks: 10, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 37,
            totalCodewords: 3196,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 24, dataCodewordsPerBlock: 15 },
                { numBlocks: 46, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    38: {
        L: {
            version: 38,
            totalCodewords: 3362,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 4, dataCodewordsPerBlock: 122 },
                { numBlocks: 18, dataCodewordsPerBlock: 123 },
            ],
        },
        M: {
            version: 38,
            totalCodewords: 3362,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 13, dataCodewordsPerBlock: 46 },
                { numBlocks: 32, dataCodewordsPerBlock: 47 },
            ],
        },
        Q: {
            version: 38,
            totalCodewords: 3362,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 48, dataCodewordsPerBlock: 24 },
                { numBlocks: 14, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 38,
            totalCodewords: 3362,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 42, dataCodewordsPerBlock: 15 },
                { numBlocks: 32, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    39: {
        L: {
            version: 39,
            totalCodewords: 3532,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 20, dataCodewordsPerBlock: 117 },
                { numBlocks: 4, dataCodewordsPerBlock: 118 },
            ],
        },
        M: {
            version: 39,
            totalCodewords: 3532,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 40, dataCodewordsPerBlock: 47 },
                { numBlocks: 7, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 39,
            totalCodewords: 3532,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 43, dataCodewordsPerBlock: 24 },
                { numBlocks: 22, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 39,
            totalCodewords: 3532,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 10, dataCodewordsPerBlock: 15 },
                { numBlocks: 67, dataCodewordsPerBlock: 16 },
            ],
        },
    },
    40: {
        L: {
            version: 40,
            totalCodewords: 3706,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 19, dataCodewordsPerBlock: 127 },
                { numBlocks: 6, dataCodewordsPerBlock: 128 },
            ],
        },
        M: {
            version: 40,
            totalCodewords: 3706,
            ecCodewordsPerBlock: 28,
            blocks: [
                { numBlocks: 18, dataCodewordsPerBlock: 47 },
                { numBlocks: 31, dataCodewordsPerBlock: 48 },
            ],
        },
        Q: {
            version: 40,
            totalCodewords: 3706,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 34, dataCodewordsPerBlock: 24 },
                { numBlocks: 34, dataCodewordsPerBlock: 25 },
            ],
        },
        H: {
            version: 40,
            totalCodewords: 3706,
            ecCodewordsPerBlock: 30,
            blocks: [
                { numBlocks: 20, dataCodewordsPerBlock: 15 },
                { numBlocks: 61, dataCodewordsPerBlock: 16 },
            ],
        },
    },
};

// --- Helper: Get Max Data Bits ---
export function getMaxDataBits(version: number, ecl: ErrorCorrectionLevel): number {
    const info = RS_BLOCK_INFO[version]?.[ecl];
    if (!info) {
        return 0;
    }

    let totalDataCodewords = 0;
    for (const block of info.blocks) {
        totalDataCodewords += block.numBlocks * block.dataCodewordsPerBlock;
    }
    return totalDataCodewords * 8;
}
