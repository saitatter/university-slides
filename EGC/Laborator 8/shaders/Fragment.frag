attribute vec3 aPosition;
attribute vec3 aColor;

varying vec3 vColor;
varying vec2 vPos;   // coordonate 2D în clip space

void main() {
    vColor = aColor;
    vPos = aPosition.xy;
    gl_Position = vec4(aPosition, 1.0);
}