import { QRSymbol } from '../types';
import { ALIGNMENT_PATTERN_COORDS } from '../constants';
import { StyleError } from '../config';
import { RGBA, Paint, contrastRatio, luminance, num, over, parseColor, toHex, toPaint } from './color';
import { LogoLayout, MAX_LOGO_COVERAGE, isHidden, layoutLogo, validateLogoHref } from './logo';
import { eyeBall, eyeFrame, modulePath } from './shapes';
import { EyeShape, ModuleShape, QRStyle, StyleAnalysis } from './types';

const MODULE_SHAPES: ModuleShape[] = ['square', 'rounded', 'dots', 'diamond'];
const EYE_SHAPES: EyeShape[] = ['square', 'rounded', 'circle'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function pick<T extends string>(value: unknown, allowed: T[], fallback: T, label: string): T {
    if (value === undefined) {
        return fallback;
    }
    if (!allowed.includes(value as T)) {
        throw new StyleError(`${label} must be one of: ${allowed.join(', ')}.`);
    }
    return value as T;
}

function escapeAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

interface Prepared {
    size: number;
    strict: boolean;
    background: RGBA;
    backgroundIsTransparent: boolean;
    foreground: Paint;
    frame: { shape: EyeShape; paint: Paint };
    ball: { shape: EyeShape; paint: Paint };
    shape: ModuleShape;
    scale: number;
    cornerRadius: number;
    logo: { layout: LogoLayout; href: string; circle: boolean; background: RGBA | null } | null;
    analysis: StyleAnalysis;
}

function prepare(symbol: QRSymbol, style: QRStyle): Prepared {
    const total = symbol.matrix.length;
    if (!symbol || total !== symbol.modules + 2 * symbol.quietZone) {
        throw new StyleError('Pass the result of generateQRSymbol().');
    }
    const size = Number.isFinite(style.size) ? clamp(style.size as number, 16, 8192) : 300;

    const background = parseColor(style.background ?? '#ffffff', 'background');
    const backgroundIsTransparent = background.a === 0;
    // Judge contrast against white when the background is transparent (the usual page colour)
    const backdrop: RGBA = backgroundIsTransparent ? { r: 255, g: 255, b: 255, a: 1 } : over(background, { r: 255, g: 255, b: 255, a: 1 });

    const foreground = toPaint(style.foreground ?? '#000000', total, 'foreground');
    const frame = {
        shape: pick(style.eyes?.frame?.shape, EYE_SHAPES, 'square', 'eyes.frame.shape'),
        paint: toPaint(style.eyes?.frame?.color ?? style.foreground ?? '#000000', total, 'eyes.frame.color'),
    };
    const ball = {
        shape: pick(style.eyes?.ball?.shape, EYE_SHAPES, 'square', 'eyes.ball.shape'),
        paint: toPaint(style.eyes?.ball?.color ?? style.foreground ?? '#000000', total, 'eyes.ball.color'),
    };
    const shape = pick(style.modules?.shape, MODULE_SHAPES, 'square', 'modules.shape');
    const scale = Number.isFinite(style.modules?.scale) ? clamp(style.modules?.scale as number, 0.6, 1) : 1;
    const cornerRadius = Number.isFinite(style.cornerRadius) ? clamp(style.cornerRadius as number, 0, total / 2) : 0;

    const warnings: string[] = [];
    const errors: string[] = [];

    // --- Contrast ---
    const darks = [...foreground.colors, ...frame.paint.colors, ...ball.paint.colors];
    let lowest = Infinity;
    let inverted = false;
    for (const color of darks) {
        const flat = over(color, backdrop);
        lowest = Math.min(lowest, contrastRatio(flat, backdrop));
        if (luminance(flat) > luminance(backdrop)) {
            inverted = true;
        }
    }
    if (lowest < 3) {
        warnings.push(`Low contrast (${num(lowest)}:1). Use at least 3:1, ideally much more, so scanners can tell the modules from the background.`);
    }
    if (inverted) {
        warnings.push('The modules are lighter than the background. Inverted codes are not read by every scanner.');
    }
    if (backgroundIsTransparent) {
        warnings.push('Transparent background: make sure the code is placed on a light, plain surface.');
    }
    if (scale < 0.8) {
        warnings.push('Small modules (scale below 0.8) reduce scan reliability.');
    }

    // --- Logo ---
    let logo: Prepared['logo'] = null;
    let logoCoverage = 0;
    if (style.logo) {
        const href = validateLogoHref(style.logo.href);
        const layout = layoutLogo(symbol, style.logo);
        logoCoverage = layout.coverage;
        logo = {
            layout,
            href,
            circle: pick(style.logo.shape, ['square', 'circle'] as const, 'square', 'logo.shape') === 'circle',
            background: style.logo.background === undefined ? null : parseColor(style.logo.background, 'logo.background'),
        };
        const max = MAX_LOGO_COVERAGE[symbol.ecl];
        if (max === undefined) {
            errors.push(`A logo needs error correction level Q or H (this code uses ${symbol.ecl}).`);
        } else if (layout.coverage > max) {
            errors.push(
                `The logo hides ${Math.round(layout.coverage * 100)}% of the data modules; level ${symbol.ecl} allows at most ${Math.round(max * 100)}%. ` +
                    'Use a smaller logo, less margin or a larger version.',
            );
        }
        if (layout.touchesCriticalPatterns) {
            errors.push('The logo is too large for this code: it would cover a corner square or format information. Use a smaller logo or a larger version.');
        }
    }

    return {
        size,
        strict: style.strict !== false,
        background,
        backgroundIsTransparent,
        foreground,
        frame,
        ball,
        shape,
        scale,
        cornerRadius,
        logo,
        analysis: {
            warnings,
            errors,
            logoCoverage,
            contrastRatio: Number.isFinite(lowest) ? lowest : 21,
        },
    };
}

/**
 * Checks a style for problems without rendering. Throws a `StyleError` only for invalid input
 * (an unknown colour, a bad logo URI); scan-reliability problems are returned in the result.
 */
export function analyzeStyle(symbol: QRSymbol, style: QRStyle = {}): StyleAnalysis {
    return prepare(symbol, style).analysis;
}

/**
 * Renders a QR code as an SVG string with custom colours, gradients, module and corner-square
 * shapes and an optional logo.
 * @throws {StyleError} If the style is invalid, or (with `strict`, the default) unlikely to scan.
 */
export function renderToStyledSVG(symbol: QRSymbol, style: QRStyle = {}): string {
    const p = prepare(symbol, style);
    if (p.strict && p.analysis.errors.length > 0) {
        throw new StyleError(p.analysis.errors.join(' '));
    }

    const { matrix, quietZone: q, modules: m } = symbol;
    const total = matrix.length;
    const inFinder = (r: number, c: number) => {
        const rr = r - q;
        const cc = c - q;
        return (rr >= 0 && rr < 7 && cc >= 0 && cc < 7) || (rr >= 0 && rr < 7 && cc >= m - 7 && cc < m) || (rr >= m - 7 && rr < m && cc >= 0 && cc < 7);
    };

    // Alignment patterns are always drawn as solid squares: scanners use them to locate the grid,
    // and they are much harder to find when drawn with dots or diamonds.
    const alignment: [number, number][] = [];
    for (const r of ALIGNMENT_PATTERN_COORDS[symbol.version] ?? []) {
        for (const c of ALIGNMENT_PATTERN_COORDS[symbol.version]) {
            const onFinder = (r < 8 && c < 8) || (r < 8 && c >= m - 8) || (r >= m - 8 && c < 8);
            if (!onFinder && !isHidden(p.logo?.layout ?? null, q + r, q + c)) {
                alignment.push([q + r, q + c]);
            }
        }
    }
    const inAlignment = (r: number, c: number) => alignment.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2);

    // Modules: one compound path. Plain squares merge horizontally into runs to keep the output small.
    const plainSquares = p.shape === 'square' && p.scale === 1;
    let modulesPath = '';
    for (let r = 0; r < total; r++) {
        let c = 0;
        while (c < total) {
            if (!matrix[r][c] || inFinder(r, c) || inAlignment(r, c) || isHidden(p.logo?.layout ?? null, r, c)) {
                c++;
                continue;
            }
            if (plainSquares) {
                const start = c;
                while (c < total && matrix[r][c] && !inFinder(r, c) && !inAlignment(r, c) && !isHidden(p.logo?.layout ?? null, r, c)) {
                    c++;
                }
                modulesPath += `M${start},${r}h${c - start}v1h-${c - start}z`;
            } else {
                modulesPath += modulePath(p.shape, c, r, p.scale);
                c++;
            }
        }
    }

    // Corner squares: frames and balls, each in one path
    const corners: [number, number][] = [
        [q, q],
        [q + m - 7, q],
        [q, q + m - 7],
    ];
    const frames = corners.map(([x, y]) => eyeFrame(p.frame.shape, x, y)).join('');
    const balls = corners.map(([x, y]) => eyeBall(p.ball.shape, x, y)).join('');
    const alignmentPath = alignment
        .map(([ar, ac]) => `M${ac - 2},${ar - 2}h5v5h-5zM${ac - 1},${ar - 1}h3v3h-3zM${ac},${ar}h1v1h-1z`)
        .join('');

    const defs: string[] = [];
    for (const paint of [p.foreground, p.frame.paint, p.ball.paint]) {
        if (paint.defs && !defs.includes(paint.defs)) {
            defs.push(paint.defs);
        }
    }

    let logoMarkup = '';
    if (p.logo) {
        const { layout, href } = p.logo;
        const safeHref = escapeAttr(href);
        const clipId = `qrclip${layout.side}`;
        const behind = p.logo.background ?? (p.backgroundIsTransparent ? null : p.background);
        if (behind && behind.a > 0) {
            const half = layout.side / 2;
            const shape = p.logo.circle
                ? `<circle cx="${num(layout.x + half)}" cy="${num(layout.y + half)}" r="${num(half)}"`
                : `<rect x="${layout.x}" y="${layout.y}" width="${layout.side}" height="${layout.side}"`;
            logoMarkup += `${shape} fill="${toHex(behind)}"${behind.a < 1 ? ` fill-opacity="${num(behind.a)}"` : ''}/>`;
        }
        if (p.logo.circle) {
            const half = layout.side / 2;
            defs.push(`<clipPath id="${clipId}"><circle cx="${num(layout.x + half)}" cy="${num(layout.y + half)}" r="${num(half)}"/></clipPath>`);
        }
        logoMarkup +=
            `<image href="${safeHref}" xlink:href="${safeHref}" x="${layout.x}" y="${layout.y}" width="${layout.side}" height="${layout.side}" preserveAspectRatio="xMidYMid meet"` +
            `${p.logo.circle ? ` clip-path="url(#${clipId})"` : ''}/>`;
    }

    const bg = p.backgroundIsTransparent
        ? ''
        : `<rect width="${total}" height="${total}"${p.cornerRadius > 0 ? ` rx="${num(p.cornerRadius)}"` : ''} fill="${toHex(p.background)}"${p.background.a < 1 ? ` fill-opacity="${num(p.background.a)}"` : ''}/>`;

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${total} ${total}" width="${num(p.size)}" height="${num(p.size)}">` +
        (defs.length ? `<defs>${defs.join('')}</defs>` : '') +
        bg +
        (modulesPath ? `<path d="${modulesPath}" ${p.foreground.attrs}${plainSquares ? ' shape-rendering="crispEdges"' : ''}/>` : '') +
        (alignmentPath ? `<path d="${alignmentPath}" ${p.foreground.attrs} fill-rule="evenodd"/>` : '') +
        `<path d="${frames}" ${p.frame.paint.attrs} fill-rule="evenodd"/>` +
        `<path d="${balls}" ${p.ball.paint.attrs}/>` +
        logoMarkup +
        '</svg>'
    );
}
