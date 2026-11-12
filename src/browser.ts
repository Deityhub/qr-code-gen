import { StyleError } from './config';

/**
 * Turns an SVG string (for example from `renderToStyledSVG`) into a PNG image. Browser only:
 * it draws the SVG on a canvas. In Node.js convert the SVG with a library such as sharp or resvg.
 *
 * The size is snapped to a whole number of pixels per module so the code stays sharp. A logo
 * must be a `data:` URI; images loaded from a URL are blocked inside SVG images.
 *
 * @param svg SVG markup
 * @param size Requested width/height in pixels (default 300)
 */
export async function renderSvgToPng(svg: string, size: number = 300): Promise<Blob> {
    if (typeof document === 'undefined') {
        throw new Error('renderSvgToPng only works in a browser. In Node.js convert the SVG with sharp or resvg.');
    }
    if (/<image[^>]*\shref="https?:/i.test(svg)) {
        throw new StyleError('A logo must be a data: URI to export a PNG: browsers do not load URLs inside SVG images.');
    }

    // Snap to whole pixels per module and size the SVG itself, so it is rasterised at the target size
    const viewBox = /<svg[^>]*\sviewBox="0 0 (\d+(?:\.\d+)?) /.exec(svg);
    const modules = viewBox ? parseFloat(viewBox[1]) : 0;
    const side = modules > 0 ? modules * Math.max(1, Math.round(size / modules)) : Math.max(1, Math.round(size));
    const sized = svg.replace(/(<svg[^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, `$1 width="${side}" height="${side}"`);

    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml;charset=utf-8' }));
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = side;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas is not available.');
        }
        ctx.drawImage(img, 0, 0, side, side);
        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the PNG.'))), 'image/png');
        });
    } finally {
        URL.revokeObjectURL(url);
    }
}
