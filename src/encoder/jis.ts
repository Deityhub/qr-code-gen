import { FULL_SJIS_MAP } from './sjisMap';

/**
 * Converts a generic JS string character to its Shift JIS value.
 * Returns null if the character is not in the Shift JIS map.
 */
export function getShiftJISCode(char: string): number | null {
    const code = char.charCodeAt(0);
    return FULL_SJIS_MAP[code] || null;
}

/**
 * Validates if a string contains ONLY characters representable in QR Kanji Mode.
 * (Double-byte Shift JIS characters only).
 */
export function canEncodeAsKanji(data: string): boolean {
    for (const char of data) {
        const sjis = getShiftJISCode(char);
        if (!sjis) {
            return false;
        }

        // QR Kanji Mode only supports these two specific double-byte ranges:
        const validRange1 = sjis >= 0x8140 && sjis <= 0x9ffc;
        const validRange2 = sjis >= 0xe040 && sjis <= 0xebbf;

        if (!validRange1 && !validRange2) {
            return false;
        }
    }
    return true;
}

// /**
//  * A partial map of Unicode code points to Shift JIS hex codes.
//  * * INCLUDED:
//  * - Punctuation (、 。 ・)
//  * - Hiragana (3040-309F)
//  * - Katakana (30A0-30FF)
//  * * TODO: For full Kanji support (6000+ chars), this map needs to be populated
//  * with the full JIS X 0208 set.
//  */
// const SJIS_MAP: Record<number, number> = {
//     // --- Punctuation ---
//     0x3000: 0x8140, // Space
//     0x3001: 0x8141, // 、
//     0x3002: 0x8142, // 。
//     0x30fb: 0x8145, // ・
//     0x30fc: 0x815b, // ー (Long vowel)
//     0x301c: 0x8160, // ～

//     // --- Hiragana (Ranges mapped manually for compactness) ---
//     // 'ぁ' (0x3041) -> 0x829F ... 'ん' (0x3093) -> 0x82F1
//     ...createRangeMap(0x3041, 0x829f, 83),

//     // --- Katakana ---
//     // 'ァ' (0x30A1) -> 0x8340 ... 'ン' (0x30F3) -> 0x8393
//     ...createRangeMap(0x30a1, 0x8340, 86),
// };

// /**
//  * Helper to generate range mappings to keep file size small
//  */
// function createRangeMap(
//     unicodeStart: number,
//     sjisStart: number,
//     count: number,
// ): Record<number, number> {
//     const map: Record<number, number> = {};
//     for (let i = 0; i < count; i++) {
//         map[unicodeStart + i] = sjisStart + i;
//     }
//     return map;
// }

// /**
//  * Converts a generic JS string character to its Shift JIS value.
//  * Returns null if the character is not in the Shift JIS map.
//  */
// export function getShiftJISCode(char: string): number | null {
//     const code = char.charCodeAt(0);

//     // 1. Check strict map
//     if (SJIS_MAP[code]) {
//         return SJIS_MAP[code];
//     }

//     // 2. Fallback: ASCII is compatible with Shift JIS (0x20 - 0x7E)
//     // However, QR Kanji mode ONLY allows double-byte chars (0x81.. or 0xE0..).
//     // Single byte ASCII cannot be encoded in QR Kanji mode (must switch mode).
//     return null;
// }

// /**
//  * Validates if a string contains ONLY characters representable in QR Kanji Mode.
//  * (Double-byte Shift JIS characters only).
//  */
// export function canEncodeAsKanji(data: string): boolean {
//     for (const char of data) {
//         const sjis = getShiftJISCode(char);
//         if (!sjis) {
//             return false;
//         }

//         // QR Kanji Mode only supports these two specific double-byte ranges:
//         // Range 1: 0x8140 - 0x9FFC
//         // Range 2: 0xE040 - 0xEBBF
//         const validRange1 = sjis >= 0x8140 && sjis <= 0x9ffc;
//         const validRange2 = sjis >= 0xe040 && sjis <= 0xebbf;

//         if (!validRange1 && !validRange2) {
//             return false;
//         }
//     }
//     return true;
// }
