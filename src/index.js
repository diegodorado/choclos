const Hydra = require( 'hydra-synth')
const loop = require( 'raf-loop')
const p5 = require('p5')
 
class Kernel {
  constructor(p,model,texture) {
    this.model =  model
    this.texture = texture
    this.x = p.random(-500,500);
    this.y = p.random(-500,500);
    this.z = -1000;
    this.speed = p.random(1,10)
  }

  move(p) {
    this.x += p.random(-this.speed, this.speed);
    this.y += p.random(-this.speed, this.speed);
  }

  display(p) {
    p.push()
    p.translate(this.x, this.y,this.z)
    p.texture(this.texture)
    p.model(this.model)
    p.pop()
  }
}

const init = () => {

  const hydra = new Hydra()

  const sketch = ( p ) => {

    let seedModel;
    let textureImg;
    let k1,k2,k3;

    p.preload = () => {
      seedModel = p.loadModel('/assets/choclo.obj', true)
      textureImg = p.loadImage('/assets/choclo.png')
    }

    p.setup = () => { 
      p.createCanvas(hydra.width,hydra.height, p.WEBGL) 

      k1 = new Kernel(p,seedModel,textureImg)
      k2 = new Kernel(p,seedModel,textureImg)
      k3 = new Kernel(p,seedModel,textureImg)


      p.canvas.style.position = "absolute"
      p.canvas.style.bottom = "0px"
      p.canvas.style.left = "0px"
      //hide p5 canvas behind hydra canvas
      p.canvas.style.zIndex = -10

      // load canvas on s0 once loaded
      s0.init({src: p.canvas})

    }
    p.draw = () => {
      p.background(0);

      k1.display(p)
      k2.display(p)
      k3.display(p)

      k1.move(p)
      k2.move(p)
      k3.move(p)
    }
      
  }

  const p = new p5(sketch,'hydra-ui')


  src(s0)
    .scale(1.5)
    .mult(osc(5, 0.2, 2),0.5)
    .hue(0.04)
    .out()

}

window.onload = init
window.document.body.style = `overflow:hidden;margin:0;width:100%;height:100%`
window.document.documentElement.style = `overflow:hidden;margin:0;width:100%;height:100%`

