import { describe, expect, test } from 'vitest';
import { RS_BLOCK_INFO } from '../src/constants';
import { ErrorCorrectionLevel } from '../src/types';

// Total codewords (data + EC) a symbol holds, from the ISO 18004 module counts.
function totalCodewords(version: number): number {
    let modules = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const align = Math.floor(version / 7) + 2;
        modules -= (25 * align - 10) * align - 55;
        if (version >= 7) {
            modules -= 36;
        }
    }
    return Math.floor(modules / 8);
}

describe('RS_BLOCK_INFO', () => {
    const levels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];

    test.each(Array.from({ length: 40 }, (_, i) => i + 1))('version %i blocks add up to the symbol capacity', (version) => {
        for (const ecl of levels) {
            const info = RS_BLOCK_INFO[version][ecl];
            const sum = info.blocks.reduce(
                (total, b) => total + b.numBlocks * (b.dataCodewordsPerBlock + info.ecCodewordsPerBlock),
                0,
            );
            expect(sum, `${version}-${ecl}`).toBe(totalCodewords(version));
            expect(info.totalCodewords, `${version}-${ecl}`).toBe(totalCodewords(version));
        }
    });
});
