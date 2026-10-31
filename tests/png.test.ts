import { describe, expect, test } from 'vitest';
import { inflateSync } from 'node:zlib';
import { generateQRCode, renderToPng } from '../src/index';

// Independent CRC-32 so the chunk checksums are not validated with the encoder's own code
function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const b of bytes) {
        crc ^= b;
        for (let k = 0; k < 8; k++) {
            crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function readPng(png: Uint8Array) {
    expect(Array.from(png.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    const chunks: Record<string, Uint8Array> = {};
    const order: string[] = [];
    let pos = 8;
    while (pos < png.length) {
        const length = view.getUint32(pos);
        const type = String.fromCharCode(...png.slice(pos + 4, pos + 8));
        const data = png.slice(pos + 8, pos + 8 + length);
        expect(view.getUint32(pos + 8 + length), `${type} crc`).toBe(crc32(png.slice(pos + 4, pos + 8 + length)));
        chunks[type] = data;
        order.push(type);
        pos += 12 + length;
    }
    expect(pos).toBe(png.length);
    expect(order).toEqual(['IHDR', 'IDAT', 'IEND']);

    const ihdr = new DataView(chunks.IHDR.buffer, chunks.IHDR.byteOffset);
    const width = ihdr.getUint32(0);
    const height = ihdr.getUint32(4);
    expect(Array.from(chunks.IHDR.slice(8))).toEqual([1, 0, 0, 0, 0]); // 1-bit greyscale, no interlace

    // inflateSync also verifies the zlib Adler-32
    const raw = inflateSync(chunks.IDAT);
    const rowBytes = Math.ceil(width / 8);
    expect(raw.length).toBe((rowBytes + 1) * height);
    const pixel = (x: number, y: number) => (raw[y * (rowBytes + 1) + 1 + (x >> 3)] >> (7 - (x & 7))) & 1; // 1 = white
    return { width, height, pixel, filters: Array.from({ length: height }, (_, y) => raw[y * (rowBytes + 1)]) };
}

describe('renderToPng', () => {
    const matrix = generateQRCode({ data: 'https://qr.deityhub.com' });

    test('encodes the matrix pixel for pixel with a whole number of pixels per module', () => {
        const n = matrix.length;
        const png = renderToPng(matrix, 200);
        const { width, height, pixel, filters } = readPng(png);

        const scale = Math.max(1, Math.round(200 / n));
        expect(width).toBe(n * scale);
        expect(height).toBe(n * scale);
        expect(filters.every((f) => f === 0)).toBe(true);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dark = matrix[Math.floor(y / scale)][Math.floor(x / scale)];
                if (pixel(x, y) !== (dark ? 0 : 1)) {
                    throw new Error(`pixel ${x},${y} differs`);
                }
            }
        }
    });

    test('snaps the size to a whole multiple of the module count', () => {
        const n = matrix.length;
        expect(readPng(renderToPng(matrix, n * 6)).width).toBe(n * 6);
        expect(readPng(renderToPng(matrix, n * 6 + 3)).width).toBe(n * 6);
        expect(readPng(renderToPng(matrix, 1)).width).toBe(n); // never below one pixel per module
    });

    test('defaults to about 300px', () => {
        const n = matrix.length;
        expect(readPng(renderToPng(matrix)).width).toBe(n * Math.round(300 / n));
    });

    test('handles images larger than one stored deflate block', () => {
        const { width, pixel } = readPng(renderToPng(matrix, 1200)); // > 65535 bytes of pixel data
        expect(width).toBeGreaterThan(1000);
        expect(pixel(0, 0)).toBe(1); // quiet zone is white
        const scale = width / matrix.length;
        expect(pixel(4 * scale, 4 * scale)).toBe(0); // first finder pattern module is dark
    });
});
