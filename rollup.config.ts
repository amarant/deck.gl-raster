// import glsl from 'rollup-plugin-glsl';
import {glsl} from '@plutotcool/rollup-plugin-glsl';
// import type {RollupOptions, Plugin} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' assert {type: 'json'};

const globals = {
  '@deck.gl/core': 'deck',
  '@deck.gl/layers': 'deck',
  '@deck.gl/mesh-layers': 'deck',
  '@luma.gl/core': 'luma',
  '@luma.gl/constants': 'luma.GL',
  '@luma.gl/engine': 'luma',
  '@luma.gl/shadertools': 'luma',
  '@luma.gl/webgl': 'luma',
};

export default {
  input: './src/index.ts',
  output: [
    {file: pkg.main, format: 'cjs', globals},
    {file: pkg.module, format: 'es', globals},
  ],
  plugins: [
    typescript(),
    glsl({
      include: 'src/**/*.glsl',
      minifier: {
        renameFunctions: false,
        renameVariables: false,
        renameDefines: false,
        renameStructs: false,
        trimComments: true,
        trimSpaces: true,
        trimZeros: true,
      },
    }),
  ],
  external: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/mesh-layers',
    '@luma.gl/constants',
    '@luma.gl/core',
    '@luma.gl/engine',
    '@luma.gl/shadertools',
    '@luma.gl/webgl',
  ],
}; // as RollupOptions;
