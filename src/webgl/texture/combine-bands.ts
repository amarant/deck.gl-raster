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

const moduleCache = new Map<string, ShaderModule<CombineBandsSettings>>();

type SamplerType = 'sampler2D' | 'usampler2D';
type ShaderType = 'vs' | 'fs';

const getModuleKey = (
  n: number,
  samplerType: SamplerType,
  shaderType: ShaderType
) => `${n}-${samplerType}-${shaderType}`;

function getCombineBandsModule(
  n: number,
  samplerType: SamplerType = 'sampler2D',
  shaderType: ShaderType = 'fs'
) {
  const moduleKey = getModuleKey(n, samplerType, shaderType);
  if (moduleCache.has(moduleKey)) {
    return moduleCache.get(moduleKey);
  }
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

  const shader =
    `uniform ${samplerType} bitmapTexture_r;` +
    (n > 1 ? `uniform ${samplerType} bitmapTexture_g;` : '') +
    (n > 2 ? `uniform ${samplerType} bitmapTexture_b;` : '') +
    (n > 3 ? `uniform ${samplerType} bitmapTexture_a;` : '');
  const module = {
    name: `combine-bands-${moduleKey}`,
    [shaderType]: shader,
    getUniforms,
    inject: {
      [`${shaderType}:DECKGL_CREATE_COLOR`]: `
    float channel1 = float(texture(bitmapTexture_r, coord).r);
    ${n > 1 ? 'float channel2 = float(texture(bitmapTexture_g, coord).r);' : ''}
    ${n > 2 ? 'float channel3 = float(texture(bitmapTexture_b, coord).r);' : ''}
    ${n > 3 ? 'float channel4 = float(texture(bitmapTexture_a, coord).r);' : ''}

    ${n === 1 ? 'image = vec4(channel1, .0, .0, .0);' : ''}
    ${n === 2 ? 'image = vec4(channel1, channel2, .0, .0);' : ''}
    ${n === 3 ? 'image = vec4(channel1, channel2, channel3, .0);' : ''}
    ${n === 4 ? 'image = vec4(channel1, channel2, channel3, channel4);' : ''}
    `,
    },
  } as ShaderModule<CombineBandsSettings>;
  moduleCache.set(moduleKey, module);
  return module;
}

export {getCombineBandsModule};
