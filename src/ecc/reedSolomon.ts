// src/ecc/reedSolomon.ts
import { VersionInfo } from '../types';
import { gfPolyMultiply, gfPolyRemainder } from './galois';

// Cache generator polynomials to avoid re-calculating them for every QR code
const GENERATOR_CACHE: Record<number, number[]> = {};

/**
 * Creates the Generator Polynomial for a specific number of EC codewords.
 * G(x) = (x - 2^0) * (x - 2^1) * ... * (x - 2^(n-1))
 */
function getGeneratorPolynomial(numEcCodewords: number): number[] {
    if (GENERATOR_CACHE[numEcCodewords]) {
        return GENERATOR_CACHE[numEcCodewords];
    }

    let generator = [1]; // Start with 1

    for (let i = 0; i < numEcCodewords; i++) {
        // Multiply current generator by (x - 2^i)
        // In coefficient form, (x - a) is represented as [1, a]
        // Note: In QR, 'a' is 2^i, which we get using our Galois power logic (exponent base 2)
        // Actually, we can just use the antilog table logic indirectly or hardcode base 2.
        // The roots are 2^0, 2^1, 2^2... which are just 1, 2, 4... in integer value?
        // No, they are powers of alpha (2).

        // Since we don't have a direct 'pow' exported, we construct the root:
        // root = 2^i. Since 2 is the primitive element (alpha), 2^i is simply antilog(i).
        // However, we need to match the polynomial multiplication logic.

        // Let's rely on `gfPolyMultiply`.
        // We want to multiply by (x + 2^i) ... remember subtraction is addition (XOR)
        // The factor is [1, 2^i]

        // Wait, calculating 2^i in GF:
        let root = 1;
        for (let k = 0; k < i; k++) {
            root = root * 2 > 255 ? (root * 2) ^ 0x11d : root * 2;
        }

        generator = gfPolyMultiply(generator, [1, root]);
    }

    GENERATOR_CACHE[numEcCodewords] = generator;
    return generator;
}

/**
 * Generates the Error Correction Codewords for the given data.
 * IMPORTANT: QR Codes split data into blocks. We must generate ECC for *each block* individually.
 */
export function generateErrorCorrectionCodewords(
    dataCodewords: number[],
    versionInfo: VersionInfo,
): number[] {
    const allEccCodewords: number[] = [];

    let offset = 0;

    // Iterate through the block groups defined in the spec
    for (const blockGroup of versionInfo.blocks) {
        for (let i = 0; i < blockGroup.numBlocks; i++) {
            // 1. Slice the data for this specific block
            const dataBlock = dataCodewords.slice(
                offset,
                offset + blockGroup.dataCodewordsPerBlock,
            );
            offset += blockGroup.dataCodewordsPerBlock;

            // 2. Get the Generator Polynomial
            const generator = getGeneratorPolynomial(versionInfo.ecCodewordsPerBlock);

            // 3. Prepare the Message Polynomial
            // The message polynomial M(x) must be multiplied by x^n (shifted left by n),
            // where n is the number of EC codewords.
            // This is equivalent to padding the data array with n zeros.
            const messagePoly = [
                ...dataBlock,
                ...new Array(versionInfo.ecCodewordsPerBlock).fill(0),
            ];

            // 4. Perform Polynomial Division
            // The remainder of M(x) / G(x) is the ECC block.
            const eccBlock = gfPolyRemainder(messagePoly, generator);

            // 5. Add to result
            allEccCodewords.push(...eccBlock);
        }
    }

    return allEccCodewords;
}
