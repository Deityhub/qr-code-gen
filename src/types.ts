/**
 * Represents the final QR Code grid.
 * true = black (dark module)
 * false = white (light module)
 */
export type QRMatrix = boolean[][];

/**
 * Standard Error Correction Levels.
 * L = ~7% recovery
 * M = ~15% recovery
 * Q = ~25% recovery
 * H = ~30% recovery
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * Encoding modes supported by the QR standard.
 */
export type EncodingMode = 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji';

/**
 * Internal representation of Version and Capacity information.
 * Defines how many blocks of data and ECC codewords are required.
 */
export interface VersionInfo {
    version: number;
    totalCodewords: number; // The total capacity of the symbol (Data + ECC)
    ecCodewordsPerBlock: number; // How many error correction bytes per block
    blocks: {
        numBlocks: number; // Number of blocks in this group
        dataCodewordsPerBlock: number; // Number of data bytes per block
    }[];
    // Note: Some versions (like V5+ Level H) split blocks into two groups
    // with slightly different sizes. This array handles that.
}

export interface QRCodeConfig {
    /** The text data to encode */
    data: string;

    /** * QR Version (1-40).
     * If undefined, the smallest version that fits the data is automatically selected.
     */
    version?: number;

    /** * Error Correction Level.
     * Defaults to 'M'.
     */
    ecl?: ErrorCorrectionLevel;

    /** * Encoding Mode.
     * Defaults to 'Auto' (selects the most efficient mode based on input characters).
     */
    mode?: EncodingMode | 'Auto';

    /** * White space margin around the QR code in modules.
     * Defaults to 4.
     */
    quietZone?: number;
}
