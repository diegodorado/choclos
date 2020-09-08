import p5 from 'p5'
import "p5/lib/addons/p5.sound"
import Spline from 'cubic-spline'
import {kernels, createKernel} from './kernels'
import hydra from './hydra'

// EDIT HERE
// set to true to show timeline curve
const debugTimeline = false
// set to 1.0 to animate at normal speed, 
// and low values (like 0.001) to speed up simulation
const timelineMult = 0.005
//how often to check if a kernel has to be spwaned
const kernelsCheckInterval = 1*timelineMult

// timeline ref points as [time,kernlesCount] pairs
// other values will be interpolated from defined ones
// time unit is minutes
const points = [
  [0,0],
  [1*60,1],
  [2*60,2],
  [15*60,500],  // 15 hours
].map(p => [p[0]*60*timelineMult, p[1]])
const maxTimelineTime = points[points.length-1][0]

const timeline = new Spline(points.map(p => p[0]),points.map(p =>p[1]))
const debugResolution = 1024
const debugCurve = Array(debugResolution).fill(0).map( (_,i) => i)
  .map(i => i/debugResolution*maxTimelineTime)
  .map(t => [t,timeline.at(t)])

const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const drawTimeline = (p,t) => {

  p.stroke(255,0,255)
  p.fill(255,0,255)
  p.strokeWeight(2)
  const maxX = debugCurve[debugCurve.length-1][0]
  const maxY = Math.max(...debugCurve.map( p => p[1]))
  //center and normalize coordinates to draw timeline
  p.translate(-p.width/2,p.height/2)
  p.scale(p.width/maxX,-p.height/maxY)
  p.translate(0.05*maxX,0.05*maxY)
  p.scale(0.9,0.9)
  for(let i =1; i<debugCurve.length;i++){
    const x0 = debugCurve[i-1][0]
    const y0 = debugCurve[i-1][1]
    const x1 = debugCurve[i-0][0]
    const y1 = debugCurve[i-0][1]
    if(x1<t)
      p.stroke(0,255,255)
    else
      p.stroke(255,0,255)
    p.line(x0,y0,x1,y1)
  }

}


const sketch = ( p ) => {

  const addKernel = () => {

    // abort if audio files are still loading
    if(audios.some(a => a.loadLeft > 0))
      return

    const k = createKernel()
    const set = audios[audio.shouldOffend ? 2 : 0]
    const sound = set.sounds[set.soundIdx]
    set.soundIdx++
    set.soundIdx %= set.sounds.length
    // toggle offense/defense for next kernel
    audio.shouldOffend = !audio.shouldOffend

    if(audio.voices < audio.maxVoices){
      const pan = 0 + (Math.random(-1,1) * 0.3) //CLOSED PANNER // PAN -1/1 NOW +/- 0.3
      const rate =  0.9 + Math.random()*0.05 // CHANGE PLAYBACK RATE
      sound.pan(pan)
      sound.rate(rate)
      sound.play()
      audio.voices++
    }

    const msg = document.createElement('div')
    msg.className = 'item'
    const x =Math.random()
    k.position.x = (x-0.5) * p.width * 0.9
    k.position.z = 0
    msg.style = `transform:translateX(${Math.round(x*90)}vw)`
    const wmsg = document.createElement('div')
    wmsg.className = 'wrapper'
    emojiMsgs[set.soundIdx % emojiMsgs.length].split(',').forEach( e => {
      const span = document.createElement('span')
      span.textContent = e
      wmsg.appendChild(span)
    })
    msg.appendChild(wmsg)
    emojis.appendChild(msg)
    setTimeout(()=> msg.remove(), 3000)

  }

  p.setup = () => {
    p.createCanvas(hydra.width,hydra.height, p.WEBGL)

    p.canvas.style.position = "absolute"
    p.canvas.style.top = "0px"
    p.canvas.style.left = "0px"

    //hide p5 canvas behind hydra canvas
    p.canvas.style.zIndex = -10
    p.setAttributes('antialias', true)

    // load canvas on s0 once loaded
    s0.init({src: p.canvas})

  }

  let lastKernelsCheck = 0

  p.draw = () => {
    let t = p.millis()/1000

    if(t-lastKernelsCheck> kernelsCheckInterval) {
      const v = timeline.at(t) || timeline.at(maxTimelineTime)
      const c = Math.round(v)
      if (kernels.length < c){
        addKernel()
      }
      lastKernelsCheck = t
    }

    p.background(0)

    p.ambientLight(100)
    p.directionalLight(250, 255, 0, 50, -50, -125) //frontal light
    p.noStroke()
    let fov = Math.PI/3
    p.perspective(fov, p.width/p.height,0.1,2000)

    p.ambientMaterial(255, 255, 0);
    // iterate through kernels, move them and display them
    kernels.forEach( k => {
      k.update()
      k.render(p)
    })

    if(debugTimeline)
      drawTimeline(p,t)

  }
}

// INIT ALL

const emojis = document.getElementById('emojis')
const p = new p5(sketch,'hydra-ui')
const audio = {
  maxVoices: 10,
  voices: 0,
  shouldOffend: true,
}

const audios = [
  { prefix: '/audio/Def_INT-', loadLeft: 85, offense: false},
  { prefix: '/audio/e_Def_EN-', loadLeft: 84, offense: false},
  { prefix: '/audio/Off_INT-', loadLeft: 82, offense: true},
  { prefix: '/audio/p_Off_EN-', loadLeft: 84, offense: true},
  { prefix: '/audio/x_Off_INT_2-', loadLeft: 56, offense: true},
].map( a => {
  a.sounds = new Array(a.loadLeft).fill(0)
    .map((_,i) => a.prefix+(''+(i+1)).padStart(3,'0')+'.mp3')
    .map(path => p.loadSound(path,() => a.loadLeft--))
  a.sounds = shuffle(a.sounds)
  a.sounds.forEach(s => s.onended( () => audio.voices--) )
  a.soundIdx = 0
  return a
})


const emojiMsgs = [
  '🌡,🔥,🌋,🤒,🤬,⬆︎',
  '💦,😤,😡,🏊‍♂️,‼️, ,⬆︎',
  '🌡,🔥,🌋,🤒,🤬,⬆︎',
  '💨,😲,🚬,😄,🌿,🌳,🌱,⬆︎',
  '🌫️,🏭,🍋,🌧,🍂,🥀,🍁,⬆︎',
  '🛢,☠️,🍂,🥀,🤮,🔥,⬆︎',
  '⛽️,🗯,💥,👩🏾‍🚒,🥀,⬆︎',
  '👩🏻‍🔬,⛽️,🗯,💥,👨‍🚒,🍂,⬆︎',
  '💩,🐂,💨,🐄,💨,🐃,💨,🤢,💩,⬆︎',
  '⚛️,💨,🌿,🌱,🌲,🌳,😎,🥕,🥝,⬆︎',
  '🍷,🥃,🍸,🤤,😵,🤮,☘️,⬆︎',
  '💩,💩,💩,💩,⬆︎,❗️,❗️,💦,💦,☠️,🐟,☠️,🐡,🌲,🌴,☘️',
  '💩,💩,☠️,🐟,☠️,🐬,🌊,⬆︎,⬆︎,🌲,🌴,☘️',
  '👨‍🔬,👩🏻‍🔬,⚒,🔨,⛏,🚰,🚿',
  '💎,🚰,🔨,🔨,🔨,🔨',
  '🍋,☠️,🐟,🥀,😖,♨️,👨‍🔬,⬆︎',
  '👨‍🔬,⚗️,⬆︎,🏊‍♂️,🏊‍♂️,☠️,🐟',
  '👨‍🔬,⬆︎,☿,💩,🚽,🏆,🚿,☠️,☠️',
  '⬆︎,☠️,👻,🏆,🚿,🧀',
  '👨‍🔬,⬆︎,🥜,🍕,🍗,☔️,💀,🤮',
  '👨‍🔬,⬆︎,🦐,📣,🔔,😡,☠️',
]
