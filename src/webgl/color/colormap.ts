import fs from './colormap.fs.glsl';
import {ShaderModule} from '@luma.gl/shadertools';

type ColormapSettings = {
  imageColormap: ImageData;
  colormapScaler?: number;
  colormapOffset?: number;
};

function getUniforms(opts?: ColormapSettings | {}): Record<string, any> {
  if (!opts || !('imageColormap' in opts)) {
    return {};
  }
  const {imageColormap, colormapScaler, colormapOffset} = opts;

  return {
    u_colormap_texture: imageColormap,
    colormapScaler: Number.isFinite(colormapScaler) ? colormapScaler : 0.5,
    colormapOffset: Number.isFinite(colormapOffset) ? colormapOffset : 0.5,
  };
}

export default {
  name: 'colormap',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = colormap(u_colormap_texture, image, colormapScaler, colormapOffset);
    `,
  },
} as ShaderModule<ColormapSettings>;
