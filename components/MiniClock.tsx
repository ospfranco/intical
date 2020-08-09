import React, { useRef, useEffect, useState } from 'react'
import {DateTime} from 'luxon'


function radFromMidnight(date: DateTime) {
  let percentage = date.diff(date.startOf('day'), 'millisecond').milliseconds / 86_400_400
  return (Math.PI * 2 * percentage) - (Math.PI / 2)
}

function draw(ctx: CanvasRenderingContext2D, size: number, appointments: any[]) {
  let CLOCK_RADIUS = size / 4.5
  let CLOCK_CENTER = size / 2
  let APPOINTMENT_OFFSET = CLOCK_RADIUS / 2.7
  let APPOINTMENT_HEIGHT = CLOCK_RADIUS / 3

  let overflowed = false
  
  ctx.clearRect(0,0, size, size)

  ctx.translate(0.5, 0.5)

  ctx.beginPath()
  ctx.fillStyle = '#F5F5F5'
  ctx.arc(CLOCK_CENTER, CLOCK_CENTER, size / 2, 0, 2 * Math.PI)
  ctx.fill()

  ctx.beginPath()
  ctx.fillStyle = '#FFF'
  ctx.arc(CLOCK_CENTER, CLOCK_CENTER, CLOCK_RADIUS, 0, 2 * Math.PI);
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
      let overlaps = 
        Math.max(
          appointment.start.valueOf(), 
          otherAppointment.start.valueOf()
        ) <= Math.min(
          appointment.end.valueOf(), 
          otherAppointment.end.valueOf()
        )

      if(overlaps && appointment.offset === otherAppointment.offset) {
          appointment.offset++
          jj = -1
      }
    }

    if(appointment.offset > 2) {
      overflowed = true
      continue
    }

    let startAngle = radFromMidnight(appointment.start)
    let endAngle = radFromMidnight(appointment.end)

    let radius = APPOINTMENT_OFFSET * appointment.offset + CLOCK_RADIUS
    
    ctx.beginPath()
    ctx.fillStyle = appointment.color ?? `skyblue`
    ctx.arc(CLOCK_CENTER, CLOCK_CENTER, radius + APPOINTMENT_HEIGHT, startAngle, endAngle);
    ctx.arc(CLOCK_CENTER, CLOCK_CENTER, radius, endAngle, startAngle, true)
    ctx.fill()
  }

  // draw text
  let text = DateTime.local().weekday.toString()
  if(overflowed) {
    text = `${DateTime.local().weekday}*`
  }

  ctx.fillStyle = '#333'
  ctx.font = "35px Avenir Next"
  ctx.textAlign = "center"
  ctx.fillText(text, size/2, size/2 + 8)
}

type Props = {
  appointments: any[]
}

export const MiniClock = ({appointments}: Props) => {
  let canvasRef = useRef<HTMLCanvasElement | undefined>()
  let [width, setWidth] = useState(90)

  useEffect(() => {
    if(canvasRef.current != null && window) {
      // useEffect(() => {
      //   if(!width && window) {
          
    
      //     // @ts-ignore
      //     setWidth(Math.floor(window.innerWidth * dpi))
      //   }
      // })
      let dpi = window.devicePixelRatio
      setWidth(Math.floor(90 * dpi))
      draw(canvasRef.current.getContext('2d'), width, appointments)
    }
  })

  return (
    <canvas width={width} height={width} ref={canvasRef} style={{height: 90, width: 90}}/>
  )
}