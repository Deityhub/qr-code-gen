import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: false,
    minify: true,
    treeshake: true,
    outExtension({ format }) {
        return {
            js: format === 'cjs' ? '.js' : '.mjs',
        };
    },
});
