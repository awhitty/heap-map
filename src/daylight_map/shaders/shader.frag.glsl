precision mediump float;

// our texture
uniform sampler2D u_day;
uniform sampler2D u_night;
uniform vec3 u_earthToSun;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

float getAngleBetweenSurfaceAndSunlight() {
  float M_PI = 3.1415926535897932384626433832795;
  float TWO_PI = 2.0 * M_PI;
  float phi = (v_texCoord.y / 2.0) * TWO_PI;
  float theta = (v_texCoord.x) * TWO_PI;

  float y = cos(phi);
  float x = sin(phi) * cos(theta);
  float z = sin(phi) * sin(theta);

  vec3 earthNormal = normalize(vec3(x, y, z));
  return dot(earthNormal, u_earthToSun);
}

vec4 blendColors(vec4 day, vec4 night, float angle) {
  if (angle <= -0.1) {
    return night;
  } else if (angle < 0.1) {
    float fractionDay = pow((angle + 0.1) * 5.0, 3.0);
    return (fractionDay * day) + ((1.0 - fractionDay) * night);
  } else if (angle > 0.95 && day.b > day.r && day.b > day.g) {
    float fractionNotReflection = (1.0 - angle) * 20.0;
    return day + (1.0 - fractionNotReflection) * day;
  } else {
    return day;
  }
}

void main() {
  // Look up a pixel from first canvas
  vec4 color1 = texture2D(u_day, v_texCoord);

  // Look up a pixel from second canvas
  vec4 color2 = texture2D(u_night, v_texCoord);

  float angle = getAngleBetweenSurfaceAndSunlight();
  vec4 newColor = blendColors(color1, color2, angle);

  // return the 2 colors multiplied
  gl_FragColor = newColor;
}
