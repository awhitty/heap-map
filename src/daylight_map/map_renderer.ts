import { webglUtils } from './webgl-utils';
import { EarthInfo } from './earth_info';

import vertShader from './shaders/shader.vert.glsl';
import fragShader from './shaders/shader.frag.glsl';

function setRectangle(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW,
  );
}

function setupTexture(
  gl: WebGLRenderingContext,
  imageSource: TexImageSource,
  textureUnit: number,
  program: WebGLProgram,
  uniformName: string,
) {
  var tex = gl.createTexture()!;

  updateTextureFromImageSource(gl, tex, imageSource, textureUnit);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  var location = gl.getUniformLocation(program, uniformName);
  gl.uniform1i(location, textureUnit);
}

function updateTextureFromImageSource(
  gl: WebGLRenderingContext,
  tex: WebGLTexture,
  imageSource: TexImageSource,
  textureUnit: number,
) {
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    imageSource,
  );
}

/**
 * Based on algorithm from http://www.edesign.nl/2009/05/14/math-behind-a-world-sunlight-map/
 * Ported per-pixel rendering logic to a WebGL shader to improve performance
 */
export class GLMapRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private dayImg: TexImageSource,
    private nightImg: TexImageSource,
  ) {}

  public buildProgram(): void {
    const gl = this.canvas.getContext('webgl')!;
    const program = webglUtils.createProgramFromSources(
      gl,
      [vertShader, fragShader],
      null,
      null,
      console.warn,
    );
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, this.canvas.width, this.canvas.height);
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        1.0,
      ]),
      gl.STATIC_DRAW,
    );
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(texcoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.vertexAttribPointer(
      texcoordLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    setupTexture(gl, this.dayImg, 0, program, 'u_day');
    setupTexture(gl, this.nightImg, 1, program, 'u_night');

    this.gl = gl;
    this.program = program;
  }

  public render(earthInfo: EarthInfo): void {
    if (this.gl && this.program) {
      const earthToSun = earthInfo.pointingFromEarthToSun;
      const earthToSunLocation = this.gl.getUniformLocation(
        this.program,
        'u_earthToSun',
      );
      this.gl.uniform3f(
        earthToSunLocation,
        earthToSun.x,
        earthToSun.y,
        earthToSun.z,
      );
      const primitiveType = this.gl.TRIANGLES;
      const count = 6;
      this.gl.drawArrays(primitiveType, 0, count);
    }
  }
}
