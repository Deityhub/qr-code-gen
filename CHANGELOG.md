# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.1] - 2024-12-02

### Fixed

- Fixed CommonJS entry point configuration for better yarn/npm compatibility
- Updated package.json exports to properly support both ESM and CommonJS
- Added proper repository and homepage fields to package.json

### Changed

- Updated demo images to use GitHub raw URLs for better README rendering
- Improved package metadata with author email and repository links

## [0.1.0] - 2024-12-02

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
