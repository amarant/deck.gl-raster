import fs from './savi.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

export default {
  name: 'soil_adjusted_vegetation_index',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(soil_adjusted_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
} as ShaderModule;
