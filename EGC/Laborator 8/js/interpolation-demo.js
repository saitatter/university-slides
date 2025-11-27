let interpolationInstance;

function startInterpolationDemo() {
  if (interpolationInstance) return;

  interpolationInstance = new p5((p) => {
    const W = 900;
    const H = 300;
    let theShader;

    p.preload = function () {
      const vertSrc = `
        attribute vec3 aPosition;

        varying vec2 vPos;   // coordonate 2D în clip space

        void main() {
          vPos = aPosition.xy;
          gl_Position = vec4(aPosition, 1.0);
        }
      `;

      const fragSrc = `
        precision mediump float;

        varying vec2 vPos; // în [-1, 1]

        // culori per-vertex
        vec3 colA = vec3(1.0, 0.2, 0.2);
        vec3 colB = vec3(0.2, 1.0, 0.2);
        vec3 colC = vec3(0.2, 0.2, 1.0);

        // vârfuri în "clip space" (x,y,z) – doar pentru demo
        vec3 vA = vec3(-0.7, -0.5, 0.2);
        vec3 vB = vec3( 0.0,  0.8, 0.8);
        vec3 vC = vec3( 0.7, -0.3, 0.5);

        struct Bary {
          bool inside;
          float a;
          float b;
          float c;
        };

        Bary barycentric(vec2 p, vec2 a, vec2 b, vec2 c) {
          vec2 v0 = b - a;
          vec2 v1 = c - a;
          vec2 v2 = p - a;

          float d00 = dot(v0, v0);
          float d01 = dot(v0, v1);
          float d11 = dot(v1, v1);
          float d20 = dot(v2, v0);
          float d21 = dot(v2, v1);

          float denom = d00 * d11 - d01 * d01;
          if (abs(denom) < 1e-6) {
            return Bary(false, 0.0, 0.0, 0.0);
          }

          float invDen = 1.0 / denom;
          float v = (d11 * d20 - d01 * d21) * invDen;
          float w = (d00 * d21 - d01 * d20) * invDen;
          float u = 1.0 - v - w;

          bool inside = (u >= 0.0) && (v >= 0.0) && (w >= 0.0);
          return Bary(inside, u, v, w);
        }

        vec3 mixColor(vec3 ca, vec3 cb, vec3 cc, float wa, float wb, float wc) {
          return ca * wa + cb * wb + cc * wc;
        }

        void main() {
          // vPos e în [-1,1]; îl tratăm ca "spațiu ecran"
          vec2 p = vPos;

          // Împărțim pe orizontală în 3 panouri:
          // [-1, -1/3]    -> flat
          // (-1/3, 1/3)   -> noperspective
          // [1/3, 1]      -> smooth
          float leftEdge   = -1.0 / 3.0;
          float rightEdge  =  1.0 / 3.0;

          int mode; // 0=flat, 1=noperspective, 2=smooth
          float offsetX;

          if (p.x <= leftEdge) {
            mode = 0;
            offsetX = -0.7;
          } else if (p.x >= rightEdge) {
            mode = 2;
            offsetX = 0.7;
          } else {
            mode = 1;
            offsetX = 0.0;
          }

          // mutăm triunghiul în panoul respectiv
          vec2 A = vA.xy + vec2(offsetX, 0.0);
          vec2 B = vB.xy + vec2(offsetX, 0.0);
          vec2 C = vC.xy + vec2(offsetX, 0.0);

          Bary bc = barycentric(p, A, B, C);
          if (!bc.inside) {
            gl_FragColor = vec4(0.05, 0.05, 0.05, 1.0);
            return;
          }

          float a = bc.a;
          float b = bc.b;
          float c = bc.c;

          vec3 color;

          // z-urile (adâncimile) – pentru corecția de perspectivă
          float za = vA.z;
          float zb = vB.z;
          float zc = vC.z;

          if (mode == 0) {
            // FLAT – o singură culoare pentru tot triunghiul (de ex. vârful A)
            color = colA;
          } else if (mode == 1) {
            // NOPERSPECTIVE – barycentrice lineare în spațiul ecran
            color = mixColor(colA, colB, colC, a, b, c);
          } else {
            // SMOOTH – corecție de perspectivă cu 1/z
            float wA = a / za;
            float wB = b / zb;
            float wC = c / zc;
            float wSum = wA + wB + wC;
            if (wSum < 1e-6) {
              color = vec3(0.0);
            } else {
              float wa = wA / wSum;
              float wb = wB / wSum;
              float wc = wC / wSum;
              color = mixColor(colA, colB, colC, wa, wb, wc);
            }
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      theShader = p.createShader(vertSrc, fragSrc);
    };

    p.setup = function () {
      const canvas = p.createCanvas(W, H, p.WEBGL);
      canvas.parent("p5-interpolation");
      p.noStroke();
    };

    p.draw = function () {
      p.background(10);

      p.shader(theShader);

      // Desenăm un quad pe tot ecranul în clip space (-1,-1) .. (1,1)
      p.beginShape(p.TRIANGLES);
      p.vertex(-1, -1, 0);
      p.vertex(1, -1, 0);
      p.vertex(1, 1, 0);

      p.vertex(-1, -1, 0);
      p.vertex(1, 1, 0);
      p.vertex(-1, 1, 0);
      p.endShape();

      p.resetShader();
    };
  });
}
