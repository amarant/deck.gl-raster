import {UniformValue} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';

type MaskImageSettings = {
  imageMask?: ImageData;
};

function getUniforms(opts: MaskImageSettings = {}) {
  const {imageMask} = opts;

  if (!imageMask) {
    return;
  }

  return {
    bitmapTexture_mask: imageMask as any as UniformValue,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_mask;
`;

export default {
  name: 'mask-image',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float alpha = float(texture(bitmapTexture_mask, coord).a);
    image = vec4(image.rgb, alpha);
    `,
  },
} as ShaderModule<MaskImageSettings>;
