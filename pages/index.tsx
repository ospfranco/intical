import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import { useRef, useEffect, useState } from 'react'
import {DateTime} from 'luxon'
import { fetchSunriseSunset } from '../lib/api'
import { MiniClock } from '../components/MiniClock'

function radFromMidnight(date: DateTime) {
  let percentage = date.diff(date.startOf('day'), 'millisecond').milliseconds / 86_400_400
  return (Math.PI * 2 * percentage) - (Math.PI / 2)
}

let appointments = [
  {start: DateTime.local().toISO() , end: DateTime.local().plus({minutes: 30}).toISO(), color: 'green'},
  {start: DateTime.local().set({hour: 20, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 21, minute: 30}).toISO(), color: 'indigo'},
  {start: DateTime.local().set({hour: 19, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 21, minute: 30}).toISO()},
  {start: DateTime.local().set({hour: 10, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 11, minute: 0}).toISO()},
  {start: DateTime.local().set({hour: 8, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 10, minute: 0}).toISO(), color: 'indigo'},
  {start: DateTime.local().set({hour: 12, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 16, minute: 0}).toISO()},
  {start: DateTime.local().set({hour: 9, minute: 0, second: 0, millisecond: 0}).toISO(), end: DateTime.local().set({hour: 11, minute: 0}).toISO(), color: 'indigo'},
]

let weekAppointments = [0,0,0,0,0,0,0].map(() => {
  let res = []

  let size = Math.floor(Math.random() * 10)

  for(let ii = 0; ii < size; ii++) {
    let start = DateTime.local().startOf('day').plus({hour: Math.floor(Math.random() * 24)})
    let end = start.plus({
      hour: Math.floor(Math.random() * 5)
    })
    res.push({
      start: start.toISO(),
      end: end.toISO()
    })
  }

  return res
})

function draw(ctx: CanvasRenderingContext2D, size: number, sunInfo?: {sunrise: DateTime, sunset: DateTime}) {
  let CLOCK_RADIUS = size / 2.7
  let OUTER_CLOCK_RADIUS = CLOCK_RADIUS + 10
  let APPOINTMENT_OFFSET = 40
  let APPOINTMENT_HEIGHT = 30
  let CLOCK_MARK_RADIUS = CLOCK_RADIUS - 50
  let CLOCK_LETTER_RADIUS = CLOCK_RADIUS - 80
  let CLOCK_CENTER_X = size / 2
  let CLOCK_CENTER_Y = size / 2
  let CLOCK_MARK_SIZE = 20

  // Draw background
  ctx.fillStyle = '#EEE'
  ctx.fillRect(0, 0, size, size)
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
    offset: 0,
    color: appointment.color
  }))

  // Draw appointments
  for(let ii = 0; ii < internalAppointments.length; ii++) {
    let appointment = internalAppointments[ii]

    // determine appointment offset
    for(let jj = 0; jj < internalAppointments.length; jj++) {
      if(jj === ii) {
        continue
      }

      let otherAppointment = internalAppointments[jj]
      let overlaps = Math.max(appointment.start.valueOf(), otherAppointment.start.valueOf()) <= Math.min(appointment.end.valueOf(), otherAppointment.end.valueOf())

      if(overlaps && appointment.offset === otherAppointment.offset) {
          appointment.offset++
          jj = -1
      }
    }

    let startAngle = radFromMidnight(appointment.start)
    let endAngle = radFromMidnight(appointment.end)

    let radius = APPOINTMENT_OFFSET * appointment.offset + OUTER_CLOCK_RADIUS
    
    ctx.beginPath()
    ctx.fillStyle = appointment.color ?? `skyblue`
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, radius + APPOINTMENT_HEIGHT, startAngle, endAngle);
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, radius, endAngle, startAngle, true)
    ctx.fill()

    // Draw hour markers inside of appointment
    let lPivot = appointment.start.startOf('hour')
    while(lPivot.valueOf() <= appointment.end.valueOf() ) {
      if(lPivot.valueOf() >= appointment.start.valueOf()) {
        let pivotAngle = radFromMidnight(lPivot)
        let pivotX = CLOCK_CENTER_X + Math.cos(pivotAngle) * (radius + APPOINTMENT_HEIGHT)
        let pivotY = CLOCK_CENTER_Y + Math.sin(pivotAngle) * (radius + APPOINTMENT_HEIGHT)
  
        ctx.save()
        ctx.translate(pivotX, pivotY)
        ctx.beginPath()
        ctx.rotate(pivotAngle)
        ctx.fillStyle = '#FFFFFF88'
        ctx.fillRect(-APPOINTMENT_HEIGHT, -1, APPOINTMENT_HEIGHT, 5)
        ctx.fill()
        ctx.restore()
      }
      // move to the next hour
      lPivot = lPivot.plus({hour: 1})
    }
  }

  // draw sunset/sunrise border
  if(sunInfo) {
    let midnightAngle = -Math.PI / 2
    let sunriseAngle = radFromMidnight(sunInfo.sunrise)
    let sunsetAngle = radFromMidnight(sunInfo.sunset)
    
    // ctx.beginPath()
    // ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, midnightAngle, sunriseAngle)
    // ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS - 5, sunriseAngle, midnightAngle, true)
    // ctx.fillStyle = `RoyalBlue`
    // ctx.fill()
    
    ctx.beginPath()
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, sunriseAngle, sunsetAngle)
    ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS - 5, sunsetAngle, sunriseAngle, true)
    ctx.fillStyle = `orange`
    ctx.fill()
    
    // ctx.beginPath()
    // ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, sunsetAngle, midnightAngle)
    // ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS - 5, midnightAngle, sunsetAngle, true)
    // ctx.fillStyle = `MidnightBlue`
    // ctx.fill()
    


  }

  // Draw dials
  // 48 = 24hours * 2 strokes per hour
  let angleIntervalRad = Math.PI * 2 / 48
  ctx.font = "30px Avenir Next"

  for(let ii = 0; ii < 48; ii++) {
    let angleRad = angleIntervalRad * ii
    let textX = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_LETTER_RADIUS
    let textY = CLOCK_CENTER_X + Math.sin(angleRad) * CLOCK_LETTER_RADIUS
    let markX = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_MARK_RADIUS
    let markY = CLOCK_CENTER_Y + Math.sin(angleRad) * CLOCK_MARK_RADIUS
    
    let isHour = ii % 2 === 0
    let width = isHour ? CLOCK_MARK_SIZE * 0.3 : CLOCK_MARK_SIZE * 0.2;
    let height = isHour ? CLOCK_MARK_SIZE : CLOCK_MARK_SIZE * 0.7

    ctx.save()
    ctx.translate(markX, markY)
    ctx.beginPath()
    ctx.rotate(Math.PI / 2 + angleRad)
    ctx.fillStyle = isHour ? 'black' : '#888'
    ctx.roundRect(-width, -height, width, height, 2)
    ctx.fill()
    ctx.restore()

    if(isHour) {
      ctx.textAlign = 'center'
      ctx.fillStyle = 'black'
      ctx.fillText(((ii / 2 + 6) % 24).toString(), textX, textY + 5)
    }
  }

  // draw center text
  let textStartY = CLOCK_CENTER_Y - 100
  ctx.font = "30px Avenir Next"
  ctx.fillText(DateTime.local().weekdayLong, CLOCK_CENTER_X, textStartY)
  ctx.font = "50px Avenir Next"
  ctx.fillText(DateTime.local().weekday.toString(), CLOCK_CENTER_X, textStartY + 50)
  // ctx.font = "12px Avenir Next"
  // ctx.fillText("Next", CLOCK_CENTER_X, textStartY + 60)
  ctx.font = "55px Avenir Next"
  ctx.fillText("Sprint Retro", CLOCK_CENTER_X, textStartY + 160)
  ctx.font = "44px Avenir Next"
  ctx.fillText("in 10 mins", CLOCK_CENTER_X, textStartY + 220)

  // Draw time indicator
  let indicatorAngle = radFromMidnight(DateTime.local())
  
  let markX = CLOCK_CENTER_X + Math.cos(indicatorAngle) * (CLOCK_RADIUS - 20)
  let markY = CLOCK_CENTER_Y + Math.sin(indicatorAngle) * (CLOCK_RADIUS - 20)

  ctx.save()
  ctx.beginPath()
  ctx.translate(markX, markY)
  ctx.rotate(indicatorAngle)
  ctx.fillStyle = 'red'
  ctx.roundRect(-30, -10, 60, 8, 3)
  ctx.fill()
  ctx.restore()
}

export default function Home() {
  let canvasRef = useRef<HTMLCanvasElement | undefined>()
  let miniRef = useRef<HTMLCanvasElement | undefined>()
  let [sunInfo, setSunInfo] = useState(null)
  let [width, setWidth] = useState()

  useEffect(() => {
    fetchSunriseSunset().then(setSunInfo)
  }, [])

  useEffect(() => {
    if(!width && window) {
      let dpi = window.devicePixelRatio

      // @ts-ignore
      setWidth(Math.floor(window.innerWidth * dpi))
    }
  })

  useEffect(() => {
    let ctx = canvasRef.current?.getContext('2d')
    if(ctx) {
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
      
      draw(ctx, width, sunInfo)
    }

  })

  if(!width) {
    return null
  }

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>

      <div style={{backgroundColor: 'white', display: `flex`, paddingTop: 10, paddingBottom: 10, overflowX: 'scroll'}}>
        {weekAppointments.map((weekAppointments, ii) => {
          return (
            <div key={`miniclock-${ii}`} style={{padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <MiniClock appointments={weekAppointments} />
              <div>
                Mon
              </div>
            </div>
          )
        })}
      </div>

      <canvas ref={canvasRef} width={width} height={width} style={{width: `100vw`, height: `100vw`}}>
          This text is displayed if your browser does not support HTML5 Canvas.
      </canvas>
    </Layout>
  )
}
