import {UniformValue} from '@luma.gl/core';
import {ShaderModule} from '@luma.gl/shadertools';

type CombineBandsSettings = {
  imageBands?: UniformValue[];
};

const textureNames = [
  'bitmapTexture_r',
  'bitmapTexture_g',
  'bitmapTexture_b',
  'bitmapTexture_a',
];

function buildCombineBandsModule(n: number) {
  function getUniforms(opts: CombineBandsSettings = {}) {
    const {imageBands} = opts;
    if (!imageBands || imageBands.length === 0) {
      return;
    }
    const uniforms = {};
    for (let i = 0; i < n; i++) {
      uniforms[textureNames[i]] = imageBands[i];
    }
    return uniforms;
  }

  const fs = `\
#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_r;
  ${n > 1 ? 'uniform SAMPLER_TYPE bitmapTexture_g;' : ''}
  ${n > 2 ? 'uniform SAMPLER_TYPE bitmapTexture_b;' : ''}
  ${n > 3 ? 'uniform SAMPLER_TYPE bitmapTexture_a;' : ''}
#else
  uniform sampler2D bitmapTexture_r;
  ${n > 1 ? 'uniform sampler2D bitmapTexture_g;' : ''}
  ${n > 2 ? 'uniform sampler2D bitmapTexture_b;' : ''}
  ${n > 3 ? 'uniform sampler2D bitmapTexture_a;' : ''}
#endif
`;

  return {
    name: `combine-bands-${n}`,
    fs,
    getUniforms,
    defines: {
      SAMPLER_TYPE: 'sampler2D',
    },
    inject: {
      'fs:DECKGL_CREATE_COLOR': `
    float channel1 = float(texture(bitmapTexture_r, coord).r);
    ${n > 1 ? 'float channel2 = float(texture(bitmapTexture_g, coord).r);' : ''}
    ${n > 2 ? 'float channel3 = float(texture(bitmapTexture_b, coord).r);' : ''}
    ${n > 3 ? 'float channel4 = float(texture(bitmapTexture_a, coord).r);' : ''}

    ${n === 1 ? 'image = vec4(channel1);' : ''}
    ${n === 2 ? 'image = vec4(channel1, channel2);' : ''}
    ${n === 3 ? 'image = vec4(channel1, channel2, channel3);' : ''}
    ${n === 4 ? 'image = vec4(channel1, channel2, channel3, channel4);' : ''}
    `,
    },
  } as ShaderModule<CombineBandsSettings>;
}

const combineBands1 = buildCombineBandsModule(1);
const combineBands2 = buildCombineBandsModule(2);
const combineBands3 = buildCombineBandsModule(3);
const combineBands4 = buildCombineBandsModule(4);

const getCombineBandsModule = (n: number) => {
  switch (n) {
    case 1:
      return combineBands1;
    case 2:
      return combineBands2;
    case 3:
      return combineBands3;
    case 4:
      return combineBands4;
    default:
      throw new Error('Invalid number of bands');
  }
};

export {
  combineBands1,
  combineBands2,
  combineBands3,
  combineBands4,
  getCombineBandsModule,
};
