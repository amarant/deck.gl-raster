import {BitmapLayer, BitmapLayerProps} from '@deck.gl/layers';
import isEqual from 'lodash.isequal';

import {loadImages} from '../images';
import fs from './raster-layer-webgl2.fs.glsl';
import vs from './raster-layer-webgl2.vs.glsl';
import {
  DefaultProps,
  LayerContext,
  TextureSource,
  UpdateParameters,
  getShaderAssembler,
} from '@deck.gl/core';
import {RenderPass, Texture, UniformValue} from '@luma.gl/core';

const defaultProps: DefaultProps<RasterLayerProps> = {
  ...BitmapLayer.defaultProps,
  modules: {type: 'array', value: [], compare: true},
  images: {type: 'object', value: {}, compare: true},
  moduleProps: {type: 'object', value: {}, compare: true},
};

export type RasterLayerProps = _RasterLayerProps & BitmapLayerProps;

type _RasterLayerProps = {
  modules?: any[];
  images?: Record<string, TextureSource>;
  moduleProps?: Record<string, any>;
};

export default class RasterLayer extends BitmapLayer<RasterLayerProps> {
  static layerName = 'RasterLayer';
  static defaultProps = defaultProps;

  declare state: BitmapLayer['state'] & {
    images: Record<string, Texture>;
  };

  initializeState() {
    const shaderAssembler = getShaderAssembler();

    const fsStr1 = 'fs:DECKGL_MUTATE_COLOR(inout vec4 image, in vec2 coord)';
    const fsStr2 = 'fs:DECKGL_CREATE_COLOR(inout vec4 image, in vec2 coord)';

    // Only initialize shader hook functions _once globally_
    // Since the program manager is shared across all layers, but many layers
    // might be created, this solves the performance issue of always adding new
    // hook functions. See #22
    if (!(shaderAssembler as any)._hookFunctions.includes(fsStr1)) {
      shaderAssembler.addShaderHook(fsStr1);
    }
    if (!(shaderAssembler as any)._hookFunctions.includes(fsStr2)) {
      shaderAssembler.addShaderHook(fsStr2);
    }

    // images is a mapping from keys to Texture2D objects. The keys should match
    // names of uniforms in shader modules
    this.setState({images: {}});

    super.initializeState();
  }

  draw({
    uniforms,
    renderPass,
  }: {
    uniforms: Record<string, UniformValue>;
    renderPass: RenderPass;
  }) {
    const {model, images, coordinateConversion, bounds} = this.state;
    const {desaturate, transparentColor, tintColor, moduleProps} = this.props;

    // Render the image
    if (
      !model ||
      !images ||
      Object.keys(images).length === 0 ||
      !Object.values(images).every((item) => item)
    ) {
      return;
    }

    model.setUniforms(
      Object.assign({}, uniforms, {
        desaturate,
        transparentColor: (transparentColor as any).map((x: number) => x / 255),
        tintColor: tintColor.slice(0, 3).map((x) => x / 255),
        coordinateConversion,
        bounds,
      })
    );
    model.updateModuleSettings({
      ...moduleProps,
      ...images,
    });
    model.draw(renderPass);
  }

  getShaders() {
    const {modules = []} = this.props;

    const parentShaders = super.getShaders();
    return {
      ...parentShaders,
      vs,
      fs,
      modules: [...parentShaders.modules, ...modules],
    };
  }

  updateState({props, oldProps, changeFlags, context}: UpdateParameters<this>) {
    const modulesChanged =
      props &&
      props.modules &&
      oldProps &&
      !isEqual(props.modules, oldProps.modules);

    changeFlags.extensionsChanged =
      changeFlags.extensionsChanged || modulesChanged;
    if (props && props.images) {
      this.updateImages({props, oldProps});
    }

    super.updateState({props, oldProps, changeFlags, context});
  }

  updateImages({
    props,
    oldProps,
  }: {
    props: RasterLayerProps;
    oldProps: RasterLayerProps;
  }) {
    const {images} = this.state;
    const {device} = this.context;

    const newImages = loadImages({device, images, props, oldProps});
    if (newImages) {
      this.setState({images: newImages});
    }
  }

  finalizeState(context: LayerContext) {
    super.finalizeState(context);

    if (this.state.images) {
      for (const image of Object.values(this.state.images)) {
        if (Array.isArray(image)) {
          image.map((x: Texture) => x && x.destroy());
        } else {
          image && image.destroy();
        }
      }
    }
  }
}
