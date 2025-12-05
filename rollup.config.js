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
      sourcemap: false,
    },
    {
      file: 'dist/umd/qr-code-gen.min.js',
      format: 'umd',
      name: 'QRCodeGen',
      plugins: [terser()],
      sourcemap: false,
    },
  ],
  plugins: [
    resolve(),
    typescript({ 
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false
    }),
  ],
};