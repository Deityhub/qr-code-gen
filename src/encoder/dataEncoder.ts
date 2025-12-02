import { VersionInfo } from '../types';
import { MODE_INDICATORS, getCountIndicatorLength, ALPHANUMERIC_MAP } from '../constants';
import { EncodingError } from '../config';
import { getShiftJISCode } from './jis';

const PAD0 = 0b11101100; // 0xEC (236)
const PAD1 = 0b00010001; // 0x11 (17)

/**
 * Encodes the data into a sequence of 8-bit codewords (bytes).
 * * @param data The raw string data.
 * @param versionInfo The specific version and block structure to fit into.
 * @param mode The encoding mode to use.
 */
export function encodeData(
    data: string,
    versionInfo: VersionInfo,
    mode: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji',
): number[] {
    const bitBuffer: number[] = [];

    // Helper to push bits
    const appendBits = (val: number, len: number) => {
        for (let i = len - 1; i >= 0; i--) {
            bitBuffer.push((val >> i) & 1);
        }
    };

    // --- 1. Mode Indicator (4 bits) ---
    appendBits(MODE_INDICATORS[mode], 4);

    // --- 2. Character Count Indicator ---
    const countBits = getCountIndicatorLength(versionInfo.version, mode);
    let lengthToWrite = data.length;

    if (mode === 'Byte') {
        // For Byte mode, length is the number of BYTES, not chars (for UTF-8 support)
        lengthToWrite = new TextEncoder().encode(data).length;
    }
    appendBits(lengthToWrite, countBits);

    // --- 3. Data Payload ---
    switch (mode) {
        case 'Numeric':
            for (let i = 0; i < data.length; i += 3) {
                const chunk = data.substr(i, 3);
                const val = parseInt(chunk, 10);
                if (chunk.length === 3) {
                    appendBits(val, 10);
                } else if (chunk.length === 2) {
                    appendBits(val, 7);
                } else {
                    appendBits(val, 4);
                }
            }
            break;

        case 'Alphanumeric':
            for (let i = 0; i < data.length; i += 2) {
                const c1 = ALPHANUMERIC_MAP[data[i]];
                const c2 = data[i + 1] ? ALPHANUMERIC_MAP[data[i + 1]] : -1;

                if (c2 !== -1) {
                    // 2 chars -> 11 bits (val = c1 * 45 + c2)
                    appendBits(c1 * 45 + c2, 11);
                } else {
                    // 1 char -> 6 bits
                    appendBits(c1, 6);
                }
            }
            break;

        case 'Byte': {
            const bytes = new TextEncoder().encode(data);
            bytes.forEach((b) => appendBits(b, 8));
            break;
        }

        case 'Kanji':
            // Kanji encoding is complex (Shift JIS conversion).
            for (const char of data) {
                const val = getShiftJISCode(char);

                if (!val) {
                    throw new EncodingError(`Character ${char} cannot be encoded in Kanji mode.`);
                }

                let encodedVal = 0;

                // Range 1: 0x8140 - 0x9FFC
                if (val >= 0x8140 && val <= 0x9ffc) {
                    encodedVal = val - 0x8140;
                }
                // Range 2: 0xE040 - 0xEBBF
                else if (val >= 0xe040 && val <= 0xebbf) {
                    encodedVal = val - 0xc140;
                } else {
                    throw new EncodingError(
                        `Invalid Shift JIS value 0x${val.toString(16)} for Kanji mode.`,
                    );
                }

                // Formula: (High Byte * 0xC0) + Low Byte
                const high = (encodedVal >> 8) & 0xff;
                const low = encodedVal & 0xff;
                const final13Bits = high * 0xc0 + low;

                appendBits(final13Bits, 13);
            }
            break;

        default:
            throw new EncodingError(`Unsupported encoding mode: ${mode}`);
    }

    // --- Calculate Capacity Limits ---
    // We need to know exactly how many *data codewords* (bytes) this version holds.
    // Total Codewords - Total ECC Codewords
    let totalDataCodewords = 0;
    versionInfo.blocks.forEach(
        (b) => (totalDataCodewords += b.numBlocks * b.dataCodewordsPerBlock),
    );
    const maxDataBits = totalDataCodewords * 8;

    // --- 4. Terminator ---
    // Append up to 4 zeros, but don't exceed max capacity
    const bitsAvailable = maxDataBits - bitBuffer.length;
    const terminatorLen = Math.min(4, bitsAvailable);
    appendBits(0, terminatorLen);

    // --- 5. Bit Padding ---
    // Pad with zeros to reach a multiple of 8
    while (bitBuffer.length % 8 !== 0) {
        bitBuffer.push(0);
    }

    // --- Convert Bits to Bytes (Codewords) ---
    const dataCodewords: number[] = [];
    for (let i = 0; i < bitBuffer.length; i += 8) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
            byte = (byte << 1) | bitBuffer[i + b];
        }
        dataCodewords.push(byte);
    }

    // --- 6. Codeword Padding ---
    // If we still haven't filled the capacity, append Pad Bytes (0xEC, 0x11)
    const padBytes = [PAD0, PAD1];
    let padIdx = 0;
    while (dataCodewords.length < totalDataCodewords) {
        dataCodewords.push(padBytes[padIdx % 2]);
        padIdx++;
    }

    return dataCodewords;
}
