import fs from './gamma-contrast.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

type GammaContrastSettings = {
  gammaValue?: number;
  gammaR?: number;
  gammaG?: number;
  gammaB?: number;
  gammaA?: number;
};

function getUniforms(opts: GammaContrastSettings = {}) {
  const {gammaValue, gammaR, gammaG, gammaB, gammaA} = opts;

  if (!gammaValue && !gammaR && !gammaG && !gammaB && !gammaA) {
    return;
  }

  return {
    gamma_r: gammaR || 1,
    gamma_g: gammaG || 1,
    gamma_b: gammaB || 1,
    gamma_a: gammaA || 1,
  };
}

export default {
  name: 'gamma_contrast',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = gammaContrast(image, gamma_r, gamma_g, gamma_b, gamma_a);
    `,
  },
} as ShaderModule<GammaContrastSettings>;
