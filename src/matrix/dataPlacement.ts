import { VersionInfo, QRMatrix } from '../types';

/**
 * Interleaves the Data and ECC codewords according to the QR spec.
 * Returns a simple array of bits (0s and 1s).
 */
function interleaveCodewords(data: number[], ecc: number[], info: VersionInfo): number[] {
    // 1. Split input flat arrays back into Blocks
    const dataBlocks: number[][] = [];
    const eccBlocks: number[][] = [];

    let dataPtr = 0;
    let eccPtr = 0;

    for (const blockGroup of info.blocks) {
        for (let i = 0; i < blockGroup.numBlocks; i++) {
            dataBlocks.push(data.slice(dataPtr, dataPtr + blockGroup.dataCodewordsPerBlock));
            eccBlocks.push(ecc.slice(eccPtr, eccPtr + info.ecCodewordsPerBlock));

            dataPtr += blockGroup.dataCodewordsPerBlock;
            eccPtr += info.ecCodewordsPerBlock;
        }
    }

    // 2. Interleave Data Bytes
    // Take byte 0 from block 0, byte 0 from block 1, etc.
    const interleavedData: number[] = [];
    // Find the longest block to know when to stop
    const maxDataLen = Math.max(...dataBlocks.map((b) => b.length));

    for (let i = 0; i < maxDataLen; i++) {
        for (const block of dataBlocks) {
            if (i < block.length) {
                interleavedData.push(block[i]);
            }
        }
    }

    // 3. Interleave ECC Bytes
    const interleavedEcc: number[] = [];
    const maxEccLen = info.ecCodewordsPerBlock; // All blocks in a version usually have same ECC length

    for (let i = 0; i < maxEccLen; i++) {
        for (const block of eccBlocks) {
            if (i < block.length) {
                interleavedEcc.push(block[i]);
            }
        }
    }

    // 4. Combine and Convert to Bits
    const finalCodewords = [...interleavedData, ...interleavedEcc];
    const bits: number[] = [];

    for (const byte of finalCodewords) {
        for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    }

    // 5. Add Remainder Bits (if any required by this version)
    // The spec defines total bits for the matrix. Any empty spots left are "remainder bits" (0).
    // We handle this implicitly: placeData stops when bits run out,
    // but strict implementations pad with 0s if the capacity isn't perfectly full.
    // (Usually handled by initializing matrix to 0/False).

    return bits;
}

/**
 * Places the interleaved bits into the matrix using the serpentine pattern.
 * Mutates the passed matrix.
 */
export function placeData(
    matrix: QRMatrix,
    reserved: boolean[][],
    dataCodewords: number[],
    eccCodewords: number[],
    versionInfo: VersionInfo,
): void {
    const bitStream = interleaveCodewords(dataCodewords, eccCodewords, versionInfo);
    const size = matrix.length;
    let bitIndex = 0;

    // Start from bottom-right. Columns are visited in pairs (rightCol, rightCol - 1), moving left
    // by 2. The direction alternates for every pair (the first pair goes up), including across
    // the vertical timing column, which is skipped without affecting the alternation.
    let isUpwards = true;
    for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
        if (rightCol === 6) {
            rightCol -= 1;
        }

        const leftCol = rightCol - 1;

        for (let i = 0; i < size; i++) {
            const row = isUpwards ? size - 1 - i : i;
            // Visit right, then left
            processModule(row, rightCol);
            processModule(row, leftCol);
        }

        isUpwards = !isUpwards;
    }

    function processModule(r: number, c: number) {
        // If mark is reserved, skip
        if (reserved[r][c]) {
            return;
        }

        // Place bit
        let bit = 0;
        if (bitIndex < bitStream.length) {
            bit = bitStream[bitIndex];
            bitIndex++;
        }
        // Else: Remainder bits (default to 0/False, which is matrix default)

        matrix[r][c] = bit === 1;
    }
}
