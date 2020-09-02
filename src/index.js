import Hydra from 'hydra-synth'
import p5 from 'p5'
import "p5/lib/addons/p5.sound"

// here I will hold a global reference to p5
let p = null

const hydra = new Hydra()
const emojis = document.getElementById('emojis')

const kernels = []

const csvStringToArray = strData =>
{
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
    let arrMatches = null, arrData = [[]];
    while (arrMatches = objPattern.exec(strData)){
        if (arrMatches[1].length && arrMatches[1] !== ",")arrData.push([]);
        arrData[arrData.length - 1].push(arrMatches[2] ?
            arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"") :
            arrMatches[3]);
    }
    return arrData;
}

class Kernel {
  constructor() {
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
    var sep = this.separate()
    var ali = this.align()
    var coh = this.cohesion()
    var ins = this.inside()
    sep.mult(10)
    ali.mult(1)
    coh.mult(1)
    ins.mult(10)

    this.acceleration.mult(0);
    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);
    this.acceleration.add(ins);

    // Update velocity
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);

  }

  inside() {
    var maxX = 300 
    var maxY = 300 
    var maxZ = 300
    var steer = p.createVector(0,0,0);
    if (this.position.x < -maxX)  steer.x = 1
    if (this.position.x >  maxX)  steer.x = -1
    if (this.position.y < -maxY)  steer.y = 1
    if (this.position.y >  maxY)  steer.y = -1
    if (this.position.z < -maxZ)  steer.z = 1
    if (this.position.z >  maxZ)  steer.z = -1
    return steer;
  }

  render(model) {
    p.push()
    p.translate(this.position)
    p.rotateX(p.acos(this.velocity.y/this.velocity.mag()));
    p.rotateZ(p.atan2(-this.velocity.x,this.velocity.z));
    p.scale(0.25)
    p.model(model)
    p.pop()
  }
}

let data = null

const sketch = ( p ) => {
  let kernelModel = null
  let kernelTexture = null
  let shader = null
  let shaderTexture = null

  const createKernel = () => {
    if( kernelModel === null || data === null)
      return

    const k = new Kernel(kernelModel,kernelTexture)
    kernels.push(k)
    const idx = Math.floor(Math.random()*data.length)
    const item = data[idx]

    const pan = Math.random()*2 - 1
    const rate =  Math.random()*0.3+0.8
    item.audio.pan(pan)
    item.audio.rate(rate)
    item.audio.play()
    const msg = document.createElement('div')
    msg.className = 'item'
    msg.textContent = '🍷🥃🍸🤤😵🤮'+'  '+item.phrase
    emojis.appendChild(msg)
    setTimeout(()=> msg.remove(), 3000)
  }

  p.preload = () => {
    kernelModel = p.loadModel('/assets/choclo.obj', true)
    kernelTexture = p.loadImage('/assets/choclo.png')
    shader = p.loadShader('/assets/shader.vert','/assets/shader.frag')
  }

  p.setup = () => { 
    p.createCanvas(hydra.width,hydra.height, p.WEBGL) 
    shaderTexture = p.createGraphics(hydra.width,hydra.height, p.WEBGL) 

    p.canvas.style.position = "absolute"
    p.canvas.style.top = "0px"
    p.canvas.style.left = "0px"

    //hide p5 canvas behind hydra canvas
    p.canvas.style.zIndex = -10

    // load canvas on s0 once loaded
    s0.init({src: p.canvas})

  }

  let lastCreatedAt = 0
  const createInterval = 5
  const maxKernels = 100

  p.draw = () => {
    let t = p.millis()/1000
    shaderTexture.shader(shader);

    shader.setUniform('resolution',[p.width,p.height]);
    shader.setUniform('time',t)
    shaderTexture.rect(0,0,p.width,p.height)


    if(t-lastCreatedAt> createInterval && kernels.length < maxKernels){
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
    //p.texture(kernelTexture)
    p.texture(shaderTexture)
    kernels.forEach( k => {
      k.update()
      k.render(kernelModel)
    })

  }
}


const init = () => {

  p = new p5(sketch,'hydra-ui')

  fetch('ofenses.csv')
    .then(resp => resp.text())
    .then(text => {
      data = csvStringToArray(text)
        .map( (v,i) => {
          const phrase = v[0]
          const country = v[1]
          const path = '/audio/Def_INT-'+(''+(i+1)).padStart(3,'0')+'.mp3'
          const audio = p.loadSound(path)
          return {phrase,country,audio}
        })
    })


  src(s0)
    //.mult(osc(5, 0.2, 2),0.5)
    //.hue(0.04)
    .out()

}

window.onload = init

