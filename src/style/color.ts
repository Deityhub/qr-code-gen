import { StyleError } from '../config';
import { Fill, GradientFill } from './types';

export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

const NAMED: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    gray: '#808080',
    grey: '#808080',
    navy: '#000080',
    teal: '#008080',
    maroon: '#800000',
    brown: '#a52a2a',
    cyan: '#00ffff',
    magenta: '#ff00ff',
};

const RGB_RE = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;
const HSL_RE = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/i;
const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function alphaOf(raw: string | undefined): number {
    if (raw === undefined) {
        return 1;
    }
    return clamp(raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw), 0, 1);
}

function channel(raw: string): number {
    return clamp(raw.endsWith('%') ? (parseFloat(raw) / 100) * 255 : parseFloat(raw), 0, 255);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/**
 * Parses a colour string. Only a strict set of formats is accepted so that nothing
 * user-supplied is ever copied into the SVG as-is.
 */
export function parseColor(input: unknown, label: string): RGBA {
    if (typeof input !== 'string') {
        throw new StyleError(`${label} must be a colour string.`);
    }
    const value = input.trim();
    const lower = value.toLowerCase();

    if (lower === 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0 };
    }
    if (NAMED[lower]) {
        return parseColor(NAMED[lower], label);
    }
    if (HEX_RE.test(value)) {
        let hex = value.slice(1);
        if (hex.length <= 4) {
            hex = hex.split('').map((ch) => ch + ch).join('');
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
        };
    }
    const rgb = RGB_RE.exec(value);
    if (rgb) {
        return { r: channel(rgb[1]), g: channel(rgb[2]), b: channel(rgb[3]), a: alphaOf(rgb[4]) };
    }
    const hsl = HSL_RE.exec(value);
    if (hsl) {
        const [r, g, b] = hslToRgb(
            parseFloat(hsl[1]) % 360,
            clamp(parseFloat(hsl[2]), 0, 100) / 100,
            clamp(parseFloat(hsl[3]), 0, 100) / 100,
        );
        return { r, g, b, a: alphaOf(hsl[4]) };
    }
    throw new StyleError(`${label} is not a supported colour: use #rrggbb, rgb(), hsl() or a basic colour name.`);
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');
export const toHex = (c: RGBA) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;

/** Number without float noise, at most 3 decimals. */
export const num = (n: number) => String(+n.toFixed(3));

function luminance(c: RGBA): number {
    const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/** Colour as it looks on top of a background (alpha composited). */
export function over(fg: RGBA, bg: RGBA): RGBA {
    return {
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
        a: 1,
    };
}

export function contrastRatio(a: RGBA, b: RGBA): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

export { luminance };

// --- Paint (SVG fill attributes) ---

export interface Paint {
    /** Attribute text, e.g. `fill="#000000"` or `fill="url(#qr1a2b)"`. */
    attrs: string;
    /** `<linearGradient>`/`<radialGradient>` markup, empty for solid colours. */
    defs: string;
    /** Every colour in the paint, for contrast checks. */
    colors: RGBA[];
}

function hashId(text: string): string {
    let h = 5381;
    for (let i = 0; i < text.length; i++) {
        h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    }
    return `qr${(h >>> 0).toString(36)}`;
}

function stopTag(offset: number, color: RGBA): string {
    const opacity = color.a < 1 ? ` stop-opacity="${num(color.a)}"` : '';
    return `<stop offset="${num(offset)}" stop-color="${toHex(color)}"${opacity}/>`;
}

function gradientMarkup(fill: GradientFill, extent: number, label: string): Paint {
    if ((fill.type !== 'linear' && fill.type !== 'radial') || !Array.isArray(fill.stops)) {
        throw new StyleError(`${label} gradient needs a type ('linear' or 'radial') and stops.`);
    }
    if (fill.stops.length < 2 || fill.stops.length > 8) {
        throw new StyleError(`${label} gradient needs between 2 and 8 colour stops.`);
    }
    const colors: RGBA[] = [];
    const stops = fill.stops.map((stop, i) => {
        const offset = Number(stop.offset);
        if (!Number.isFinite(offset) || offset < 0 || offset > 1) {
            throw new StyleError(`${label} gradient stop ${i + 1} needs an offset between 0 and 1.`);
        }
        const color = parseColor(stop.color, `${label} gradient stop ${i + 1}`);
        colors.push(color);
        return stopTag(offset, color);
    });

    const half = extent / 2;
    let open: string;
    if (fill.type === 'linear') {
        const angle = ((Number.isFinite(fill.angle) ? (fill.angle as number) : 45) * Math.PI) / 180;
        const dx = Math.cos(angle) * half;
        const dy = Math.sin(angle) * half;
        open = `x1="${num(half - dx)}" y1="${num(half - dy)}" x2="${num(half + dx)}" y2="${num(half + dy)}"`;
    } else {
        open = `cx="${num(half)}" cy="${num(half)}" r="${num(half)}"`;
    }
    const tag = fill.type === 'linear' ? 'linearGradient' : 'radialGradient';
    const body = `gradientUnits="userSpaceOnUse" ${open}>${stops.join('')}</${tag}>`;
    const id = hashId(body);
    return { attrs: `fill="url(#${id})"`, defs: `<${tag} id="${id}" ${body}`, colors };
}

/** Validates a fill and turns it into SVG attributes. `extent` is the symbol side in modules. */
export function toPaint(fill: Fill, extent: number, label: string): Paint {
    if (typeof fill === 'object' && fill !== null) {
        return gradientMarkup(fill, extent, label);
    }
    const color = parseColor(fill, label);
    const opacity = color.a < 1 ? ` fill-opacity="${num(color.a)}"` : '';
    return { attrs: `fill="${toHex(color)}"${opacity}`, defs: '', colors: [color] };
}
