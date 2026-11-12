import { describe, expect, test } from 'vitest';
import { ALIGNMENT_PATTERN_COORDS } from '../src/constants';
import {
    StyleError,
    analyzeStyle,
    generateQRCode,
    generateQRSymbol,
    renderToStyledSVG,
} from '../src/index';

const PNG_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Reads the dark modules back out of the module path of a default-style SVG: "M{x},{y}h{w}v1h-{w}z"
function darkCellsFromRuns(svg: string): Set<string> {
    const cells = new Set<string>();
    const path = /<path d="([^"]*)" fill="#000000" shape-rendering="crispEdges"\/>/.exec(svg);
    expect(path).not.toBeNull();
    for (const [, x, y, w] of path![1].matchAll(/M(\d+),(\d+)h(\d+)v1h-\d+z/g)) {
        for (let i = 0; i < Number(w); i++) {
            cells.add(`${Number(x) + i},${y}`);
        }
    }
    return cells;
}

describe('generateQRSymbol', () => {
    test('returns the matrix with the details used to build it', () => {
        const symbol = generateQRSymbol({ data: 'https://judeojini.com', ecl: 'Q', quietZone: 2 });
        expect(symbol.matrix).toEqual(generateQRCode({ data: 'https://judeojini.com', ecl: 'Q', quietZone: 2 }));
        expect(symbol).toMatchObject({ ecl: 'Q', quietZone: 2, mode: 'Byte' });
        expect(symbol.modules).toBe(symbol.version * 4 + 17);
        expect(symbol.matrix.length).toBe(symbol.modules + 4);
    });

    test('reports no quiet zone when it is 0', () => {
        const symbol = generateQRSymbol({ data: '1', quietZone: 0 });
        expect(symbol.quietZone).toBe(0);
        expect(symbol.matrix.length).toBe(symbol.modules);
    });
});

describe('renderToStyledSVG: default style', () => {
    const symbol = generateQRSymbol({ data: 'https://judeojini.com' });
    const svg = renderToStyledSVG(symbol);

    test('is a sized svg in module units on a white background', () => {
        const n = symbol.matrix.length;
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).toContain(`viewBox="0 0 ${n} ${n}" width="300" height="300"`);
        expect(svg).toContain(`<rect width="${n}" height="${n}" fill="#ffffff"/>`);
    });

    test('draws exactly the dark modules outside the corner squares', () => {
        const q = symbol.quietZone;
        const m = symbol.modules;
        const inCorner = (r: number, c: number) => {
            const rr = r - q;
            const cc = c - q;
            return (rr < 7 && cc < 7) || (rr < 7 && cc >= m - 7) || (rr >= m - 7 && cc < 7);
        };
        // Alignment patterns are drawn as separate solid squares
        const centres = (ALIGNMENT_PATTERN_COORDS[symbol.version] ?? []).flatMap((r) => ALIGNMENT_PATTERN_COORDS[symbol.version].map((c) => [r, c]));
        const inAlignment = (r: number, c: number) =>
            centres.some(([ar, ac]) => !(ar < 8 && ac < 8) && !(ar < 8 && ac >= m - 8) && !(ar >= m - 8 && ac < 8) && Math.abs(r - q - ar) <= 2 && Math.abs(c - q - ac) <= 2);
        const expected = new Set<string>();
        symbol.matrix.forEach((row, r) => row.forEach((dark, c) => dark && !inCorner(r, c) && !inAlignment(r, c) && expected.add(`${c},${r}`)));
        expect(darkCellsFromRuns(svg)).toEqual(expected);
    });

    test('draws the three corner squares as frames and balls', () => {
        const evenOdd = [...svg.matchAll(/<path d="([^"]*)" fill="#000000" fill-rule="evenodd"\/>/g)];
        const frames = evenOdd[evenOdd.length - 1][1]; // the corner square frames come after the alignment squares
        expect(frames.match(/M/g)!.length).toBe(6); // 3 outer + 3 inner outlines
        expect(svg).toContain(`M${symbol.quietZone + 2},${symbol.quietZone + 2}h3v3h-3z`);
    });
});

describe('renderToStyledSVG: alignment patterns', () => {
    test('are solid squares whatever the module shape, so scanners can find them', () => {
        const symbol = generateQRSymbol({ data: 'https://judeojini.com/a/longer/path' }); // version >= 2
        expect(symbol.version).toBeGreaterThanOrEqual(2);
        for (const shape of ['square', 'rounded', 'dots', 'diamond'] as const) {
            const svg = renderToStyledSVG(symbol, { modules: { shape, scale: 0.8 } });
            const alignment = /<path d="((?:M\d+,\d+h5v5h-5zM\d+,\d+h3v3h-3zM\d+,\d+h1v1h-1z)+)" fill="#000000" fill-rule="evenodd"\/>/.exec(svg);
            expect(alignment, shape).not.toBeNull();
            // version 2-6 have exactly one alignment pattern
            if (symbol.version <= 6) {
                expect(alignment![1].match(/h5v5/g)!.length).toBe(1);
            }
        }
    });

    test('are not drawn for version 1', () => {
        const symbol = generateQRSymbol({ data: '1', ecl: 'L' });
        expect(symbol.version).toBe(1);
        expect(renderToStyledSVG(symbol)).not.toMatch(/h5v5h-5zM\d+,\d+h3v3h-3zM\d+,\d+h1v1h-1z/);
    });
});

describe('renderToStyledSVG: colours and gradients', () => {
    const symbol = generateQRSymbol({ data: 'hello' });

    test('applies solid colours and a transparent background', () => {
        const svg = renderToStyledSVG(symbol, { foreground: 'rgb(14, 123, 247)', background: 'transparent' });
        expect(svg).toContain('fill="#0e7bf7"');
        expect(svg).not.toContain('fill="#ffffff"');
    });

    test('parses hex, hsl and basic names; keeps alpha', () => {
        expect(renderToStyledSVG(symbol, { foreground: '#00f' })).toContain('fill="#0000ff"');
        expect(renderToStyledSVG(symbol, { foreground: 'hsl(0, 100%, 50%)' })).toContain('fill="#ff0000"');
        expect(renderToStyledSVG(symbol, { foreground: 'navy' })).toContain('fill="#000080"');
        expect(renderToStyledSVG(symbol, { foreground: '#00000080' })).toContain('fill-opacity="0.502"');
    });

    test('writes a linear gradient definition and references it', () => {
        const svg = renderToStyledSVG(symbol, {
            foreground: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }] },
        });
        const id = /<linearGradient id="([^"]+)"/.exec(svg)![1];
        expect(svg).toContain(`fill="url(#${id})"`);
        expect(svg).toContain('gradientUnits="userSpaceOnUse"');
        expect(svg).toContain('stop-color="#ff0000"');
        expect(svg).toContain('stop-color="#0000ff"');
    });

    test('supports radial gradients and a separate corner square colour', () => {
        const svg = renderToStyledSVG(symbol, {
            foreground: { type: 'radial', stops: [{ offset: 0, color: '#fff000' }, { offset: 1, color: '#000000' }] },
            eyes: { frame: { color: '#ff0000' }, ball: { color: '#00aa00' } },
        });
        expect(svg).toContain('<radialGradient');
        expect(svg).toContain('fill="#ff0000" fill-rule="evenodd"');
        expect(svg).toContain('fill="#00aa00"');
    });
});

describe('renderToStyledSVG: shapes', () => {
    const symbol = generateQRSymbol({ data: 'hello' });
    const dark = symbol.matrix.flat().filter(Boolean).length;

    test('draws one shape per data module', () => {
        const svg = renderToStyledSVG(symbol, { modules: { shape: 'dots' } });
        const modules = /<path d="([^"]*)" fill="#000000"\/>/.exec(svg)![1];
        const corners = 3 * 7 * 7 - 3 * (7 * 7 - 33); // finder dark modules: 33 each (ring 24 + ball 9)
        expect(modules.match(/M/g)!.length).toBe(dark - 3 * 33);
        expect(corners).toBeGreaterThan(0);
    });

    test('rounded, dots and diamond use curves/diagonals; scale shrinks the module', () => {
        expect(renderToStyledSVG(symbol, { modules: { shape: 'rounded' } })).toContain('a0.3,0.3');
        expect(renderToStyledSVG(symbol, { modules: { shape: 'dots' } })).toContain('a0.5,0.5');
        expect(renderToStyledSVG(symbol, { modules: { shape: 'diamond' } })).toContain('l0.5,0.5');
        expect(renderToStyledSVG(symbol, { modules: { shape: 'dots', scale: 0.8 } })).toContain('a0.4,0.4');
    });

    test('clamps the scale to 0.6-1', () => {
        expect(renderToStyledSVG(symbol, { modules: { shape: 'dots', scale: 0.1 } })).toContain('a0.3,0.3');
        expect(renderToStyledSVG(symbol, { modules: { shape: 'dots', scale: 5 } })).toContain('a0.5,0.5');
    });

    test('draws round and rounded corner squares', () => {
        expect(renderToStyledSVG(symbol, { eyes: { frame: { shape: 'circle' }, ball: { shape: 'circle' } } })).toContain('a3.5,3.5');
        expect(renderToStyledSVG(symbol, { eyes: { frame: { shape: 'rounded' }, ball: { shape: 'rounded' } } })).toContain('a2,2');
    });

    test('rounds the corners of the background', () => {
        expect(renderToStyledSVG(symbol, { cornerRadius: 3 })).toMatch(/<rect [^>]*rx="3"/);
    });
});

describe('renderToStyledSVG: validation and safety', () => {
    const symbol = generateQRSymbol({ data: 'hello', ecl: 'H' });

    test.each([
        ['red" onload="alert(1)'],
        ['url(javascript:alert(1))'],
        ['#12345'],
        ['rgb(1,2,3);x'],
        ['<script>'],
        ['notacolour'],
    ])('rejects the colour %s', (color) => {
        expect(() => renderToStyledSVG(symbol, { foreground: color })).toThrow(StyleError);
        expect(() => renderToStyledSVG(symbol, { background: color })).toThrow(StyleError);
        expect(() => renderToStyledSVG(symbol, { eyes: { frame: { color } } })).toThrow(StyleError);
    });

    test('rejects bad gradients and unknown shapes', () => {
        expect(() => renderToStyledSVG(symbol, { foreground: { type: 'linear', stops: [{ offset: 0, color: 'red' }] } })).toThrow(/2 and 8/);
        expect(() => renderToStyledSVG(symbol, { foreground: { type: 'linear', stops: [{ offset: 2, color: 'red' }, { offset: 1, color: 'blue' }] } })).toThrow(/offset/);
        expect(() => renderToStyledSVG(symbol, { modules: { shape: 'star' as never } })).toThrow(StyleError);
        expect(() => renderToStyledSVG(symbol, { eyes: { ball: { shape: 'hexagon' as never } } })).toThrow(StyleError);
    });

    test.each([
        [['javascript', 'alert(1)'].join(':')],
        ['http://judeojini.com/logo.png'],
        ['data:text/html;base64,PHNjcmlwdD4='],
        [`${PNG_LOGO}" onload="alert(1)`],
        ['https://judeojini.com/a"onload="x'],
        ['https://judeojini.com/a b'],
    ])('rejects the logo href %s', (href) => {
        expect(() => renderToStyledSVG(symbol, { logo: { href } })).toThrow(/logo.href/);
    });

    test('escapes an https logo URL', () => {
        const bigger = generateQRSymbol({ data: 'https://judeojini.com/a/longer/path', ecl: 'H' });
        const svg = renderToStyledSVG(bigger, { logo: { href: 'https://judeojini.com/a.png?x=1&y=2' } });
        expect(svg).toContain('href="https://judeojini.com/a.png?x=1&amp;y=2"');
        expect(svg).not.toMatch(/&y=2/);
    });

    test('requires a symbol from generateQRSymbol', () => {
        expect(() => renderToStyledSVG({ matrix: [[true]] } as never)).toThrow(StyleError);
    });
});

describe('logo', () => {
    test('hides the modules under the logo and embeds the image', () => {
        const symbol = generateQRSymbol({ data: 'https://judeojini.com/a/longer/path', ecl: 'H' });
        const plain = renderToStyledSVG(symbol);
        const withLogo = renderToStyledSVG(symbol, { logo: { href: PNG_LOGO, size: 0.2 } });
        expect(withLogo).toContain(`<image href="${PNG_LOGO}" xlink:href="${PNG_LOGO}"`);
        const analysis = analyzeStyle(symbol, { logo: { href: PNG_LOGO, size: 0.2 } });
        expect(analysis.logoCoverage).toBeGreaterThan(0);
        expect(analysis.errors).toEqual([]);
        expect(withLogo.length).toBeLessThan(plain.length + PNG_LOGO.length * 2 + 400);

        // No module path run may cross the hidden square in the middle
        const centre = Math.floor(symbol.matrix.length / 2);
        const path = /<path d="([^"]*)" fill="#000000" shape-rendering="crispEdges"\/>/.exec(withLogo)![1];
        for (const [, x, y, w] of path.matchAll(/M(\d+),(\d+)h(\d+)v1h-\d+z/g)) {
            if (Number(y) === centre) {
                const end = Number(x) + Number(w);
                expect(Number(x) <= centre && end > centre).toBe(false);
            }
        }
    });

    test('crops the logo to a circle', () => {
        const symbol = generateQRSymbol({ data: 'https://judeojini.com/a/longer/path', ecl: 'H' });
        const svg = renderToStyledSVG(symbol, { logo: { href: PNG_LOGO, shape: 'circle', background: '#ffffff' } });
        expect(svg).toContain('<clipPath');
        expect(svg).toMatch(/clip-path="url\(#qrclip\d+\)"/);
    });

    test('needs level Q or H', () => {
        const symbol = generateQRSymbol({ data: 'https://judeojini.com/a/longer/path', ecl: 'M' });
        expect(() => renderToStyledSVG(symbol, { logo: { href: PNG_LOGO } })).toThrow(/level Q or H/);
    });

    test('rejects a logo that hides too much, unless strict is off', () => {
        const symbol = generateQRSymbol({ data: 'https://judeojini.com/a/longer/path', ecl: 'Q' });
        const style = { logo: { href: PNG_LOGO, size: 0.3 } };
        const analysis = analyzeStyle(symbol, style);
        expect(analysis.errors.length).toBeGreaterThan(0);
        expect(() => renderToStyledSVG(symbol, style)).toThrow(StyleError);
        expect(renderToStyledSVG(symbol, { ...style, strict: false })).toContain('<image');
    });

    test('rejects a logo that would reach the corner squares', () => {
        const symbol = generateQRSymbol({ data: '1', ecl: 'H' }); // version 1
        const analysis = analyzeStyle(symbol, { logo: { href: PNG_LOGO, size: 0.3, margin: 4 } });
        expect(analysis.errors.join(' ')).toMatch(/corner square/);
    });
});

describe('analyzeStyle', () => {
    const symbol = generateQRSymbol({ data: 'hello' });

    test('black on white is fine', () => {
        const analysis = analyzeStyle(symbol);
        expect(analysis.contrastRatio).toBeCloseTo(21, 0);
        expect(analysis.warnings).toEqual([]);
        expect(analysis.errors).toEqual([]);
        expect(analysis.logoCoverage).toBe(0);
    });

    test('warns about low contrast, inverted colours, transparency and small modules', () => {
        expect(analyzeStyle(symbol, { foreground: '#aaaaaa' }).warnings.join(' ')).toMatch(/Low contrast/);
        expect(analyzeStyle(symbol, { foreground: '#ffffff', background: '#000000' }).warnings.join(' ')).toMatch(/lighter than the background/);
        expect(analyzeStyle(symbol, { background: 'transparent' }).warnings.join(' ')).toMatch(/Transparent background/);
        expect(analyzeStyle(symbol, { modules: { shape: 'dots', scale: 0.7 } }).warnings.join(' ')).toMatch(/Small modules/);
    });

    test('checks every colour of a gradient', () => {
        const analysis = analyzeStyle(symbol, {
            foreground: { type: 'linear', stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#eeeeee' }] },
        });
        expect(analysis.contrastRatio).toBeLessThan(3);
    });
});
