import fs from './normalized-difference.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

export default {
  name: 'normalized_difference',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(normalized_difference_calc(image), 0., 0., 0.);
    `,
  },
} as ShaderModule;
