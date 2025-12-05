# Changelog

All notable changes to this project will be documented in this file.

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
