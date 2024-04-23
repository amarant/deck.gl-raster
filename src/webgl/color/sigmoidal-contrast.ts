import fs from './sigmoidal-contrast.fs.glsl';
import type {ShaderModule} from '@luma.gl/shadertools';

type SigmoidalContrastSettings = {
  sigmoidalContrast?: number;
  sigmoidalBias?: number;
};

function getUniforms(opts: SigmoidalContrastSettings = {}) {
  const {sigmoidalContrast, sigmoidalBias} = opts;

  if (!sigmoidalContrast && !sigmoidalBias) {
    return;
  }

  return {
    sigmoidal_contrast: sigmoidalContrast || 0,
    sigmoidal_bias: sigmoidalBias || 0.5,
  };
}

export default {
  name: 'sigmoidal_contrast',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = sigmoidalContrast(image, sigmoidal_contrast, sigmoidal_bias);
    `,
  },
} as ShaderModule<SigmoidalContrastSettings>;
