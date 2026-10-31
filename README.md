# QR Code Generator

[![npm](https://img.shields.io/npm/v/@deityhub/qr-code-gen)](https://www.npmjs.com/package/@deityhub/qr-code-gen)
[![CI](https://github.com/Deityhub/qr-code-gen/actions/workflows/ci.yml/badge.svg)](https://github.com/Deityhub/qr-code-gen/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@deityhub/qr-code-gen)](./LICENSE)

**Live demo: [qr.deityhub.com](https://qr.deityhub.com)**: generate a QR code and download it as SVG or PNG.

A robust, zero-dependency, highly configurable QR code generator for TypeScript and JavaScript projects. It implements the QR Code specification (ISO/IEC 18004) with all versions (1-40), all four error correction levels and all four encoding modes. The output is verified against an independent reference encoder (see [Testing](#testing)).

## Features

- **Complete QR Code Implementation**: versions 1-40 with automatic version selection
- **All Encoding Modes**: Numeric, Alphanumeric, Byte (UTF-8) and Kanji, with automatic mode detection
- **Error Correction Levels**: L (~7%), M (~15%), Q (~25%), H (~30%)
- **Renderers**: compact SVG string and a console (block character) renderer; the raw matrix is available for any custom renderer (canvas, PNG, PDF, ...)
- **Zero Dependencies**: pure TypeScript
- **Full TypeScript Support**: typed config, matrix and error classes
- **Browser & Node.js**: ESM and UMD builds (Node 18+)

## Installation

### npm

```bash
npm install @deityhub/qr-code-gen
# or
yarn add @deityhub/qr-code-gen
```

### CDN (script tag)

```html
<script src="https://unpkg.com/@deityhub/qr-code-gen@2/dist/umd/qr-code-gen.min.js"></script>
```

The library is available as `window.QRCodeGen`. Pin a version (as above) so a future release can't change your page unexpectedly.

## Quick Start

```typescript
import { generateQRCode, renderToSVG } from '@deityhub/qr-code-gen';

const matrix = generateQRCode({ data: 'Hello, World!' });
const svg = renderToSVG(matrix, 300);
```

## API Reference

### `generateQRCode(config)`

Generates a QR code matrix.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `string` | required | The text to encode |
| `version` | `number` (1-40) | auto | Force a version. By default the smallest version that fits is used |
| `ecl` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `mode` | `'Auto' \| 'Numeric' \| 'Alphanumeric' \| 'Byte' \| 'Kanji'` | `'Auto'` | Encoding mode. `Auto` picks the most compact mode for the input |
| `quietZone` | `number` | `4` | Blank margin around the code, in modules |

Returns a `QRMatrix`: a square `boolean[][]` where `true` is a dark module. The quiet zone **is included** in the matrix, so its side length is `symbolSize + 2 * quietZone`, where `symbolSize = 4 * version + 17`.

Throws:

- `CapacityError`: the data doesn't fit the requested version (or version 40)
- `EncodingError`: the data contains characters that the requested mode can't encode

```typescript
import { generateQRCode, CapacityError, EncodingError } from '@deityhub/qr-code-gen';

try {
    generateQRCode({ data: 'abc', mode: 'Numeric' });
} catch (err) {
    if (err instanceof EncodingError) {
        console.error(err.message); // "Data contains non-numeric characters, but Numeric mode was requested."
    } else if (err instanceof CapacityError) {
        console.error(err.message);
    }
}
```

`DEFAULT_CONFIG` (the defaults above) is also exported, as are the `QRCodeConfig`, `QRMatrix`, `ErrorCorrectionLevel` and `EncodingMode` types.

### `renderToSVG(matrix, size?)`

Renders a matrix as an SVG string with a white background and black modules. Adjacent dark modules in a row are merged into one path segment to keep the output small.

- `matrix` (`QRMatrix`): the matrix from `generateQRCode`
- `size?` (`number`, default `300`): width and height of the SVG in pixels (the `viewBox`)

Returns the SVG markup as a `string`.

### `renderToString(matrix)`

Renders a matrix as a string of block characters (`██`), useful for console output. Returns a `string`.

## Examples

### Save an SVG (Node.js)

```typescript
import { writeFileSync } from 'node:fs';
import { generateQRCode, renderToSVG } from '@deityhub/qr-code-gen';

const matrix = generateQRCode({ data: 'https://example.com', ecl: 'Q' });
writeFileSync('qr.svg', renderToSVG(matrix, 512));
```

### Download a PNG (browser)

```typescript
import { generateQRCode, renderToSVG } from '@deityhub/qr-code-gen';

const matrix = generateQRCode({ data: 'https://example.com' });

// Use a whole number of pixels per module so every module is the same size
const pixelsPerModule = 8;
const size = matrix.length * pixelsPerModule;

const img = new Image();
img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d')!.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob!);
        a.download = 'qr-code.png';
        a.click();
    }, 'image/png');
};
img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderToSVG(matrix, size));
```

### Advanced configuration

```typescript
const matrix = generateQRCode({
    data: 'Important data that needs redundancy',
    ecl: 'H',      // 30% recovery
    version: 10,   // force a specific version
    quietZone: 4,  // keep at 4 for reliable scanning
});
```

### Console output

```typescript
import { generateQRCode, renderToString } from '@deityhub/qr-code-gen';

console.log(renderToString(generateQRCode({ data: 'Hello, World!' })));
```

### Encoding modes

```typescript
generateQRCode({ data: '1234567890', mode: 'Numeric' });       // digits only
generateQRCode({ data: 'ABC123 $%*+-./:', mode: 'Alphanumeric' }); // 0-9, A-Z, space and $%*+-./:
generateQRCode({ data: 'Hello, 世界!', mode: 'Byte' });          // any text, encoded as UTF-8
generateQRCode({ data: 'こんにちは', mode: 'Kanji' });            // Shift JIS double-byte characters
```

With `mode: 'Auto'` (the default) the order of preference is Numeric, Alphanumeric, Kanji, Byte. Note that Byte mode writes UTF-8 without an ECI header, which modern scanners detect automatically.

## Getting reliable scans

- **Keep the quiet zone at 4 modules** (the default). Smaller margins often fail to scan.
- **Draw every module with a whole number of pixels.** A size that isn't a multiple of `matrix.length` gives modules slightly different widths, which cameras read poorly. Prefer `size = matrix.length * n`.
- **Use a higher error correction level** (Q or H) for printed codes that may get scuffed. Higher levels make the code denser, so keep it large enough to scan.
- Keep strong contrast: dark modules on a light background.

## QR Code specifications

### Versions

Versions 1-40, from 21×21 to 177×177 modules (`4 * version + 17`), selected automatically unless `version` is set.

### Error correction levels

| Level | Recovery capacity |
|-------|-------------------|
| L     | ~7%               |
| M     | ~15%              |
| Q     | ~25%              |
| H     | ~30%              |

### Encoding modes

| Mode         | Character set                                   | Bits per character |
|--------------|-------------------------------------------------|--------------------|
| Numeric      | 0-9                                             | 3.33               |
| Alphanumeric | 0-9, A-Z, space and `$ % * + - . / :`           | 5.5                |
| Byte         | Any text, encoded as UTF-8                      | 8 per byte         |
| Kanji        | Shift JIS double-byte characters                | 13                 |

## Implementation details

### Architecture

```
src/
  index.ts          generateQRCode, renderToSVG, renderToString
  config.ts         DEFAULT_CONFIG, CapacityError, EncodingError
  types.ts          public types
  constants.ts      spec tables (block structure, alignment positions, indicators)
  encoder/          mode selection, capacity, data encoding, Shift JIS mapping
  ecc/              Galois field math and Reed-Solomon error correction
  matrix/           function patterns, data placement, masking, format/version info
site/               the demo site published at qr.deityhub.com
```

### How a code is built

1. Pick the encoding mode and the smallest version that fits the data
2. Encode the data into codewords and compute Reed-Solomon error correction per block
3. Draw the finder, timing and alignment patterns and reserve the format/version areas
4. Interleave the codewords and place them in the zigzag order
5. Try all eight masks, score each finished symbol with the four penalty rules, and keep the best
6. Write the format information (and version information from version 7) and add the quiet zone

## Demo site

[qr.deityhub.com](https://qr.deityhub.com) lets you:

- Enter any text or URL and see the QR code update as you type
- Set every library option: error correction, encoding mode, version and quiet zone
- Download the result as SVG or PNG at a chosen size
- Run entirely in the browser; nothing is sent to a server

![QR Code Generator Browser Demo](https://raw.githubusercontent.com/Deityhub/qr-code-gen/refs/heads/main/docs/demo-browser.png)

To run it locally:

```bash
npm install
npm run build:site   # builds the library and copies the bundle into site/
npx serve site
```

### Console output

![QR Code Generator Console Output](https://raw.githubusercontent.com/Deityhub/qr-code-gen/refs/heads/main/docs/demo-console.png)

## Development

```bash
npm install
npm run build        # library (ESM, CJS, types) and UMD bundle
npm run build:site   # build + copy the UMD bundle into site/
npm test             # run the tests
npm run test:coverage
npm run lint
```

### Testing

The tests cover mode selection, capacity, Reed-Solomon, and the symbol layout. The layout tests read a finished symbol back the way a scanner does (format information in both copies, timing patterns, the dark module and every codeword), independently of the code that writes it. The output has also been compared module by module against an independent encoder for every version, error correction level and input mode.

### CI and releases

- Pull requests and `main` run lint, tests and build on Node 18, 20 and 22
- Releases are automated with [release-please](https://github.com/googleapis/release-please): use [conventional commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, ...), merge the release PR it opens, and the package is published to npm with provenance
- The demo site is deployed to Cloudflare Pages when `site/` or `src/` change on `main`

## Contributing

Contributions are welcome! Please make sure:

1. Tests pass (`npm test`)
2. Code passes the linter (`npm run lint`)
3. New features include tests
4. Documentation is updated for any API change
5. Commit messages follow the conventional commit format

## Author

**Chizoba Jude Ojini** ([judeojini.com](https://judeojini.com))

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes.

## References

- [ISO/IEC 18004:2015 - QR Code Specification](https://www.iso.org/standard/62021.html)
- [Reed-Solomon Coding for Beginners](https://www.angelfire.com/planet/bytesal/rs/index.html)
