import { ErrorCorrectionLevel, QRSymbol } from '../types';
import { initializeMatrix } from '../matrix/functionalPatterns';
import { StyleError } from '../config';
import { QRLogo } from './types';

/**
 * Highest share of the data modules a logo may hide, by error correction level.
 * Roughly half of the nominal recovery capacity, which leaves room for printing and camera noise.
 */
export const MAX_LOGO_COVERAGE: Partial<Record<ErrorCorrectionLevel, number>> = {
    Q: 0.12,
    H: 0.15,
};

const DATA_URI_RE = /^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/;
const URL_RE = /^https:\/\/[^\s"'<>\\]+$/;

export interface LogoLayout {
    /** Image position and side, in module units (including the quiet zone offset). */
    x: number;
    y: number;
    side: number;
    /** Hidden area (image plus margin): first cell and side, in module units. */
    hiddenFrom: number;
    hiddenSide: number;
    /** Share of the data modules the hidden area covers. */
    coverage: number;
    /** Set when the hidden area would touch a finder, format or version pattern. */
    touchesCriticalPatterns: boolean;
}

export function validateLogoHref(href: unknown): string {
    if (typeof href !== 'string' || !(DATA_URI_RE.test(href) || URL_RE.test(href))) {
        throw new StyleError('logo.href must be a base64 data:image URI (png, jpeg, gif, webp, svg) or an https:// URL.');
    }
    return href;
}

/** True for modules a scanner needs to find the code and read its format: never hidden. */
function isCritical(r: number, c: number, m: number, version: number): boolean {
    const corner = (r < 8 && c < 8) || (r < 8 && c >= m - 8) || (r >= m - 8 && c < 8);
    const format = (r === 8 && (c < 9 || c >= m - 8)) || (c === 8 && (r < 9 || r >= m - 8));
    const versionInfo = version >= 7 && ((r < 6 && c >= m - 11 && c < m - 8) || (c < 6 && r >= m - 11 && r < m - 8));
    return corner || format || versionInfo;
}

export function layoutLogo(symbol: QRSymbol, logo: QRLogo): LogoLayout {
    const { modules: m, quietZone: q, version } = symbol;
    const fraction = Math.min(0.3, Math.max(0.05, Number.isFinite(logo.size) ? (logo.size as number) : 0.2));
    // An odd side keeps the logo centred on the module grid (the symbol side is always odd)
    const side = Math.max(3, 2 * Math.round((fraction * m - 1) / 2) + 1);
    const margin = Math.min(4, Math.max(0, Math.round(Number.isFinite(logo.margin) ? (logo.margin as number) : 1)));
    const hiddenSide = side + 2 * margin;
    const start = (m - hiddenSide) / 2;

    const { reserved } = initializeMatrix(version);
    let totalData = 0;
    for (const row of reserved) {
        for (const isReserved of row) {
            if (!isReserved) {
                totalData++;
            }
        }
    }

    let hiddenData = 0;
    let touchesCriticalPatterns = start < 0;
    for (let r = Math.max(0, start); r < Math.min(m, start + hiddenSide); r++) {
        for (let c = Math.max(0, start); c < Math.min(m, start + hiddenSide); c++) {
            if (isCritical(r, c, m, version)) {
                touchesCriticalPatterns = true;
            }
            if (!reserved[r][c]) {
                hiddenData++;
            }
        }
    }

    return {
        x: q + start + margin,
        y: q + start + margin,
        side,
        hiddenFrom: q + start,
        hiddenSide,
        coverage: hiddenData / totalData,
        touchesCriticalPatterns,
    };
}

/** Whether the module at matrix position (r, c) is hidden by the logo. */
export function isHidden(layout: LogoLayout | null, r: number, c: number): boolean {
    if (!layout) {
        return false;
    }
    const end = layout.hiddenFrom + layout.hiddenSide;
    return r >= layout.hiddenFrom && r < end && c >= layout.hiddenFrom && c < end;
}
