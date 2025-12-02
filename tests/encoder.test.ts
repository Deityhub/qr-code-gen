import { describe, expect, test } from 'vitest';
import { selectMode, getDataBitLength } from '../src/encoder/modeSelector';
import { encodeData } from '../src/encoder/dataEncoder';
import { getMinimumVersion } from '../src/encoder/capacity';
import { CapacityError } from '../src/config';

describe('Encoder: Mode Selection', () => {
    test('Auto-detects Numeric', () => {
        expect(selectMode('1234567890')).toBe('Numeric');
    });

    test('Auto-detects Alphanumeric', () => {
        expect(selectMode('HELLO WORLD 123')).toBe('Alphanumeric');
    });

    test('Auto-detects Byte (lower case)', () => {
        expect(selectMode('Hello World')).toBe('Byte');
    });

    test('Auto-detects Kanji (if SJIS map is present)', () => {
        // "こんにちは" - Hiragana
        const hiragana = String.fromCharCode(0x3053, 0x3093, 0x306b, 0x3061, 0x306f);
        expect(selectMode(hiragana)).toBe('Kanji');
    });

    test('Falls back to Byte for mixed/unknown chars', () => {
        const emoji = '👋'; // Not in Shift JIS
        expect(selectMode(emoji)).toBe('Byte');
    });
});

describe('Encoder: Bit Length Calculation', () => {
    test('Numeric: 3 digits = 10 bits', () => {
        expect(getDataBitLength('123', 'Numeric')).toBe(10);
    });

    test('Numeric: 1 digit = 4 bits', () => {
        expect(getDataBitLength('1', 'Numeric')).toBe(4);
    });

    test('Alphanumeric: 2 chars = 11 bits', () => {
        expect(getDataBitLength('AB', 'Alphanumeric')).toBe(11);
    });

    test('Byte: 8 bits per byte', () => {
        expect(getDataBitLength('A', 'Byte')).toBe(8);
        expect(getDataBitLength('AB', 'Byte')).toBe(16);
    });

    test('Kanji: 13 bits per char', () => {
        // "こ"
        const kanji = String.fromCharCode(0x3053);
        expect(getDataBitLength(kanji, 'Kanji')).toBe(13);
    });
});

describe('Encoder: Data Encoding & Padding', () => {
    // Version 1-M Capacity: 16 Data Codewords (bytes)
    const mockVersionInfo = {
        version: 1,
        totalCodewords: 26,
        ecCodewordsPerBlock: 10,
        blocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
    };

    test('Encodes Alphanumeric "AC" correctly', () => {
        // Mode: Alpha (0010)
        // Count (V1): 2 chars (9 bits) -> 000000010
        // Data "AC":
        // A=10, C=12. Val = 10*45 + 12 = 462. 11 bits -> 00111001110
        // Total Bits so far: 4 + 9 + 11 = 24 bits.

        // Expected Stream Start: 0010 000000010 00111001110
        // Hex start approx: 0x20 ...

        const codewords = encodeData('AC', mockVersionInfo, 'Alphanumeric');

        expect(codewords.length).toBe(16); // Must fill capacity

        // Verify first byte:
        // 0010 0000 -> 0x20
        expect(codewords[0]).toBe(0x20);

        // Verify Padding:
        // After data and terminator, it should pad with 0xEC and 0x11
        // We expect the end of the array to contain these
        const lastByte = codewords[15];
        // Since we have very little data, we expect plenty of padding.
        // The padding sequence is EC, 11, EC, 11...
        // Let's check the last few bytes
        expect([0xec, 0x11]).toContain(lastByte);
    });

    test('Encodes Byte Mode correctly', () => {
        const codewords = encodeData('A', mockVersionInfo, 'Byte');
        // Mode (0100) + Count (8 bits: 00000001) + Data (01000001) = 0x40, 0x14, 0x1...

        expect(codewords[0]).toBe(0x40); // 0100 0000
        expect(codewords[1]).toBe(0x14); // 0001 0100 (Count 1 + start of 'A')
    });
});

describe('Encoder: Capacity', () => {
    test('Calculates Minimum Version', () => {
        // "HELLO" fits in Version 1
        const vInfo = getMinimumVersion('HELLO', 'Alphanumeric', 'M');
        expect(vInfo.version).toBe(1);
    });

    test('Throws CapacityError for huge data', () => {
        const hugeData = 'A'.repeat(8000); // Too big for V40
        expect(() => getMinimumVersion(hugeData, 'Alphanumeric', 'H')).toThrow(CapacityError);
    });
});
