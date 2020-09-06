import p5 from 'p5'
import "p5/lib/addons/p5.sound"
import Spline from 'cubic-spline'
import {kernels, createKernel} from './kernels'
import hydra from './hydra'


// timeline ref points as [time,kernlesCount] pairs
// other values will be interpolated from defined ones
const points = [
  [0,0],
  [10,1],
  [20,2],
  [100,500],
]
const maxTimelineTime = points[points.length-1][0]
// strech or compress timeline
// total timeline duration would be maxTimelineTime*timelineMult seconds
//const timelineMult = 60
const timelineMult = 1
const timeline = new Spline(points.map(p => p[0]*timelineMult),points.map(p =>p[1]))
const debugTimeline = true
const debugResolution = 1024
const debugCurve = Array(debugResolution).fill(0).map( (_,i) => i)
  .map(i => i/debugResolution*maxTimelineTime*timelineMult)
  .map(t => [t,timeline.at(t)])



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

const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


const drawTimeline = (p,t) => {

  if(!debugTimeline)
    return

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

    createKernel()
    const off = audios[2]
    const sound = off.sounds[off.soundIdx]

    const pan = 0.2 * (Math.random() - 0.5)
    const rate =  0.8 + Math.random()*0.2
    //sound.pan(pan)
    //sound.rate(rate)
    if(sound.isLoaded)
      sound.play()

    const msg = document.createElement('div')
    msg.className = 'item'
    msg.style = `transform:translateX(${Math.round(Math.random()*90)}vw)`
    const wmsg = document.createElement('div')
    wmsg.className = 'wrapper'
    emojiMsgs[off.soundIdx % emojiMsgs.length].split(',').forEach( e => {
      const span = document.createElement('span')
      span.textContent = e
      wmsg.appendChild(span)
    })
    msg.appendChild(wmsg)
    emojis.appendChild(msg)
    setTimeout(()=> msg.remove(), 3000)

    off.soundIdx++
    off.soundIdx %= off.sounds.length
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
  const kernelsCheckInterval = 1

  p.draw = () => {
    let t = p.millis()/1000

    if(t-lastKernelsCheck> kernelsCheckInterval) {
      const c = Math.round(timeline.at(t))
      if (kernels.length < c)
        addKernel()
      lastKernelsCheck = t
    }

    p.background(0)

    let dirY = (p.mouseY / p.height - 0.5) *2
    let dirX = (p.mouseX / p.width - 0.5) *2
    p.directionalLight(250, 255, 0, dirX, -dirY, -125)
    p.ambientMaterial(1200)
    p.noStroke()
    p.orbitControl()
    let fov = Math.PI/3
    p.perspective(fov, p.width/p.height,0.1,p.height)

    // iterate through kernels, move them and display them
    p.normalMaterial();
    p.specularMaterial(20)

    kernels.forEach( k => {
      k.update()
      k.render(p)
    })

    drawTimeline(p,t)

  }
}

// INIT ALL

const emojis = document.getElementById('emojis')
const p = new p5(sketch,'hydra-ui')

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

