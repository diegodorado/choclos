import Hydra from 'hydra-synth'

const hydra = new Hydra()
// hydra sketch
// src(s0)
  // .out()
//
//
//
// // // s0.init({src: p.canvas})
solid()
.add(src(s0))
// .add(src(s0).mult(noise(4).rotate(()=>time/32)),0.35)
// // // .add(src(s0).mult(noise(4).rotate(()=>time/64)),0.25)
// .modulate(noise(()=>a.fft[2]*3,0.02))
// .modulate(noise(1,0.08),0.25)
  // .modulate(shape(4,0.25,2))
  // .scale([()=>a.fft[2]*4,0.8].smooth(0.99))
// .scale([()=>a.fft[2]*4,0.8].smooth(0.99))
  // .mult(osc(10, 0.1).modulate(noise(4)),0.25)
// //   // .scale(1.2)
  // .hue(2)
  .mult(solid(),0.125)
  .out(o3)
//
  //
  // GRID + Glitches
  //GRID COLOR
  const grid= ()=>
  solid()
  .add(shape(2).repeat(12,12).saturate(4))
  .add(shape(2).repeat(12,12).rotate(1.57)).scale(0.125)
  // .mult(osc(60,0.05,[0.8,0.2]).mult(solid([1,0],0,[0,1])),0.25)// ADDS RED BLUE ITERATION
  // .mult(solid([0,1,0,0]),0.125) // RED EVRY 4
  .saturate(8)
  .contrast(2)
  //ADD TEXTURE BLOCKS
  .mult(shape([4,2].smooth(1)).repeat(1,8).scrollY(0.2,0.05).invert().scale(0.4,10.4).mult(gradient().colorama().saturate(10).mult(osc(10,-0.05,0.8).rotate(1.57))),0.25)
  //
  const tri= ()=> shape(3,0.0125,0.6).rotate(()=>time/-64)
  //
  //MIX GRID
  solid()
  	.add(grid())
  	.modulate(tri())
  	.blend(src(o1).scale(1.02).scrollX(0.01,0.01))// FEEDBACK
  	.mult(osc(120,-0.005).colorama(0.8),0.8)
  	.mult(osc(120,0.005).colorama(1.3),0.8)
  	.add(src(o1).scale(1.05).scrollX(0.01).pixelate (24,24),0.6)// FEEDBACK
  	.blend(src(o1).scale(1.05).scrollX(0.01))// FEEDBACK
  	.mult(solid(),0.25)// DIM GRID HERE
  	.out(o1)
  //
  //IMG
  const logo = document.createElement('img');
  logo.src = 'assets/leaves.png'
  // // //
  logo.onload = () => s1.init({ src: logo})
  const leaves= ()=>
  // osc()
  solid()
  .add(src(s1).scale(0.7)).invert().mult(shape(4,0.7))
  .mult(shape(4.5,()=>a.fft[0]/1).scrollX(0.15))
  // .contrast(()=>a.fft[1]+20*10) // CHANGES LOGO CONTRAST AFFT 3
  // //
  const dist=()=>
  solid()
  .add(src(s1).invert().thresh().scale(0.8).mult(shape(4,0.5)).modulateScale(osc(2,0.5,0.8).rotate(1.57).thresh()))
  .add(src(o2).modulate(shape(4,0.8).repeat(16,16).scrollX(0.2,-0.2).scrollY(0.1,-0.1)),0.6)
  .add(src(o2).modulate(osc(2,0.2).repeat(12,8).scrollX(0.5,-0.1).scrollY(-0.2,0.1)),0.8)
  // .modulateScale(src(o2).scale(0.8).scrollY([-0.3,0.5]),0.5)
  .scale(0.7).scrollX(-1)
  // //
  // // LOGO MIX
  solid()
  	// .add(leaves())
  	.add(leaves().scale(0.8),()=>a.fft[3]*2)
    .add(dist(),()=>a.fft[2],0.1)//CONTROL FEEDBACK
  	.modulate(dist(),1)//CONTROL FEEDBACK
  	.out(o2)
//
// MIX
//
  solid(1,1,1,1)
  	.mult(src(o1))// GRID
    .add(src(o2)) //LOGO
  	.mult(src(o3).invert().thresh().luma()) // P5
  	.add(src(o3)) // P5
  	.out()
//   //
  render(o0)

//give hydra back
export default hydra
