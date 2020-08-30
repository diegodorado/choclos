const Hydra = require( 'hydra-synth')
const loop = require( 'raf-loop')
const p5 = require('p5')

const init = () => {

  const hydra = new Hydra()
  console.log(hydra)

  const sketch = ( p ) => {

    let seedModel;
    let textureImg;

    p.preload = () => {
      seedModel = p.loadModel('/choclo.obj', true)
      textureImg = p.loadImage('/choclo.png')
    }

    p.setup = () => { 
      p.createCanvas(hydra.width,hydra.height, p.WEBGL) 

      p.canvas.style.position = "absolute"
      p.canvas.style.bottom = "0px"
      p.canvas.style.left = "0px"
      //hide p5 canvas behind hydra canvas
      p.canvas.style.zIndex = -10

    }
    p.draw = () => {
      p.background(0);
      //p.fill(0)
      //p.strokeWeight(4)
      //p.stroke(255,0,255)
      //p.sphere(100)

      p.texture(textureImg);
      p.model(seedModel);
      p.translate(-300,-300,-200)
      p.model(seedModel);
    }
      
  }

  const p = new p5(sketch,'hydra-ui')

  s0.init({src: p.canvas})

  src(s0)
    .scale(1.5)
    .mult(osc(5, 0.2, 2),0.5)
    .hue(0.04)
    .out()

}

window.onload = init

