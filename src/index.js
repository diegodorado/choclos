import Hydra from 'hydra-synth'
import p5 from 'p5'
import "p5/lib/addons/p5.sound"

// here I will hold a global reference to p5
let p = null

const hydra = new Hydra()

const kernels = []
 
class Kernel {
  constructor(model,texture) {
    this.model =  model
    this.texture = texture
    this.acceleration = p.createVector(0,0,0);
    this.velocity = p.createVector(p.random(-1,1),p.random(-1,1),p.random(-1,1));
    this.position = p.createVector(p.random(-100,100),p.random(-100,100),p.random(-100,100));
    this.r = 10
    this.maxspeed = 3
    this.maxforce = 0.01

  }

  separate() {
    var desiredseparation = 80
    var steer = p.createVector(0,0,0);
    var count = 0;
    // For every boid in the system, check if it's too close
    kernels.filter(k=>k!==this).forEach( k => {
      var d = p5.Vector.dist(this.position,k.position);
      // If the distance is less than an arbitrary amount
      if (d < desiredseparation) {
        // Calculate vector pointing away from neighbor
        var diff = p5.Vector.sub(this.position,k.position);
        diff.normalize();
        diff.div(d);        // Weight by distance
        steer.add(diff);
        count++;            // Keep track of how many
      }
    })

    if (count > 0) {
      // Average -- divide by how many
      steer.div(count);
      steer.normalize();
      // Implement Reynolds: Steering = Desired - Velocity
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }

    return steer;
  }

  align() {
    var neighbordist = 200
    var steer = p.createVector(0,0,0);
    var count = 0;
    kernels.filter(k=>k!==this).forEach( k => {
      var d = p5.Vector.dist(this.position,k.position);
      if ((d > 0) && (d < neighbordist)) {
        steer.add(k.velocity);
        count++;
      }
    })
    if (count > 0) {
      steer.div(count);
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    } 

    return steer;
  }

  cohesion() {
    var neighbordist = 200
    var steer = p.createVector(0,0,0);
    var count = 0;
    kernels.filter(k=>k!==this).forEach( k => {
      var d = p5.Vector.dist(this.position,k.position);
      if ((d > 0) && (d < neighbordist)) {
        steer.add(k.position);
        count++;
      }
    })

    if (count > 0) {
      steer.div(count);

      var desired = p5.Vector.sub(steer,this.position);  // A vector pointing from the location to the target
      // Normalize desired and scale to maximum speed
      desired.normalize();
      desired.mult(this.maxspeed);
      // Steering = Desired minus Velocity
      steer = p5.Vector.sub(desired,this.velocity);
      steer.limit(this.maxforce);  // Limit to maximum steering force
    } 

    return steer;
  }

  update() {
    var sep = this.separate();   // Separation
    var ali = this.align();      // Alignment
    var coh = this.cohesion();   // Cohesion
    sep.mult(5)
    ali.mult(1)
    coh.mult(1)

    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
    // Add the force vectors to acceleration
    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);

    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.constrain()

  }

  constrain() {
    if (this.position.x < -p.width/2)  this.position.x = p.width/2
    if (this.position.y < -p.height/2) this.position.y = p.height/2
    if (this.position.x > p.width/2)   this.position.x = -p.width/2
    if (this.position.y > p.height/2)  this.position.y = -p.height/2
    if (this.position.z > 400) this.position.z = -800
    if (this.position.z < -800) this.position.z = 400
  }

  render() {
    p.push()
    p.translate(this.position)

    p.rotateX(p.acos(this.velocity.y/this.velocity.mag()));
    p.rotateZ(p.atan2(-this.velocity.x,this.velocity.z));

    p.push()
    p.scale(0.25)
    p.texture(this.texture)
    p.model(this.model)
    p.pop()

    p.fill(127);
    p.stroke(200);
    //p.cone(this.r*3, this.r*5);

    p.pop()


  }
}

const sketch = ( p ) => {
  let seedModel = null
  let textureImg = null
  let bells

  const createKernel = () => {
    if(seedModel===null)
      return

    const k = new Kernel(seedModel,textureImg)
    kernels.push(k)
  }

  p.preload = () => {
    seedModel = p.loadModel('/assets/choclo.obj', true)
    textureImg = p.loadImage('/assets/choclo.png')
    bells = p.loadSound('/audio/bells.mp3')
  }

  p.setup = () => { 
    p.createCanvas(hydra.width,hydra.height, p.WEBGL) 

    p.canvas.style.position = "absolute"
    p.canvas.style.top = "0px"
    p.canvas.style.left = "0px"

    //hide p5 canvas behind hydra canvas
    p.canvas.style.zIndex = -10

    // load canvas on s0 once loaded
    s0.init({src: p.canvas})

  }

  let lastCreatedAt = 0

  p.draw = () => {
    let t = p.millis()/1000

    if(t-lastCreatedAt> 0.5 && kernels.length < 100){
      createKernel()
      lastCreatedAt = t
    }

    p.background(0);

    let dirY = (p.mouseY / p.height - 0.5) *2;
    let dirX = (p.mouseX / p.width - 0.5) *2;
    p.directionalLight(250, 250, 250, dirX, -dirY, -125);
    p.ambientMaterial(1200);
    p.noStroke()
    p.orbitControl()
    let fov = Math.PI/3
    let cameraZ = (p.height/2.0) / Math.tan(fov/2.0)
    p.perspective(fov, p.width/p.height, cameraZ/100.0, cameraZ*100.0)

    // iterate through kernels, move them and display them
    p.normalMaterial();
    kernels.forEach( k => {
      k.update()
      k.render()
    })

  }
}


const init = () => {

  p = new p5(sketch,'hydra-ui')

  src(s0)
    .scale(1.5)
    .mult(osc(5, 0.2, 2),0.5)
    .hue(0.04)
    .out()

}

window.onload = init

// get rid of white margins and stuff
window.document.body.style = `overflow:hidden;margin:0;width:100%;height:100%`
window.document.documentElement.style = `overflow:hidden;margin:0;width:100%;height:100%`

