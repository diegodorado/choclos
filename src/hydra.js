import Hydra from 'hydra-synth'

// BEGIN MAGIA MIDI
//defino mis variables
let cc = Array(128).fill(0)
let notes = Array(128).fill(0)
let lastCc = -1
let lastNote = -1
//
//declaro un handler de eventos midi
const midiHandler = (e) => {
  const m = e.data
  const type = m[0] & 0xF0
  const channel = m[0] & 0x0F

  // filter by channel. 
  // warning: it is 0-based
  if(channel==0){

    if(type===0x90){
      //note on
      lastNote = m[1]
      console.log(lastNote/12)
      notes[m[1]] = m[2]
    }else if(type===0x80){
      //note off
    }else if(type===0xB0){
      //control change
      lastCc = m[1]
      cc[m[1]] = m[2]
    }

  }

}
//
// pido acceso a los dispositivos midi
// y seteo el handler anterior a cada input midi
navigator.requestMIDIAccess().then(ma => {
   for (var input of ma.inputs.values())
     input.onmidimessage = midiHandler
})
// END MAGIA MIDI

const canvas = document.getElementById('hydra-canvas')
canvas.style = `width:100%;height:100%`
// changing resolution will affect kernel behaviours
//canvas.width = 1920
//canvas.height = 1080
canvas.width = 1280
canvas.height = 768
const hydra = new Hydra({canvas})

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

// MIX
src(o1)// GRID
  .add(src(o2)) //LOGO
  .layer(src(s0).mask(src(s0).thresh(0.1))) // P5
 	.out()

//give hydra back
export default hydra
