import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {RenderPass, Texture, UniformValue} from '@luma.gl/core';
import {
  project32,
  phongLighting,
  log,
  LayerContext,
  DefaultProps,
  TextureSource,
  UpdateParameters,
  PickingInfo,
  Layer,
} from '@deck.gl/core';

import {shouldComposeModelMatrix} from './matrix';
import {loadImages} from '../images';
import fs from './raster-mesh-layer-webgl2.fs.glsl';
import vs from './raster-mesh-layer-webgl2.vs.glsl';
import {ShaderAssembler} from '@luma.gl/shadertools';
import {Geometry, Model} from '@luma.gl/engine';
import type {MeshAttribute, MeshAttributes} from '@loaders.gl/schema';
import {RasterLayerProps} from '../raster-layer/raster-layer';

type Mesh =
  | Geometry
  | {
      attributes: MeshAttributes;
      indices?: MeshAttribute;
    }
  | MeshAttributes;

function validateGeometryAttributes(attributes: any) {
  log.assert(
    attributes.positions || attributes.POSITION,
    'RasterMeshLayer requires "postions" or "POSITION" attribute in mesh property.'
  );
}

/*
 * Convert mesh data into geometry
 * @returns {Geometry} geometry
 */
function getGeometry(data: Mesh) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);
    if (data instanceof Geometry) {
      return data;
    } else {
      return new Geometry({...data, topology: 'triangle-list'});
    }
  }
  // TODO - support other mesh formats
  //  else if (data.positions || data.POSITION) {
  //   validateGeometryAttributes(data);
  //   return new Geometry({
  //     attributes: data,
  //   });
  // }
  throw Error('Invalid mesh');
}

const defaultProps: any /*DefaultProps<RasterMeshLayerProps>*/ = {
  ...SimpleMeshLayer.defaultProps,
  // ...Layer.defaultProps,
  modules: {type: 'array', value: [], compare: true},
  images: {type: 'object', value: {}, compare: true},
  moduleProps: {type: 'object', value: {}, compare: true},
};

export type RasterMeshLayerProps = _RasterMeshLayerProps & SimpleMeshLayer;

type _RasterMeshLayerProps = {
  modules?: any[];
  images?: Record<string, TextureSource>;
  moduleProps?: Record<string, any>;
  // onHover?: ((pickingInfo: PickingInfo, event: any) => boolean) | null;
};

export default class RasterMeshLayer extends SimpleMeshLayer<
  any,
  RasterMeshLayerProps
> {
  static layerName = 'RasterMeshLayer';
  static defaultProps = defaultProps;

  declare state: SimpleMeshLayer['state'] & {
    images: Record<string, Texture>;
  };

  initializeState() {
    const shaderAssembler = ShaderAssembler.getDefaultShaderAssembler();

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

  getShaders() {
    const {modules = []} = this.props;
    return {
      ...super.getShaders(),
      vs,
      fs,
      modules: [project32, phongLighting, ...modules],
    };
  }

  updateState(params: UpdateParameters<this>) {
    super.updateState(params);

    const {props, oldProps, changeFlags} = params;
    if (
      props.mesh !== oldProps.mesh ||
      changeFlags.extensionsChanged ||
      props.modules !== oldProps.modules
    ) {
      this.state.model?.destroy();
      if (props.mesh) {
        this.setState({model: this.getModel(props.mesh as Mesh)});

        const attributes = (props.mesh as any).attributes || props.mesh;
        this.setState({
          hasNormals: Boolean(attributes.NORMAL || attributes.normals),
        });
      }
      this.getAttributeManager()?.invalidateAll();
    }

    if (props && props.images) {
      this.updateImages({props, oldProps});
    }

    if (this.state.model) {
      this.state.model.setTopology(
        this.props.wireframe ? 'line-strip' : 'triangle-list'
      );
    }
  }

  updateImages({
    props,
    oldProps,
  }: {
    props: RasterMeshLayerProps;
    oldProps: RasterMeshLayerProps;
  }) {
    const {images} = this.state;
    const {device} = this.context;

    const newImages = loadImages({
      device,
      images,
      props: props as any,
      oldProps: oldProps as any,
    });

    if (newImages) {
      this.setState({images: newImages});
    }
  }

  draw({
    uniforms,
    renderPass,
  }: {
    uniforms: Record<string, UniformValue>;
    renderPass: RenderPass;
  }) {
    const {model, images} = this.state;
    const {moduleProps} = this.props;

    // Render the image
    if (
      !model ||
      !images ||
      Object.keys(images).length === 0 ||
      !Object.values(images).every((item) => item)
    ) {
      return;
    }

    const {viewport} = this.context;
    const {sizeScale, coordinateSystem, _instanced} = this.props;

    model.setUniforms(
      Object.assign({}, uniforms, {
        sizeScale,
        composeModelMatrix:
          !_instanced || shouldComposeModelMatrix(viewport, coordinateSystem),
        flatShading: !this.state.hasNormals,
      })
    );
    model.updateModuleSettings({
      ...moduleProps,
      ...images,
    });
    model.draw(renderPass);
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

  getModel(mesh: Mesh) {
    const {device} = this.context;
    const model = new Model(
      device,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: getGeometry(mesh),
        isInstanced: true,
      })
    );

    return model;
  }
}
