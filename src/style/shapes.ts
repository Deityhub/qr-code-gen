import { num } from './color';
import { EyeShape, ModuleShape } from './types';

/** Rounded rectangle path (clockwise). */
export function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
    const Y = num(y);
    const R = num(r);
    const sw = num(w - 2 * r);
    const sh = num(h - 2 * r);
    return (
        `M${num(x + r)},${Y}h${sw}a${R},${R} 0 0 1 ${R},${R}v${sh}a${R},${R} 0 0 1 -${R},${R}` +
        `h-${sw}a${R},${R} 0 0 1 -${R},-${R}v-${sh}a${R},${R} 0 0 1 ${R},-${R}z`
    );
}

/** Circle path (clockwise). */
export function circle(cx: number, cy: number, r: number): string {
    return `M${num(cx - r)},${num(cy)}a${num(r)},${num(r)} 0 1 1 ${num(2 * r)},0a${num(r)},${num(r)} 0 1 1 -${num(2 * r)},0z`;
}

/** One data module of the given shape, drawn in the cell at column `c`, row `r`. */
export function modulePath(shape: ModuleShape, c: number, r: number, scale: number): string {
    const inset = (1 - scale) / 2;
    const x = c + inset;
    const y = r + inset;
    switch (shape) {
        case 'rounded':
            return roundedRect(x, y, scale, scale, scale * 0.3);
        case 'dots':
            return circle(c + 0.5, r + 0.5, scale / 2);
        case 'diamond': {
            const half = scale / 2;
            return `M${num(c + 0.5)},${num(r + 0.5 - half)}l${num(half)},${num(half)}l-${num(half)},${num(half)}l-${num(half)},-${num(half)}z`;
        }
        default:
            return `M${num(x)},${num(y)}h${num(scale)}v${num(scale)}h-${num(scale)}z`;
    }
}

/** Outer ring of a finder pattern: a 7x7 shape with a 5x5 hole, drawn for use with `fill-rule="evenodd"`. */
export function eyeFrame(shape: EyeShape, x: number, y: number): string {
    switch (shape) {
        case 'rounded':
            return roundedRect(x, y, 7, 7, 2) + roundedRect(x + 1, y + 1, 5, 5, 1);
        case 'circle':
            return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
        default:
            return `M${x},${y}h7v7h-7zM${x + 1},${y + 1}h5v5h-5z`;
    }
}

/** Solid centre of a finder pattern (3x3). */
export function eyeBall(shape: EyeShape, x: number, y: number): string {
    switch (shape) {
        case 'rounded':
            return roundedRect(x + 2, y + 2, 3, 3, 0.8);
        case 'circle':
            return circle(x + 3.5, y + 3.5, 1.5);
        default:
            return `M${x + 2},${y + 2}h3v3h-3z`;
    }
}
