// Can't figure this out, it overwrites uniforms with null
function getUniforms(opts = {}) {
  const { image_pan, panWeight = 0 } = opts;
  return {
    bitmapTexture_pan: image_pan,
    panWeight,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_a;
`;

export default {
  name: "combine-bands",
  fs,
  // getUniforms,
  inject: {
    "fs:DECKGL_CREATE_COLOR": `
    float r_band = texture2D(bitmapTexture_r, coord).r;
    float g_band = texture2D(bitmapTexture_g, coord).r;
    float b_band = texture2D(bitmapTexture_b, coord).r;
    float a_band = texture2D(bitmapTexture_a, coord).r;

    image = vec4(r_band, g_band, b_band, a_band);
    `,
  },
};
