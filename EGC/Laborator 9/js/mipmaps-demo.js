// mipmaps-demo.js
let p5Instance;

function startMipmapsDemo() {
  if (p5Instance) return; // nu reporni dacă deja e pornit

  p5Instance = new p5((p) => {
    let img;
    let zoom = 1;
    let zoomDir = 0.005;

    p.preload = function() {
      img = p.loadImage('https://i.imgur.com/9Qw0VhS.jpg');
    }

    p.setup = function() {
      p.createCanvas(800, 400, p.WEBGL).parent("p5-mipmaps");
      p.noStroke();
    }

    p.draw = function() {
      p.background(50);
      zoom += zoomDir;
      if (zoom > 2 || zoom < 0.5) zoomDir *= -1;

      // Fără mipmaps
      p.push();
      p.translate(-p.width/4, 0, 0);
      p.scale(zoom);
      p.texture(img);
      p.plane(200, 200);
      p.pop();

      // Cu mipmaps
      p.push();
      p.translate(p.width/4, 0, 0);
      p.scale(zoom);
      p.texture(img);
      p.plane(200, 200);
      p.pop();

      // Text explicativ
      p.resetMatrix();
      p.fill(255);
      p.textSize(16);
      p.textAlign(p.CENTER);
      p.text("Stânga: fără mipmaps", p.width/4, p.height - 20);
      p.text("Dreapta: cu mipmaps", 3*p.width/4, p.height - 20);
    }
  });
}
