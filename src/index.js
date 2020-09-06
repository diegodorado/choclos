import Hydra from 'hydra-synth'
import p5 from 'p5'
import "p5/lib/addons/p5.sound"
import Spline from 'cubic-spline'
import {kernels, createKernel} from './kernels'


// here I will hold a global reference to p5

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
    if( data === null)
      return

    createKernel()
    const idx = Math.floor(Math.random()*data.length)
    const item = data[idx]

    const pan = Math.random()*2 - 1
    const rate =  Math.random()*0.3+0.8
    item.audio.pan(pan)
    item.audio.rate(rate)
    if(item.audio.isLoaded)
      item.audio.play()
    const msg = document.createElement('div')
    msg.className = 'item'
    msg.textContent = '🍷🥃🍸🤤😵🤮'+'  '+item.phrase
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

const hydra = new Hydra()
const emojis = document.getElementById('emojis')
const p = new p5(sketch,'hydra-ui')
let data = null

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


// hydra sketch
src(s0)
  .out()


