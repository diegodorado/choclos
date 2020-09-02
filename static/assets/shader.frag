#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  vec2 st = gl_FragCoord.xy/resolution.xy;
  gl_FragColor = vec4(mod(st.x,0.5),mod(st.y,0.5),time,1.0);
  gl_FragColor = vec4(abs(st.x*2.0-1.0),abs(mod(time,2.0)-1.0),abs(st.y*2.0-1.0),1.0);
}
