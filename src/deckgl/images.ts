import {Device, Texture, TextureProps} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import isEqual from 'lodash.isequal';
import {RasterLayerProps} from './raster-layer/raster-layer';
import {DeprecatedWebGLTextureProps} from '@luma.gl/core/dist/adapter/resources/texture';

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

export function loadImages({
  device,
  images,
  props,
  oldProps,
}: {
  device: Device;
  images: Record<string, Texture>;
  props: RasterLayerProps;
  oldProps: RasterLayerProps;
}) {
  // Change to `true` if we need to setState with a new `images` object
  let imagesDirty = false;

  // If there are any removed keys, which previously existed in oldProps and
  // this.state.images but no longer exist in props, remove from the images
  // object
  if (oldProps && oldProps.images) {
    for (const key in oldProps.images) {
      if (props.images && !(key in props.images) && key in images) {
        delete images[key];
        imagesDirty = true;
      }
    }
  }

  // Check if any keys of props.images have changed
  const changedKeys: string[] = [];
  for (const key in props.images) {
    // If oldProps.images didn't exist or it existed and this key didn't exist
    if (!oldProps.images || (oldProps.images && !(key in oldProps.images))) {
      changedKeys.push(key);
      continue;
    }

    // Deep compare when the key previously existed to see if it changed
    if (!isEqual(props.images[key], oldProps.images[key])) {
      changedKeys.push(key);
    }
  }

  for (const key of changedKeys) {
    const imageData = props.images[key];
    if (!imageData) {
      continue;
    }

    if (Array.isArray(imageData)) {
      (images as any)[key] = imageData.map((x) => loadTexture(device, x));
    } else {
      images[key] = loadTexture(device, imageData as any);
    }
    imagesDirty = true;
  }

  if (imagesDirty) {
    return images;
  }

  return null;
}

/**
 * Create Texture2D object from image data
 *
 * @param   device device context
 * @param   imageData input object representing image
 *
 * @return  Texture2D object representing image
 */
function loadTexture(
  device: Device,
  imageData: (TextureProps & DeprecatedWebGLTextureProps) | Texture
) {
  if (!imageData) {
    return null;
  }

  if (imageData instanceof Texture) {
    return imageData;
  }

  let textureParams = {
    ...imageData,
    parameters: {
      ...DEFAULT_TEXTURE_PARAMETERS,
      ...imageData.parameters,
    },
  };

  return device.createTexture(textureParams);
}
