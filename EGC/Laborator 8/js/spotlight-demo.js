// spotlight-demo.js

function createSpotlightDemo(containerId, useInnerCutoff = false) {
  // evităm să recreăm dacă există deja
  if (!window.spotlightInstances) window.spotlightInstances = {};
  if (window.spotlightInstances[containerId]) return;

  const sketch = (p) => {
    let spotPos;
    let cutoffDeg = 30;
    let infoText;

    p.setup = function () {
      const canvas = p.createCanvas(600, 400, p.WEBGL);
      canvas.parent(containerId);
      p.noStroke();

      spotPos = p.createVector(0, 0, 300);

      infoText = p.createP("");
      infoText.parent(containerId);
      infoText.style("color", "#fff");
      infoText.style("font-family", "monospace");
      infoText.style("margin", "8px 0 0 0");
      infoText.style("white-space", "pre");
      infoText.style("font-size", "12px");
      infoText.style("text-align", "left");
    };

    p.keyPressed = function () {
      if (p.key === "+" || p.key === "=") {
        cutoffDeg = Math.min(80, cutoffDeg + 2);
      }
      if (p.key === "-" || p.key === "_") {
        cutoffDeg = Math.max(5, cutoffDeg - 2);
      }
    };

    p.draw = function () {
      p.background(30);

      const moveSpeed = 5;
      if (p.keyIsDown(87)) spotPos.z -= moveSpeed; // W
      if (p.keyIsDown(83)) spotPos.z += moveSpeed; // S
      if (p.keyIsDown(65)) spotPos.x -= moveSpeed; // A
      if (p.keyIsDown(68)) spotPos.x += moveSpeed; // D

      let cutOff = p.radians(cutoffDeg);

      p.ambientLight(30);

      let target = p.createVector(0, 0, 0);
      let dir = p.createVector(0, 0, -1).normalize();
      let L = p5.Vector.sub(target, spotPos).normalize();
      let spotEffect = L.dot(dir);

      let lightAtt = 0;

      if (spotEffect > 0) {
        if (!useInnerCutoff) {
          // OUTER CUTOFF: cutoffDeg = marginea conului
          if (spotEffect > Math.cos(cutOff)) {
            lightAtt = 1.0;
          } else {
            lightAtt = 0.0;
          }
        } else {
          // INNER CUTOFF: cutoffDeg = unghi interior, outer este fix mai mare
          const outerDeg = 80;
          const innerCut = p.radians(cutoffDeg);
          const outerCut = p.radians(outerDeg);

          const cosInner = Math.cos(innerCut);
          const cosOuter = Math.cos(outerCut);

          if (spotEffect >= cosInner) {
            lightAtt = 1.0;
          } else if (spotEffect <= cosOuter) {
            lightAtt = 0.0;
          } else {
            let t = (spotEffect - cosOuter) / (cosInner - cosOuter);
            t = p.constrain(t, 0, 1);
            lightAtt = t * t; // smooth falloff
          }
        }
      }

      let intensity = 255 * lightAtt;

      if (intensity > 0.01) {
        p.pointLight(
          intensity,
          intensity,
          intensity,
          spotPos.x,
          spotPos.y,
          spotPos.z
        );
      }

      p.push();
      p.ambientMaterial(100, 50, 200);
      p.sphere(150);
      p.pop();

      if (infoText) {
        infoText.html(
          "Mode: " +
            (useInnerCutoff
              ? "INNER cutoff (inner cone + soft outer)"
              : "OUTER cutoff (hard edge)") +
            "\nW/S: +/-Z, A/D: +/-X" +
            "\n- / +: cutoff angle" +
            "\nCutoff: " +
            cutoffDeg.toFixed(1) +
            "°" +
            (useInnerCutoff ? " (inner)" : " (outer)") +
            "\nSpot: (" +
            spotPos.x.toFixed(1) +
            ", " +
            spotPos.y.toFixed(1) +
            ", " +
            spotPos.z.toFixed(1) +
            ")"
        );
      }
    };
  };

  const instance = new p5(sketch);
  window.spotlightInstances[containerId] = instance;
}
