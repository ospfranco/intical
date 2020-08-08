import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { getSortedPostsData } from '../lib/posts'
import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'
import {DateTime} from 'luxon'
import { start } from 'repl'
import { fetchSunriseSunset } from '../lib/api'

function radFromMidnight(date: DateTime) {
  let percentage = date.diff(date.startOf('day'), 'millisecond').milliseconds / 86_400_400
  return (Math.PI * 2 * percentage) - (Math.PI / 2)
}

let appointments = [
  {start: DateTime.local().toISO() , end: DateTime.local().plus({minutes: 30}).toISO()},
  {start: DateTime.local().set({hour: 20, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 21, minute: 30}).toISO()},
  {start: DateTime.local().set({hour: 19, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 21, minute: 30}).toISO()},
  {start: DateTime.local().set({hour: 10, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 11, minute: 0}).toISO()},
]

let CANVAS_HEIGHT = 600
let CANVAS_WIDTH = 600
let CLOCK_RADIUS = 140
let OUTER_CLOCK_RADIUS = 150
let APPOINTMENT_OFFSET = 20
let APPOINTMENT_HEIGHT = 10
let CLOCK_MARK_RADIUS = CLOCK_RADIUS - 15
let CLOCK_LETTER_RADIUS = CLOCK_RADIUS - 30
let CLOCK_CENTER_X = CANVAS_HEIGHT / 2
let CLOCK_CENTER_Y = CANVAS_WIDTH / 2

function draw(ctx: CanvasRenderingContext2D, sunInfo?: {sunrise: DateTime, sunset: DateTime}) {
  // clear context
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw background
  ctx.fillStyle = '#EEE'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  /**
   * Draw base clock
   */
  // ctx.translate(0.5, 0.5);

  // Clock background
  ctx.beginPath();
  ctx.fillStyle = 'white'
  ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, 0, 2 * Math.PI);
  ctx.fill();

  let internalAppointments = appointments.map((appointment) => ({
    start: DateTime.fromISO(appointment.start),
    end: DateTime.fromISO(appointment.end),
    offset: 0
  }))

  // Draw appointments
  for(let ii = 0; ii < internalAppointments.length; ii++) {
    let appointment = internalAppointments[ii]

    // determine appointment offset
    for(let jj = ii + 1; jj < internalAppointments.length; jj++) {
      if(jj === ii) {
        continue
      }
      let otherAppointment = internalAppointments[jj]
      let overlaps = Math.max(appointment.start.valueOf(), otherAppointment.start.valueOf()) <= Math.min(appointment.end.valueOf(), otherAppointment.end.valueOf())

      if(overlaps && appointment.offset <= otherAppointment.offset) {
          appointment.offset = otherAppointment.offset + 1
      }
    
    }

    let startMSSinceMidnight = appointment.start.diff(appointment.start.startOf('day'), 'millisecond').milliseconds
    // let startMSSinceMidnight = startDate.getTime() - d.setHours(0,0,0,0)
    let startPercentage = startMSSinceMidnight / 86_400_400
    let startAngle = (Math.PI * 2 * startPercentage) - (Math.PI / 2)

    let endMSSinceMidnight = appointment.end.diff(appointment.end.startOf('day'), 'millisecond').milliseconds
    let endPercentage = endMSSinceMidnight / 86_400_400
    let endAngle = (Math.PI * 2 * endPercentage) - (Math.PI / 2)

    let radius = APPOINTMENT_OFFSET * appointment.offset + OUTER_CLOCK_RADIUS
    
    ctx.beginPath()
    ctx.fillStyle = `skyblue`
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, radius + APPOINTMENT_HEIGHT, startAngle, endAngle);
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, radius, endAngle, startAngle, true)
    ctx.fill()

    // Draw hour markers inside of appointment
    let lPivot = appointment.start.startOf('hour')
    while(lPivot.valueOf() <= appointment.end.valueOf() ) {
      if(lPivot.valueOf() >= appointment.start.valueOf()) {
        let pivotMSSinceMidnight =lPivot.diff(lPivot.startOf('day'), 'millisecond').milliseconds
        let pivotPercentage = pivotMSSinceMidnight / 86_400_400
        let pivotAngle = (Math.PI * 2 * pivotPercentage) - (Math.PI / 2)
  
        let pivotX = CLOCK_CENTER_X + Math.cos(pivotAngle) * radius
        let pivotY = CLOCK_CENTER_Y + Math.sin(pivotAngle) * radius
  
        ctx.save()
        ctx.translate(pivotX, pivotY)
        ctx.beginPath()
        ctx.rotate(Math.PI / 2 + (Math.PI * 2 * pivotPercentage))
        ctx.fillStyle = '#FFFFFF'
        // ctx.fillStyle = 'green'
        ctx.fillRect(-APPOINTMENT_HEIGHT, 1, APPOINTMENT_HEIGHT, 1)
        ctx.fill()
        ctx.restore()
        // move to the next hour
      }
      lPivot = lPivot.plus({hour: 1})
    }
  }

  // draw sunset/sunrise border
  if(sunInfo) {
    let midnightAngle = -Math.PI / 2
    let sunriseAngle = radFromMidnight(sunInfo.sunrise)
    let sunsetAngle = radFromMidnight(sunInfo.sunset)
    
    ctx.beginPath()
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, midnightAngle, sunriseAngle)
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS - 5, sunriseAngle, midnightAngle, true)
    ctx.fillStyle = `RoyalBlue`
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, sunriseAngle, sunsetAngle)
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS - 5, sunsetAngle, sunriseAngle, true)
    ctx.fillStyle = `khaki`
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, sunsetAngle, midnightAngle)
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS - 5, midnightAngle, sunsetAngle, true)
    ctx.fillStyle = `MidnightBlue`
    ctx.fill()
    


  }

  // Draw dials
  // 48 = 24hours * 2 strokes per hour
  let angleIntervalRad = Math.PI * 2 / 48
  ctx.font = "12px Avenir Next"

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

  // draw center text
  let textStartY = CLOCK_CENTER_Y - 40
  ctx.font = "14px Avenir Next"
  ctx.fillText(DateTime.local().weekdayLong, CLOCK_CENTER_X, textStartY)
  ctx.font = "22px Avenir Next"
  ctx.fillText(DateTime.local().weekday.toString(), CLOCK_CENTER_X, textStartY + 30)

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
}

export default function Home({ allPostsData }) {
  let canvasRef = useRef<HTMLCanvasElement | null>(null)
  let [sunInfo, setSunInfo] = useState(null)

  useEffect(() => {
    fetchSunriseSunset().then(setSunInfo)
  }, [])

  useEffect(() => {
    let ctx = canvasRef.current.getContext('2d')
    
    if(!CanvasRenderingContext2D.prototype.roundRect) {
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
    }
    
    draw(ctx, sunInfo)
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
