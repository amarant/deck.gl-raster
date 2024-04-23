import {UniformValue} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';

type RgbaImageSettings = {
  imageRgba?: ImageData;
};

function getUniforms(opts: RgbaImageSettings = {}) {
  const {imageRgba} = opts;
  if (!imageRgba) {
    return;
  }

  return {
    bitmapTexture_rgba: imageRgba as any as UniformValue,
  };
}

const fs = `\
precision mediump float;
precision mediump int;
precision mediump usampler2D;

#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_rgba;
#else
  uniform sampler2D bitmapTexture_rgba;
#endif
`;

export default {
  name: 'rgba-image',
  fs,
  getUniforms,
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    image = vec4(texture(bitmapTexture_rgba, coord));
    `,
  },
} as ShaderModule<RgbaImageSettings>;
