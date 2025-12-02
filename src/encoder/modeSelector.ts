import { QRCodeConfig } from '../types';
import { ALPHANUMERIC_MAP } from '../constants';
import { EncodingError } from '../config';
import { canEncodeAsKanji } from './jis';

/**
 * Analyzes data to determine the optimal encoding mode.
 * Priority: Numeric > Alphanumeric > Kanji > Byte
 * * Note: 'Kanji' mode assumes the input string contains only characters
 * representable in Shift JIS (0x8140-0x9FFC and 0xE040-0xEBBF).
 */
export function selectMode(
    data: string,
    requestedMode: QRCodeConfig['mode'] = 'Auto',
): 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji' {
    // 1. Explicit Mode Request
    if (requestedMode !== 'Auto') {
        if (requestedMode === 'Numeric' && !isNumeric(data)) {
            throw new EncodingError(
                'Data contains non-numeric characters, but Numeric mode was requested.',
            );
        }
        if (requestedMode === 'Alphanumeric' && !isAlphanumeric(data)) {
            throw new EncodingError('Data contains characters invalid for Alphanumeric mode.');
        }
        if (requestedMode === 'Kanji' && !canEncodeAsKanji(data)) {
            // Warn if data doesn't look like Shift JIS compatible Kanji
            // In a production app, you might check against a real Shift JIS table here.
            console.warn(
                'Warning: Kanji mode requested, but data contains characters that may not map to Shift JIS.',
            );
        }
        return requestedMode;
    }

    // 2. Auto Detection Logic
    if (isNumeric(data)) {
        return 'Numeric';
    }
    if (isAlphanumeric(data)) {
        return 'Alphanumeric';
    }
    if (canEncodeAsKanji(data)) {
        return 'Kanji';
    }

    return 'Byte'; // Fallback for Mixed content / UTF-8
}

// --- Validation Helpers ---

function isNumeric(data: string): boolean {
    return /^\d+$/.test(data);
}

// TODO: check if there's a better way to do this
function isAlphanumeric(data: string): boolean {
    for (let i = 0; i < data.length; i++) {
        if (ALPHANUMERIC_MAP[data[i]] === undefined) {
            return false;
        }
    }
    return true;
}

// --- Bit Length Calculation ---

export function getDataBitLength(data: string, mode: string): number {
    const length = data.length;

    switch (mode) {
        case 'Numeric': {
            // 3 digits = 10 bits, 2 digits = 7 bits, 1 digit = 4 bits
            const groupsOf3 = Math.floor(length / 3);
            const remaining = length % 3;
            return groupsOf3 * 10 + (remaining === 2 ? 7 : remaining === 1 ? 4 : 0);
        }

        case 'Alphanumeric': {
            // 2 chars = 11 bits, 1 char = 6 bits
            const groupsOf2 = Math.floor(length / 2);
            return groupsOf2 * 11 + (length % 2) * 6;
        }

        case 'Byte':
            // 8 bits per byte (using TextEncoder for UTF-8 support)
            return new TextEncoder().encode(data).length * 8;

        case 'Kanji':
            // 13 bits per character
            // Note: This assumes the input string length equals the number of Kanji characters.
            return length * 13;

        default:
            return 0;
    }
}
