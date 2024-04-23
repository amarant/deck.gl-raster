import fs from './linear-rescale.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

type LinearRescaleSettings = {
  linearRescaleScaler?: number;
  linearRescaleOffset?: number;
};

function getUniforms(opts: LinearRescaleSettings = {}) {
  const {linearRescaleScaler, linearRescaleOffset} = opts;

  if (!linearRescaleScaler && !linearRescaleOffset) {
    return;
  }

  return {
    linearRescaleScaler: linearRescaleScaler || 1,
    linearRescaleOffset: linearRescaleOffset || 0,
  };
}

export default {
  name: 'linear_rescale',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = linear_rescale(image, linearRescaleScaler, linearRescaleOffset);
    `,
  },
} as ShaderModule<LinearRescaleSettings>;
