import GL from "@luma.gl/constants";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import fs from "./bands-simple-mesh-layer-fragment";
import { Model, Geometry, isWebGL2 } from "@luma.gl/core";
import { shouldComposeModelMatrix } from "./matrix";
import { project32, phongLighting, picking, log } from "@deck.gl/core";
import { ProgramManager } from "@luma.gl/engine";

function validateGeometryAttributes(attributes) {
  log.assert(
    attributes.positions || attributes.POSITION,
    'SimpleMeshLayer requires "postions" or "POSITION" attribute in mesh property.'
  );
}

/*
 * Convert mesh data into geometry
 * @returns {Geometry} geometry
 */
function getGeometry(data) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);
    if (data instanceof Geometry) {
      return data;
    } else {
      return new Geometry(data);
    }
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data);
    return new Geometry({
      attributes: data,
    });
  }
  throw Error("Invalid mesh");
}

const DEFAULT_COLOR = [0, 0, 0, 255];

const defaultProps = {
  ...SimpleMeshLayer.defaultProps,
  modules: { type: "array", value: [], compare: true },
  asyncModuleUniforms: {
    type: "object",
    value: {},
    compare: true,
    async: true,
  },
  moduleUniforms: { type: "object", value: {}, compare: true },
};

export default class BandsSimpleMeshLayer extends SimpleMeshLayer {
  getShaders() {
    const transpileToGLSL100 = !isWebGL2(this.context.gl);
    const { modules = [] } = this.props;

    // use object.assign to make sure we don't overwrite existing fields like `vs`, `modules`...
    return Object.assign({}, super.getShaders(), {
      fs,
      transpileToGLSL100,
      modules: [project32, phongLighting, picking, ...modules],
    });
  }

  updateState({ props, oldProps, changeFlags }) {
    super.updateState({ props, oldProps, changeFlags });

    if (
      props.mesh !== oldProps.mesh ||
      changeFlags.extensionsChanged ||
      props.modules !== oldProps.modules
    ) {
      if (this.state.model) {
        this.state.model.delete();
      }
      if (props.mesh) {
        this.setState({ model: this.getModel(props.mesh) });

        const attributes = props.mesh.attributes || props.mesh;
        this.setState({
          hasNormals: Boolean(attributes.NORMAL || attributes.normals),
        });
      }
      this.getAttributeManager().invalidateAll();
    }

    if (this.state.model) {
      this.state.model.setDrawMode(
        this.props.wireframe ? GL.LINE_STRIP : GL.TRIANGLES
      );
    }
  }

  draw({ uniforms }) {
    const { model } = this.state;
    const { moduleUniforms, asyncModuleUniforms } = this.props;

    // Wait for asyncModuleUniforms to have >=1 truthy key before rendering
    // Important to prevent both flickering and "instanced rendering of wrong
    // data". Without this check, sometimes when panning to a new area, new
    // tiles will be a checkerboard of one existing tile while waiting for the
    // new textures to load.
    if (
      !model ||
      Object.keys(asyncModuleUniforms).length === 0 ||
      !Object.values(asyncModuleUniforms).every((item) => item)
    ) {
      return;
    }

    const { viewport } = this.context;
    const { sizeScale, coordinateSystem, _instanced } = this.props;

    model
      .setUniforms(
        Object.assign({}, uniforms, {
          sizeScale,
          composeModelMatrix:
            !_instanced || shouldComposeModelMatrix(viewport, coordinateSystem),
          flatShading: !this.state.hasNormals,
        })
      )
      .updateModuleSettings({ ...asyncModuleUniforms, ...moduleUniforms })
      .draw();
  }

  getModel(mesh) {
    const { gl } = this.context;

    ProgramManager.getDefaultProgramManager(gl).addShaderHook(
      "fs:DECKGL_MUTATE_COLOR(inout vec4 image, in vec2 coord)"
    );

    ProgramManager.getDefaultProgramManager(gl).addShaderHook(
      "fs:DECKGL_CREATE_COLOR(inout vec4 image, in vec2 coord)"
    );

    const model = new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: getGeometry(mesh),
        isInstanced: true,
      })
    );

    return model;
  }
}

BandsSimpleMeshLayer.layerName = "BandsSimpleMeshLayer";
BandsSimpleMeshLayer.defaultProps = defaultProps;
