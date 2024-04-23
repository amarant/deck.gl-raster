import {UniformValue} from '@luma.gl/core';
import fs from './pansharpen-brovey-webgl2.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

type PansharpenBroveyProps = {
  imagePan?: ImageData;
  panWeight?: number;
};

function getUniforms(opts: PansharpenBroveyProps = {}) {
  const {imagePan, panWeight = 0.2} = opts;

  if (!imagePan) {
    return;
  }

  return {
    bitmapTexture_pan: imagePan as any as UniformValue,
    panWeight,
  };
}

export default {
  name: 'pansharpen_brovey',
  fs,
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float pan_band = float(texture(bitmapTexture_pan, coord).r);
    image = pansharpen_brovey_calc(image, pan_band, panWeight);
    `,
  },
} as ShaderModule<PansharpenBroveyProps>;
