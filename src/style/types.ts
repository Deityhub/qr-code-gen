export type ModuleShape = 'square' | 'rounded' | 'dots' | 'diamond';
export type EyeShape = 'square' | 'rounded' | 'circle';

export interface GradientFill {
    type: 'linear' | 'radial';
    /** Linear gradients only: direction in degrees, 0 = left to right, 90 = top to bottom. Default 45. */
    angle?: number;
    /** 2 to 8 colour stops. */
    stops: { offset: number; color: string }[];
}

/** A colour (`#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `hsl()`, a basic colour name) or a gradient. */
export type Fill = string | GradientFill;

export interface QRLogo {
    /** A `data:image/(png|jpeg|gif|webp|svg+xml);base64,...` URI or an `https://` URL. */
    href: string;
    /** Logo width as a fraction of the symbol width. Default 0.2, maximum 0.3. */
    size?: number;
    /** Empty modules kept around the logo. Default 1. */
    margin?: number;
    /** Crop the logo to a circle. Default 'square'. */
    shape?: 'square' | 'circle';
    /** Colour painted behind the logo. Default: the code background. */
    background?: string;
}

export interface QRStyle {
    /** Width and height of the SVG in pixels. Default 300. */
    size?: number;
    /** Colour of the modules. Default black. */
    foreground?: Fill;
    /** Background colour or 'transparent'. Default white. */
    background?: string;
    /** Rounded corners of the whole code in modules. Default 0. */
    cornerRadius?: number;
    modules?: {
        /** Default 'square'. */
        shape?: ModuleShape;
        /** Size of each module relative to its cell, 0.6 to 1. Default 1. */
        scale?: number;
    };
    eyes?: {
        /** The outer ring of the three corner squares. */
        frame?: { shape?: EyeShape; color?: Fill };
        /** The solid centre of the three corner squares. */
        ball?: { shape?: EyeShape; color?: Fill };
    };
    logo?: QRLogo;
    /** Throw a `StyleError` for combinations that are likely not to scan. Default true. */
    strict?: boolean;
}

export interface StyleAnalysis {
    /** Things that may reduce scan reliability. */
    warnings: string[];
    /** Problems that make `renderToStyledSVG` throw when `strict` is true. */
    errors: string[];
    /** Share of the data modules hidden by the logo, 0 to 1. */
    logoCoverage: number;
    /** Lowest contrast ratio between a dark colour and the background (21 is black on white). */
    contrastRatio: number;
}
