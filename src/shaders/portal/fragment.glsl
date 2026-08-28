uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vPosition;

// Classic Perlin 2D Noise by Stefan Gustavson
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P)
{
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

void main()
{
    // Center UV coordinates
    vec2 centeredUv = vUv - 0.5;
    float dist = length(centeredUv);

    // Polar coordinates for swirling effect
    float angle = atan(centeredUv.y, centeredUv.x);
    float swirl = angle + dist * 7.0 - uTime * 1.8;
    vec2 polarUv = vec2(cos(swirl), sin(swirl)) * dist * 4.0;

    // Multi-layered animated noise
    float noise1 = cnoise(polarUv + uTime * 0.4);
    float noise2 = cnoise(centeredUv * 6.0 - uTime * 0.8);
    float combinedNoise = (noise1 * 0.65 + noise2 * 0.35);

    // Edge radial softness & energetic outer ring
    float edgeMask = 1.0 - smoothstep(0.42, 0.5, dist);
    float outerRing = smoothstep(0.38, 0.48, dist) * (0.8 + 0.2 * sin(uTime * 4.0));
    
    // Core glow and filament brightness
    float coreGlow = smoothstep(0.35, 0.0, dist) * 1.4;
    float filament = smoothstep(0.1, 0.7, combinedNoise + 0.3);

    // Color gradient mixing
    float strength = clamp((combinedNoise + coreGlow * 0.8 + outerRing * 0.5) * uIntensity, 0.0, 1.0);
    vec3 mixedColor = mix(uColorStart, uColorEnd, strength);
    mixedColor += vec3(1.0) * pow(coreGlow, 2.5) * 0.6; // Radiant white hotspot in center

    // Alpha falloff at circular boundary
    float alpha = edgeMask;

    gl_FragColor = vec4(mixedColor, alpha);
}
