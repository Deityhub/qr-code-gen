import { QRMatrix } from './types';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table.push(c >>> 0);
    }
    return table;
})();

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const b of bytes) {
        crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
    let a = 1;
    let b = 0;
    for (const byte of bytes) {
        a = (a + byte) % 65521;
        b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
}

function uint32(value: number): number[] {
    return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function concat(parts: Uint8Array[]): Uint8Array {
    const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
    const typeAndData = new Uint8Array(4 + data.length);
    for (let i = 0; i < 4; i++) {
        typeAndData[i] = type.charCodeAt(i);
    }
    typeAndData.set(data, 4);
    return concat([Uint8Array.from(uint32(data.length)), typeAndData, Uint8Array.from(uint32(crc32(typeAndData)))]);
}

// ponytail: zlib "stored" (uncompressed) blocks keep this dependency-free and synchronous;
// a 1-bit image is width*height/8 bytes (about 33 KB at 512px). Add fixed-Huffman
// compression here if file size ever matters.
function zlibStore(raw: Uint8Array): Uint8Array {
    const MAX_BLOCK = 0xffff;
    const parts: Uint8Array[] = [Uint8Array.of(0x78, 0x01)];
    for (let pos = 0; pos < raw.length; pos += MAX_BLOCK) {
        const block = raw.subarray(pos, pos + MAX_BLOCK);
        const isLast = pos + MAX_BLOCK >= raw.length;
        const len = block.length;
        parts.push(Uint8Array.of(isLast ? 1 : 0, len & 0xff, len >>> 8, ~len & 0xff, (~len >>> 8) & 0xff), block);
    }
    parts.push(Uint8Array.from(uint32(adler32(raw))));
    return concat(parts);
}

/**
 * Renders the QR Matrix as a PNG image (1-bit, black modules on white).
 *
 * Every module is drawn with the same whole number of pixels so the code stays sharp
 * and scans reliably, so the image side is `matrix.length * Math.max(1, Math.round(size / matrix.length))`
 * pixels: the closest whole multiple of the module count to `size`.
 *
 * @param matrix The QR matrix from `generateQRCode`
 * @param size Requested width/height in pixels (default 300)
 * @returns The PNG file contents
 */
export function renderToPng(matrix: QRMatrix, size: number = 300): Uint8Array {
    const modules = matrix.length;
    const scale = Math.max(1, Math.round(size / modules));
    const width = modules * scale;
    const rowBytes = Math.ceil(width / 8);

    // One filter byte (0 = none) followed by the packed pixels; 1 = white, 0 = black
    const raw = new Uint8Array((rowBytes + 1) * width);
    for (let y = 0; y < width; y++) {
        const row = matrix[Math.floor(y / scale)];
        const offset = y * (rowBytes + 1);
        raw.fill(0xff, offset + 1, offset + 1 + rowBytes);
        for (let x = 0; x < width; x++) {
            if (row[Math.floor(x / scale)]) {
                raw[offset + 1 + (x >> 3)] &= ~(0x80 >> (x & 7));
            }
        }
    }

    // IHDR: width, height, bit depth 1, colour type 0 (greyscale), default compression/filter, no interlace
    const ihdr = Uint8Array.from([...uint32(width), ...uint32(width), 1, 0, 0, 0, 0]);

    return concat([
        Uint8Array.from(PNG_SIGNATURE),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlibStore(raw)),
        chunk('IEND', new Uint8Array(0)),
    ]);
}
