import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { getSortedPostsData } from '../lib/posts'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
import {DateTime} from 'luxon'
import { start } from 'repl'

let appointments = [
  {start: DateTime.local().toISO() , end: DateTime.local().plus({minutes: 30}).toISO()},
  {start: DateTime.local().set({hour: 20, minute: 0}).toISO(), end: DateTime.local().set({hour: 21, minute: 30}).toISO()},
]

let CANVAS_HEIGHT = 600
let CANVAS_WIDTH = 600
let CLOCK_RADIUS = 150
let CLOCK_OFFSET1 = 160
let CLOCK_MARK_RADIUS = 130
let CLOCK_LETTER_RADIUS = 115
let CLOCK_CENTER_X = CANVAS_HEIGHT / 2
let CLOCK_CENTER_Y = CANVAS_WIDTH / 2

function draw(ctx: CanvasRenderingContext2D) {
  // Draw background
  ctx.fillStyle = '#EEE'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  /**
   * Draw base clock
   */
  ctx.translate(0.5, 0.5);
  ctx.font = "12px Avenir Next"

  // Clock background
  ctx.beginPath();
  ctx.fillStyle = 'white'
  ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, 0, 2 * Math.PI);
  ctx.fill();


  // Draw appointments
  for(let ii = 0; ii < appointments.length; ii++) {
    let appo = appointments[ii]
    let d = new Date(), startDate = new Date(appo.start), endDate = new Date(appo.end)
    let startMSSinceMidnight = startDate.getTime() - d.setHours(0,0,0,0)
    let startPercentage = startMSSinceMidnight / 86_400_400
    let startAngle = (Math.PI * 2 * startPercentage) - (Math.PI / 2)

    let endMSSinceMidnight = endDate.getTime() - d.setHours(0,0,0,0)
    let endPercentage = endMSSinceMidnight / 86_400_400
    let endAngle = (Math.PI * 2 * endPercentage) - (Math.PI / 2)

    let helperPointX = CLOCK_CENTER_X + Math.cos(endAngle) * CLOCK_OFFSET1
    let helperPointY = CLOCK_CENTER_Y + Math.sin(endAngle) * CLOCK_OFFSET1

    ctx.beginPath()
    ctx.fillStyle = `red`
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_OFFSET1 + 20, startAngle, endAngle);
    ctx.lineTo(helperPointX, helperPointY)
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_OFFSET1, endAngle, startAngle, true)
    ctx.fill()

  }

  // Draw dials
  // 48 = 24hours * 2 strokes per hour
  let angleIntervalRad = Math.PI * 2 / 48
  for(let ii = 0; ii < 48; ii++) {

    let angleRad = angleIntervalRad * ii
    let textX = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_LETTER_RADIUS
    let textY = CLOCK_CENTER_X + Math.sin(angleRad) * CLOCK_LETTER_RADIUS
    let markX = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_MARK_RADIUS
    let markY = CLOCK_CENTER_Y + Math.sin(angleRad) * CLOCK_MARK_RADIUS
    
    let isHour = ii % 2 === 0
    let width = isHour ? 2 : 1;
    let height = isHour ? 6 : 5

    ctx.save()
    ctx.translate(markX, markY)
    ctx.beginPath()
    ctx.rotate(Math.PI / 2 + angleRad)
    ctx.fillStyle = isHour ? 'black' : '#888'
    ctx.roundRect(-width, -height, width, height, 1)
    ctx.fill()
    ctx.restore()

    if(isHour) {
      ctx.textAlign = "center"
      ctx.fillStyle = 'black'
      ctx.fillText(((ii / 2 + 6) % 24).toString(), textX, textY + 5)
    }
  }

  // Draw time indicator
  let d = new Date(), e = new Date(d);
  let msSinceMidnight = e.getTime() - d.setHours(0,0,0,0);
  let percentage = msSinceMidnight / 86_400_400

  // (Math.PI * 2 * percentage) = rotation of the handle
  // - (Math.PI / 2) = reverse 6 hours (0 radians starts at a quarter of the arc)
  // - 0.02 = adjust for width of indicator
  let rotationAngle = (Math.PI * 2 * percentage) - (Math.PI / 2) - 0.03 
  
  let markX = CLOCK_CENTER_X + Math.cos(rotationAngle) * CLOCK_RADIUS
  let markY = CLOCK_CENTER_Y + Math.sin(rotationAngle) * CLOCK_RADIUS

  ctx.save()
  ctx.beginPath()
  ctx.translate(markX, markY)
  ctx.rotate(Math.PI / 2 + (Math.PI * 2 * percentage))
  ctx.fillStyle = 'red'
  ctx.roundRect(-5, -5, 25, 3, 1)
  ctx.fill()
  ctx.restore()

  /**
   * End base clock
   */
}

export default function Home({ allPostsData }) {
  let canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let ctx = canvasRef.current.getContext('2d')
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x+r, y);
      this.arcTo(x+w, y,   x+w, y+h, r);
      this.arcTo(x+w, y+h, x,   y+h, r);
      this.arcTo(x,   y+h, x,   y,   r);
      this.arcTo(x,   y,   x+w, y,   r);
      this.closePath();
      return this;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    draw(ctx)
  })

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <canvas id="canvas" ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          This text is displayed if your browser does not support HTML5 Canvas.
      </canvas>
    </Layout>
  )
}

export async function getStaticProps() {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData
    }
  }
}
