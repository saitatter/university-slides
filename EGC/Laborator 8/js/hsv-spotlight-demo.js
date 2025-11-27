// hsv-spotlight-demo.js

let hsvSpotlightInstance;

function startHSVSpotlightDemo() {
  if (hsvSpotlightInstance) return;

  hsvSpotlightInstance = new p5((p) => {
    const W = 600;
    const H = 400;
    const PLANE_SIZE = 400;

    let theShader;

    // cameră orbită simplă
    let camYaw = 0.5;
    let camPitch = 0.35;
    const camDist = 650;
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // spotlight în spațiul planului (XY, plan la z=0)
    const lightLocal = { x: 0.0, y: 120.0, z: 200.0 }; // deasupra planului
    const cutoffDeg = 30.0;

    p.preload = function () {
      const vertSrc = `
        precision mediump float;

        attribute vec3 aPosition;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        // poziția locală a vârfului (înainte de MV/P)
        varying vec3 vLocalPos;

        void main() {
          vLocalPos = aPosition;
          gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        }
      `;

      const fragSrc = `
        precision mediump float;

        varying vec3 vLocalPos;

        uniform vec3 uLightPos;   // poziția luminii în spațiul planului
        uniform float uCutoffRad; // unghiul de cutoff (radiani)
        uniform float uRadius;    // raza discului HSV

        // HSV (0-360,0-1,0-1) -> RGB (0-1)
        vec3 hsv2rgb(float h, float s, float v) {
          h = mod(h, 360.0);
          float c = v * s;
          float x = c * (1.0 - abs(mod(h / 60.0, 2.0) - 1.0));
          float m = v - c;

          vec3 rgb;

          if (h < 60.0) {
            rgb = vec3(c, x, 0.0);
          } else if (h < 120.0) {
            rgb = vec3(x, c, 0.0);
          } else if (h < 180.0) {
            rgb = vec3(0.0, c, x);
          } else if (h < 240.0) {
            rgb = vec3(0.0, x, c);
          } else if (h < 300.0) {
            rgb = vec3(x, 0.0, c);
          } else {
            rgb = vec3(c, 0.0, x);
          }

          return rgb + vec3(m);
        }

        void main() {
          // planul este în XY, la z=0
          vec2 pos = vLocalPos.xy;
          float distFromCenter = length(pos);

          // în afara discului HSV
          if (distFromCenter > uRadius) {
            gl_FragColor = vec4(0.02, 0.02, 0.04, 1.0);
            return;
          }

          // poziția fragmentului în spațiul planului
          vec3 fragPos = vec3(pos.x, pos.y, 0.0);

          // vector de la lumină la fragment
          vec3 L = normalize(fragPos - uLightPos);

          // direcția axei spotului: în jos spre plan ( -Z )
          vec3 lightDir = normalize(vec3(0.0, 0.0, -1.0));

          // spotlight: spot = dot(-L, light_dir)
          float spot = dot(-L, lightDir);
          float cosCut = cos(uCutoffRad);

          float angularAtt = 0.0;
          if (spot > cosCut) {
            // atenuare unghiulară smooth
            float t = (spot - cosCut) / (1.0 - cosCut);
            t = clamp(t, 0.0, 1.0);
            angularAtt = t * t;
          }

          // atenuare radială față de centru (discul HSV)
          float radial = 1.0 - distFromCenter / uRadius;
          float radialAtt = clamp(radial, 0.0, 1.0);

          float intensity = angularAtt * radialAtt;

          if (intensity <= 0.0005) {
            gl_FragColor = vec4(0.02, 0.02, 0.04, 1.0);
            return;
          }

          // Hue = unghiul poziției față de centru (cercul HSV)
          float angle = atan(pos.y, pos.x); // [-PI, PI]
          float hue = degrees(angle);
          if (hue < 0.0) hue += 360.0;

          float sat = 1.0;
          float val = intensity; // brightness = intensitatea spotului

          vec3 rgb = hsv2rgb(hue, sat, val);
          gl_FragColor = vec4(rgb, 1.0);
        }
      `;

      theShader = p.createShader(vertSrc, fragSrc);
    };

    p.setup = function () {
      const canvas = p.createCanvas(W, H, p.WEBGL);
      canvas.parent("p5-hsv-spotlight");
      p.noStroke();
      canvas.elt.oncontextmenu = () => false; // disable RMB menu
    };

    // orbit camera cu RMB drag
    p.mousePressed = function () {
      if (p.mouseButton === p.RIGHT) {
        isRotating = true;
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
        return false;
      }
    };

    p.mouseReleased = function () {
      if (p.mouseButton === p.RIGHT) {
        isRotating = false;
      }
    };

    function updateCamera() {
      if (isRotating) {
        const dx = p.mouseX - lastMouseX;
        const dy = p.mouseY - lastMouseY;

        camYaw += dx * 0.01;
        camPitch += dy * 0.01;
        camPitch = p.constrain(camPitch, -0.9, 0.9);

        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
      }

      const cosP = Math.cos(camPitch);
      const sinP = Math.sin(camPitch);
      const cosY = Math.cos(camYaw);
      const sinY = Math.cos(Math.PI / 2 - camYaw)
        ? Math.sin(camYaw)
        : Math.sin(camYaw);

      const eyeX = Math.cos(camYaw) * cosP * camDist;
      const eyeY = sinP * camDist + 200;
      const eyeZ = Math.sin(camYaw) * cosP * camDist;

      // ne uităm spre centrul planului (0,0,0)
      p.camera(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);
    }

    p.draw = function () {
      p.background(5);
      updateCamera();

      // folosim shaderul custom pentru plan
      p.shader(theShader);

      theShader.setUniform("uLightPos", [
        lightLocal.x,
        lightLocal.y,
        lightLocal.z,
      ]);
      theShader.setUniform("uCutoffRad", p.radians(cutoffDeg));
      theShader.setUniform("uRadius", PLANE_SIZE * 0.45);

      // plan în XY, la z = 0 (NU îl rotim)
      p.push();
      p.plane(PLANE_SIZE, PLANE_SIZE, 1, 1);
      p.pop();

      // oprim shaderul, restul se desenează normal
      p.resetShader();

      // spotlight vizibil – sferă
      p.push();
      p.translate(lightLocal.x, lightLocal.y, lightLocal.z);
      p.emissiveMaterial(255, 255, 200);
      p.sphere(12);
      p.pop();

      // linie de la lumină la plan pe axa Z
      p.push();
      p.stroke(255, 255, 0, 200);
      p.strokeWeight(2);
      p.line(
        lightLocal.x,
        lightLocal.y,
        lightLocal.z,
        lightLocal.x,
        lightLocal.y,
        0
      );
      p.pop();

      // text 2D explicativ
      p.push();
      p.resetMatrix();
      p.translate(-W / 2 + 10, -H / 2 + 10);
      p.fill(255);
      p.textSize(12);
      p.textAlign(p.LEFT, p.TOP);
      p.text(
        "Spot-light pe plan (shader custom)\n" +
          "Culoare pe plan = HSV:\n" +
          "  Hue   = unghi față de centru\n" +
          "  Value = angularAtt * radialAtt\n" +
          "spot = dot(-L, light_dir), cutoff = " +
          cutoffDeg.toFixed(0) +
          "°\n" +
          "RMB drag: orbită cameră",
        0,
        0
      );
      p.pop();
    };
  });
}
