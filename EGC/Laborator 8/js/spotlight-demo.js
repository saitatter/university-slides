function createSpotlightDemo(containerId, useInnerCutoff = false) {
  if (!window.spotlightInstances) window.spotlightInstances = {};
  if (window.spotlightInstances[containerId]) return;

  const sketch = (p) => {
    let spotPos;

    // single-cutoff mode
    let cutoffDeg = 30;
    let cutoffSlider;

    // inner/outer mode
    let innerDeg = 25;
    let outerDeg = 50;
    let innerSlider, outerSlider;

    let infoText;

    // --- cameră orbită controlabilă ---
    let camYaw = 0.5;
    let camPitch = 0.3;
    const camDist = 650;
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // mici sfere în jur pentru a vedea conul
    const smallSpheres = [];
    const orbitRadius = 250;
    let orbitAngle = 0; // animație orbită
    let selfRot = 0; // rotația sferei centrale

    p.setup = function () {
      const canvas = p.createCanvas(600, 400, p.WEBGL);
      canvas.parent(containerId);
      p.noStroke();

      spotPos = p.createVector(180, 80, 300);

      // distribuim sferele pe cerc, memorăm unghiul de bază
      const N = 10;
      for (let i = 0; i < N; i++) {
        const baseAngle = (i / N) * p.TWO_PI;
        smallSpheres.push({ baseAngle });
      }

      const uiContainer = p.createDiv();
      uiContainer.parent(containerId);
      uiContainer.style("color", "#fff");
      uiContainer.style("font-family", "monospace");
      uiContainer.style("margin", "8px 0 0 0");
      uiContainer.style("font-size", "12px");
      uiContainer.style("text-align", "left");

      if (!useInnerCutoff) {
        const label = p.createSpan("Cutoff (°): ");
        label.parent(uiContainer);

        cutoffSlider = p.createSlider(5, 80, cutoffDeg, 1);
        cutoffSlider.parent(uiContainer);
        cutoffSlider.style("width", "220px");
      } else {
        const innerLabel = p.createSpan("Inner cutoff (°): ");
        innerLabel.parent(uiContainer);

        innerSlider = p.createSlider(5, 80, innerDeg, 1);
        innerSlider.parent(uiContainer);
        innerSlider.style("width", "180px");

        p.createElement("br").parent(uiContainer);

        const outerLabel = p.createSpan("Outer cutoff (°): ");
        outerLabel.parent(uiContainer);

        outerSlider = p.createSlider(5, 80, outerDeg, 1);
        outerSlider.parent(uiContainer);
        outerSlider.style("width", "180px");
      }

      infoText = p.createP("");
      infoText.parent(uiContainer);
      infoText.style("white-space", "pre");
      infoText.style("margin", "6px 0 0 0");
    };

    p.keyPressed = function () {
      if (p.key === "w" || p.key === "W") spotPos.z -= 10;
      if (p.key === "s" || p.key === "S") spotPos.z += 10;
    };

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
      const eyeY = sinP * camDist + 200;
      const eyeZ = sinY * cosP * camDist;

      p.camera(eyeX, eyeY, eyeZ, 0, 60, 0, 0, 1, 0);
    }

    function drawSpotCone(dir, cutAngleRadInner, cutAngleRadOuter = null) {
      const coneHeight = 450;

      p.push();
      p.translate(spotPos.x, spotPos.y, spotPos.z);

      const baseAxis = p.createVector(0, 1, 0);
      const targetAxis = dir.copy().normalize();

      let rotAxis = baseAxis.cross(targetAxis);
      let angle = Math.acos(p.constrain(baseAxis.dot(targetAxis), -1, 1));

      if (rotAxis.magSq() < 1e-6) {
        rotAxis = p.createVector(1, 0, 0);
      } else {
        rotAxis.normalize();
      }

      p.rotate(angle, rotAxis.x, rotAxis.y, rotAxis.z);

      p.noFill();

      if (cutAngleRadOuter === null) {
        const rOuter = coneHeight * Math.tan(cutAngleRadInner);
        p.stroke(255, 255, 0, 180);
        p.strokeWeight(1);
        p.cone(rOuter, coneHeight, 32, 1);
      } else {
        const rInner = coneHeight * Math.tan(cutAngleRadInner);
        const rOuter2 = Math.max(
          rInner + 1,
          coneHeight * Math.tan(cutAngleRadOuter)
        );

        p.stroke(255, 255, 0, 70);
        p.strokeWeight(1);
        p.cone(rOuter2, coneHeight, 32, 1);

        p.stroke(255, 255, 0, 220);
        p.strokeWeight(1.4);
        p.cone(rInner, coneHeight, 32, 1);
      }

      p.pop();
    }

    p.draw = function () {
      p.background(5);

      updateCamera();

      // animații
      orbitAngle += 0.01; // sferele mici orbitează
      selfRot += 0.01; // sfera centrală se rotește

      if (!useInnerCutoff && cutoffSlider) {
        cutoffDeg = cutoffSlider.value();
      }
      if (useInnerCutoff && innerSlider && outerSlider) {
        innerDeg = innerSlider.value();
        outerDeg = outerSlider.value();
        if (innerDeg >= outerDeg) {
          innerDeg = outerDeg - 1;
          innerSlider.value(innerDeg);
        }
      }

      p.ambientLight(30);

      let dir = p.createVector(0, -0.2, -1).normalize();

      let target = p.createVector(0, 60, 0);
      let L = p5.Vector.sub(target, spotPos).normalize();
      let spotEffect = L.dot(dir);

      let lightAtt = 0.0;

      if (spotEffect > 0.0) {
        if (!useInnerCutoff) {
          const cutOff = p.radians(cutoffDeg);
          const cosCut = Math.cos(cutOff);

          if (spotEffect > cosCut) {
            let t = (spotEffect - cosCut) / (1.0 - cosCut);
            t = p.constrain(t, 0, 1);
            lightAtt = t;
          }
        } else {
          const innerCut = p.radians(innerDeg);
          const outerCut = p.radians(outerDeg);
          const cosInner = Math.cos(innerCut);
          const cosOuter = Math.cos(outerCut);

          if (spotEffect >= cosInner) {
            lightAtt = 1.0;
          } else if (spotEffect > cosOuter) {
            let t = (spotEffect - cosOuter) / (cosInner - cosOuter);
            t = p.constrain(t, 0, 1);
            lightAtt = t * t;
          }
        }
      }

      let intensity = 255 * lightAtt;

      if (intensity > 0.01) {
        const r = useInnerCutoff ? 255 : 160;
        const g = useInnerCutoff ? 210 : 230;
        const b = 150;
        p.pointLight(
          r * lightAtt,
          g * lightAtt,
          b * lightAtt,
          spotPos.x,
          spotPos.y,
          spotPos.z
        );
      }

      // GROUND PLANE
      p.push();
      p.translate(0, 200, 0);
      p.rotateX(p.HALF_PI);
      p.ambientMaterial(25, 25, 40);
      p.plane(1200, 1200);
      p.pop();

      // con / conoare
      if (!useInnerCutoff) {
        const cutOff = p.radians(cutoffDeg);
        drawSpotCone(dir, cutOff);
      } else {
        const innerCut = p.radians(innerDeg);
        const outerCut = p.radians(outerDeg);
        drawSpotCone(dir, innerCut, outerCut);
      }

      // AXA SPOT-ULUI
      p.push();
      p.stroke(255, 255, 0, 180);
      p.strokeWeight(2);
      p.line(
        spotPos.x,
        spotPos.y,
        spotPos.z,
        spotPos.x + dir.x * 400,
        spotPos.y + dir.y * 400,
        spotPos.z + dir.z * 400
      );
      p.pop();

      // LUMINA
      p.push();
      p.translate(spotPos.x, spotPos.y, spotPos.z);
      p.emissiveMaterial(255, 255, 180);
      p.sphere(10);
      p.pop();

      // SFERA MARE – se rotește în jurul propriei axe
      p.push();
      p.translate(0, 60, 0);
      p.rotateY(selfRot);
      p.rotateX(selfRot * 0.4);
      p.ambientMaterial(60, 80, 140);
      p.sphere(120, 32, 24);
      p.pop();

      // SFERE MICI – orbitează în jurul sferei mari
      p.push();
      for (const s of smallSpheres) {
        const ang = s.baseAngle + orbitAngle;
        const x = Math.cos(ang) * orbitRadius;
        const z = Math.sin(ang) * orbitRadius;

        p.push();
        p.translate(x, 40, z);
        p.ambientMaterial(100, 100, 110);
        p.sphere(18, 16, 12);
        p.pop();
      }
      p.pop();

      if (infoText) {
        if (!useInnerCutoff) {
          infoText.html(
            "Mode: LINEAR attenuation (single cutoff)\n" +
              "W/S: move light on Z\n" +
              "RMB drag: rotate camera"
          );
        } else {
          infoText.html(
            "Mode: INNER / OUTER cutoff\n" +
              "W/S: move light on Z\n" +
              "RMB drag: rotate camera"
          );
        }
      }
    };
  };

  const instance = new p5(sketch);
  window.spotlightInstances[containerId] = instance;
}
