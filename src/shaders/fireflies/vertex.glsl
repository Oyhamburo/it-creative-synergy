uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;
attribute float aOffset;

varying float vAlpha;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Floating wavy organic motion
    modelPosition.y += sin(uTime * 1.5 + aOffset * 6.28) * (aScale * 0.25);
    modelPosition.x += cos(uTime * 0.8 + aOffset * 3.14) * (aScale * 0.15);
    modelPosition.z += sin(uTime * 1.1 + aOffset * 9.42) * (aScale * 0.15);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    // Size attenuation based on distance and device pixel ratio
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Twinkling alpha
    vAlpha = 0.6 + 0.4 * sin(uTime * 2.5 + aOffset * 10.0);
}
