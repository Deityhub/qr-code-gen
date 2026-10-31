# Changelog

All notable changes to this project will be documented in this file.

## [2.2.0](https://github.com/Deityhub/qr-code-gen/compare/qr-code-gen-v2.1.0...qr-code-gen-v2.2.0) (2026-10-31)


### Features

* expose all QR options in the demo and render crisp modules ([cb7c208](https://github.com/Deityhub/qr-code-gen/commit/cb7c208944e058722d01d2c3154b2b732493cadb))
* expose all QR options in the demo and render crisp modules ([#13](https://github.com/Deityhub/qr-code-gen/issues/13)) ([5ebd44f](https://github.com/Deityhub/qr-code-gen/commit/5ebd44f4d14d62a8920753cf2ed668bd74a4e76c))


### Bug Fixes

* correct QR symbol layout and mask selection ([948f5ea](https://github.com/Deityhub/qr-code-gen/commit/948f5ea10f359fb76c39aa903117ca998f50aa98))
* correct QR symbol layout and mask selection ([032b5f8](https://github.com/Deityhub/qr-code-gen/commit/032b5f82a6948de4f5e90013608abd075e538930))
* correct version 40-L block structure ([51d9c88](https://github.com/Deityhub/qr-code-gen/commit/51d9c88bcd178bd18f4d3ad97dec73f43010e66e))
* correct version 40-L block structure ([421d0cc](https://github.com/Deityhub/qr-code-gen/commit/421d0ccb58b0f5c365cd8e5e632d566e0e5474b9))

## [2.1.0](https://github.com/Deityhub/qr-code-gen/compare/qr-code-gen-v2.0.0...qr-code-gen-v2.1.0) (2026-10-31)


### Features

* demo site with SVG/PNG download and SEO ([#4](https://github.com/Deityhub/qr-code-gen/issues/4)) ([7ffcf5b](https://github.com/Deityhub/qr-code-gen/commit/7ffcf5b4a18bdf81ad10294bdfd126c9cb234b33))
* setup QR code generator ([1fc36e9](https://github.com/Deityhub/qr-code-gen/commit/1fc36e9114c82d3a071cb4c8ced35890f8317ed5))


### Bug Fixes

* correct path for type definitions in package.json ([8c8c2aa](https://github.com/Deityhub/qr-code-gen/commit/8c8c2aa6f1f2451059130df24ff83026929e1cdf))
* merge runs and add background in renderToSVG ([2330f8d](https://github.com/Deityhub/qr-code-gen/commit/2330f8d27cc597af9f371935ae1eb3e33b623bad))
* merge runs and add background in renderToSVG ([019a229](https://github.com/Deityhub/qr-code-gen/commit/019a2295e96afd44072936ab0959927c138ce835))
* update package name to include scope ([3b56053](https://github.com/Deityhub/qr-code-gen/commit/3b560530aa2c467b24eda8c7b9296d904174231d))

## [2.0.0] - 2025-12-05

### Changed

- **BREAKING**: Streamlined build process by switching from TypeScript/Rollup to tsup
- Replaced multiple build scripts (`build:esm`, `build:cjs`, `build:umd`, `build:types`) with simplified `build:tsup` and `build:rollup`
- Updated package.json exports to use single entry points (`./dist/index.js` for CJS, `./dist/index.mjs` for ESM)
- Removed separate TypeScript config files (`tsconfig.esm.json`, `tsconfig.cjs.json`) in favor of unified `tsconfig.json`
- Deleted `rollup.types.config.js` and integrated type bundling into tsup
- Added `tsup` as build dependency and removed `rimraf`

### Technical Details

- Build now uses `tsup` for main library bundling (CJS + ESM + type definitions)
- Rollup remains for UMD bundle generation
- Simplified output structure: single `dist/` folder instead of separate `cjs/`, `esm/`, `types/` directories
- Type definitions now bundled automatically by tsup
- Improved build performance and reduced configuration complexity

## [1.0.1] - 2025-12-02

### Fixed

- Fixed CommonJS entry point configuration for better yarn/npm compatibility
- Updated package.json exports to properly support both ESM and CommonJS
- Added proper repository and homepage fields to package.json

### Changed

- Updated demo images to use GitHub raw URLs for better README rendering
- Improved package metadata with author email and repository links

## [0.1.0] - 2025-12-02

### Added

- Initial release of QR Code Generator library
- Full QR Code specification implementation (ISO/IEC 18004)
- Support for all QR code versions (1-40) with automatic version selection
- Complete encoding modes:
  - Numeric mode (most efficient for numbers)
  - Alphanumeric mode (A-Z, 0-9, and 9 special characters)
  - Byte mode (any data, UTF-8 compatible)
  - Kanji mode (Shift JIS characters)
- All error correction levels:
  - L (Low) - ~7% error recovery
  - M (Medium) - ~15% error recovery
  - Q (Quartile) - ~25% error recovery
  - H (High) - ~30% error recovery
- Built-in renderers:
  - SVG renderer with customizable size
  - Console renderer using UTF-8 block characters
- Reed-Solomon error correction implementation
- Comprehensive unit test suite with 22 tests
- Interactive browser demo at `src/example/demo.html`
- TypeScript support with full type definitions
- Zero dependencies implementation
- Multiple build formats:
  - ESM (ES Modules)
  - CJS (CommonJS)
  - UMD (Universal Module Definition)

### Features

- Automatic mode selection based on input data
- Configurable quiet zone size
- Masking pattern evaluation and selection
- Alignment pattern placement for all versions
- Format and version information pattern generation
- Browser and Node.js compatible
- Optimized for minimal bundle size

### Documentation

- Complete README with examples and API reference
- Interactive demo with real-time QR code generation
- Comprehensive test coverage for all components

---

*This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format.*
