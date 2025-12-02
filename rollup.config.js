import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/umd/qr-code-gen.js',
      format: 'umd',
      name: 'QRCodeGen',
      sourcemap: true,
    },
    {
      file: 'dist/umd/qr-code-gen.min.js',
      format: 'umd',
      name: 'QRCodeGen',
      plugins: [terser()],
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    typescript({ tsconfig: './tsconfig.base.json' }),
  ],
};