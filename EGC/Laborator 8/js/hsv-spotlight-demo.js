// hsv-spotlight-demo.js

let hsvSpotlightInstance;

function startHSVSpotlightDemo() {
  if (hsvSpotlightInstance) return;

  hsvSpotlightInstance = new p5((p) => {
    const W = 600;
    const H = 400;

    // cameră orbită simplă
    let camYaw = 0.4;
    let camPitch = 0.35;
    const camDist = 600;
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // spotlight position & direction
    let spotPos;
    let dir; // spre podea

    p.setup = function () {
      const canvas = p.createCanvas(W, H, p.WEBGL);
      canvas.parent("p5-hsv-spotlight");
      p.noStroke();

      spotPos = p.createVector(0, 200, 200); // un pic în față și sus
      dir = p.createVector(0, -1, -0.4).normalize();

      // dezactivăm contextmenu doar pe canvas
      canvas.elt.oncontextmenu = () => false;
    };

    // cameră orbită cu click dreapta
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
      const sinY = Math.sin(camYaw);

      const eyeX = cosY * cosP * camDist;
      const eyeY = sinP * camDist + 180;
      const eyeZ = sinY * cosP * camDist;

      // ne uităm spre (0,0,0) – centrul discului HSV
      p.camera(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);
    }

    function drawHueDisc(radius, steps) {
      p.push();
      // podea: disc HSV în XZ, la y = 0
      p.rotateX(-p.HALF_PI); // punem discul în plan XZ
      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();

      const centerX = 0;
      const centerY = 0;

      for (let i = 0; i < steps; i++) {
        const a0 = (i / steps) * p.TWO_PI;
        const a1 = ((i + 1) / steps) * p.TWO_PI;

        const x0 = Math.cos(a0) * radius;
        const y0 = Math.sin(a0) * radius;
        const x1 = Math.cos(a1) * radius;
        const y1 = Math.sin(a1) * radius;

        const hue = ((a0 * 180) / Math.PI + 360) % 360;

        p.fill(hue, 100, 100); // culoare în funcție de unghi (Hue)

        p.beginShape();
        p.vertex(centerX, centerY, 0);
        p.vertex(x0, y0, 0);
        p.vertex(x1, y1, 0);
        p.endShape(p.CLOSE);
      }

      p.colorMode(p.RGB, 255);
      p.pop();
    }

    function drawSpotConeVisual() {
      const coneHeight = 350;

      p.push();
      p.translate(spotPos.x, spotPos.y, spotPos.z);

      // vrem ca axa conului (+Y local) să fie aproximativ dir
      // simplificat: îl înclinăm puțin spre în jos și spre centru (0,0,0)
      // ca demo vizual – nu e hard physically exact
      const toCenter = p.createVector(0, 0, 0).sub(spotPos).normalize();
      const yaw = Math.atan2(toCenter.x, toCenter.z);
      const pitch = -Math.asin(toCenter.y);

      p.rotateY(yaw);
      p.rotateX(p.HALF_PI + pitch); // ca să îl orientăm spre disc

      p.noFill();
      p.stroke(255, 255, 255, 160);
      p.strokeWeight(1);
      const cutOff = p.radians(35);
      const r = coneHeight * Math.tan(cutOff);
      p.cone(r, coneHeight, 40, 1);

      p.pop();
    }

    p.draw = function () {
      p.background(5);

      updateCamera();

      // lumină ambientală ușoară
      p.ambientLight(40);

      // flare-ul "spotlight" – doar ca highlight vizual
      p.pointLight(255, 255, 255, spotPos.x, spotPos.y, spotPos.z);

      // disc HSV pe "podea"
      drawHueDisc(220, 120);

      // spotlight vizibil: sferă + con
      p.push();
      p.translate(spotPos.x, spotPos.y, spotPos.z);
      p.emissiveMaterial(255, 255, 200);
      p.sphere(12);
      p.pop();

      drawSpotConeVisual();

      // mic text în colț
      p.push();
      p.resetMatrix();
      p.translate(-W / 2 + 10, -H / 2 + 15);
      p.fill(255);
      p.textSize(12);
      p.textAlign(p.LEFT, p.TOP);
      p.text(
        "Hue wheel în planul podelei (model HSV)\n" +
          "Click dreapta + drag: orbită cameră",
        0,
        0
      );
      p.pop();
    };
  });
}
