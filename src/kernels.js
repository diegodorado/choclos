import p5 from 'p5'

export const kernels = []

export const createKernel = () => {
  const k = new Kernel()
  kernels.push(k)
  return k
}

const random= (a,b) => {
  return Math.random()*(b-a) + a
}

class Kernel {
  constructor() {
    this.acceleration = new p5.Vector(0,0,0);
    this.velocity = new p5.Vector(random(-1,1),random(-1,1),random(-1,1));
    this.position = new p5.Vector(random(-100,100),random(-100,100),random(-100,100));
    this.r = 10
    this.maxspeed = 3
    this.maxforce = 0.01

  }

  separate() {
    var desiredseparation = 80
    var steer = new p5.Vector(0,0,0);
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
    var steer = new p5.Vector(0,0,0);
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
    var steer = new p5.Vector(0,0,0);
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
    var steer = new p5.Vector(0,0,0);
    if (this.position.x < -maxX)  steer.x = 1
    if (this.position.x >  maxX)  steer.x = -1
    if (this.position.y < -maxY)  steer.y = 1
    if (this.position.y >  maxY)  steer.y = -1
    if (this.position.z < -maxZ)  steer.z = 1
    if (this.position.z >  maxZ)  steer.z = -1
    return steer;
  }

  render(p) {
    p.push()
    p.translate(this.position)
    p.rotateX(p.acos(this.velocity.y/this.velocity.mag()));
    p.rotateZ(p.atan2(-this.velocity.x,this.velocity.z));
    p.scale(0.25)
    p.torus(100,40)
    p.sphere(120)
    p.pop()
  }
}

