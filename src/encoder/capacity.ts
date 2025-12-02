import { ErrorCorrectionLevel, VersionInfo } from '../types';
import { RS_BLOCK_INFO, getCountIndicatorLength, getMaxDataBits } from '../constants';
import { getDataBitLength } from './modeSelector';
import { CapacityError } from '../config';

/**
 * Finds the smallest QR Version that can hold the data.
 */
export function getMinimumVersion(
    data: string,
    mode: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji',
    ecl: ErrorCorrectionLevel,
    requestedVersion?: number,
): VersionInfo {
    const dataBitLength = getDataBitLength(data, mode);

    // If user requested a specific version, check only that one.
    // Otherwise, check V1 through V40.
    const startVersion = requestedVersion || 1;
    const endVersion = requestedVersion || 40;

    for (let version = startVersion; version <= endVersion; version++) {
        // 1. Calculate Overhead Bits (Mode Indicator + Count Indicator)
        // Note: Count Indicator length changes based on Version range
        const countIndicatorLen = getCountIndicatorLength(version, mode);
        const headerBits = 4 + countIndicatorLen;

        // 2. Total bits required = Header + Data
        // (Terminator bits are added later if space permits, but we just need to ensure data fits)
        const totalRequiredBits = headerBits + dataBitLength;

        // 3. Get Max Capacity for this Version/ECL
        const maxDataBits = getMaxDataBits(version, ecl);

        if (totalRequiredBits <= maxDataBits) {
            // Found a fit! Return the version info.
            return RS_BLOCK_INFO[version][ecl];
        }
    }

    if (requestedVersion) {
        throw new CapacityError(`Data too long for requested Version ${requestedVersion}.`);
    }
    throw new CapacityError('Data exceeds the maximum capacity of Version 40.');
}
