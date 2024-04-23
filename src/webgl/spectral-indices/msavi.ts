import fs from './msavi.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

export default {
  name: 'modified_soil_adjusted_vegetation_index',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(modified_soil_adjusted_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
} as ShaderModule;
