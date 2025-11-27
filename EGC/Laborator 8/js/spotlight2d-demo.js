let spotlight2DInstance;

function startSpotlight2DDemo() {
  if (spotlight2DInstance) return;

  spotlight2DInstance = new p5((p) => {
    const W = 600;
    const H = 400;

    // light position & direction (in screen space)
    let lightPos;
    let lightDir; // normalized vector for spotlight axis
    let cutoffDeg = 30; // spotlight cutoff angle
    let cutoffRad;

    p.setup = function () {
      const canvas = p.createCanvas(W, H);
      canvas.parent("p5-spotlight-2d");

      lightPos = p.createVector(W * 0.25, H * 0.5);
      lightDir = p.createVector(1, 0).normalize(); // pointing to the right
      cutoffRad = p.radians(cutoffDeg);

      p.noStroke();
      p.textFont("monospace");
    };

    p.draw = function () {
      p.background(20);

      // test point = mouse position (clamped to canvas)
      const testPos = p.createVector(
        p.constrain(p.mouseX, 0, W),
        p.constrain(p.mouseY, 0, H)
      );

      // vector de la lumină spre punct (−L din formulă)
      const Ldir = p5.Vector.sub(testPos, lightPos).normalize();

      // spot = dot(-L, light_dir)  -> aici dot(Ldir, lightDir)
      const spot = Ldir.dot(lightDir);
      const cosCutoff = Math.cos(cutoffRad);

      const inside = spot > cosCutoff;

      // --- draw cone area (two boundary rays) ---
      p.push();
      p.translate(lightPos.x, lightPos.y);

      // draw cone axis
      p.stroke(255, 255, 0, 200);
      p.strokeWeight(2);
      p.line(0, 0, lightDir.x * 180, lightDir.y * 180);

      // cone boundaries
      p.stroke(255, 255, 0, 120);
      const axisAngle = Math.atan2(lightDir.y, lightDir.x);
      const a0 = axisAngle - cutoffRad;
      const a1 = axisAngle + cutoffRad;

      const r = 200;
      p.line(0, 0, Math.cos(a0) * r, Math.sin(a0) * r);
      p.line(0, 0, Math.cos(a1) * r, Math.sin(a1) * r);

      // soft cone fill (just cosmetic)
      p.noStroke();
      p.fill(255, 255, 0, 25);
      p.beginShape();
      p.vertex(0, 0);
      p.vertex(Math.cos(a0) * r, Math.sin(a0) * r);
      p.vertex(Math.cos(a1) * r, Math.sin(a1) * r);
      p.endShape(p.CLOSE);

      p.pop();

      // --- draw light source as a small circle ---
      p.noStroke();
      p.fill(255, 255, 0);
      p.circle(lightPos.x, lightPos.y, 10);

      // --- draw test point ---
      p.stroke(0);
      if (inside) {
        p.fill(0, 200, 0); // green if inside cone
      } else {
        p.fill(120); // grey if outside
      }
      p.circle(testPos.x, testPos.y, 12);

      // --- draw line from light to test point ---
      p.stroke(100);
      p.line(lightPos.x, lightPos.y, testPos.x, testPos.y);

      // --- text info ---
      p.noStroke();
      p.fill(255);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(14);

      let y = 10;
      const x = 10;
      p.text("light_dir → axis of cone", x, y);
      y += 18;
      p.text("cutoff = " + cutoffDeg.toFixed(1) + "°", x, y);
      y += 18;
      p.text("spot = dot(-L, light_dir) ≈ " + spot.toFixed(3), x, y);
      y += 18;
      p.text("cos(cutoff) ≈ " + cosCutoff.toFixed(3), x, y);
      y += 18;
      p.text("inside cone? " + (inside ? "YES" : "NO"), x, y);
    };
  });
}
