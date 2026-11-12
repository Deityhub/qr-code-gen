import { QRCodeConfig } from './types';

/**
 * Thrown when the data is too large for the requested version or the maximum version (40).
 */
export class CapacityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CapacityError';
    }
}

/**
 * Thrown when characters invalid for the selected mode are encountered.
 */
export class EncodingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EncodingError';
    }
}

/**
 * Thrown when a style option is invalid or would make the code unreliable to scan.
 */
export class StyleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StyleError';
    }
}

/**
 * Default configuration values used when optional properties are omitted.
 */
export const DEFAULT_CONFIG: Required<Omit<QRCodeConfig, 'data' | 'version'>> = {
    ecl: 'M',
    mode: 'Auto',
    quietZone: 4,
};
