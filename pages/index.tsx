import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { getSortedPostsData } from '../lib/posts'
import Link from 'next/link'
import Date from '../components/date'
import { useRef, useEffect } from 'react'

let CLOCK_RADIUS = 150
let CLOCK_MARK_RADIUS = 130
let CLOCK_LETTER_RADIUS = 115
let CLOCK_CENTER_X = 200
let CLOCK_CENTER_Y = 200

function draw(ctx: CanvasRenderingContext2D) {
  /**
   * Draw base clock
   */
  ctx.translate(0.5, 0.5);
  ctx.font = "12px Avenir Next"

  ctx.fillStyle = 'white'

  ctx.strokeStyle = 'gray'

  ctx.beginPath();
  ctx.arc(CLOCK_CENTER_X, CLOCK_CENTER_Y, CLOCK_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // 48 = 24hours * 2 strokes per hour
  let angleIntervalRad = Math.PI * 2 / 48
  for(let ii = 0; ii < 48; ii++) {

    let angleRad = angleIntervalRad * ii
    let textX = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_LETTER_RADIUS
    let textY = CLOCK_CENTER_X + Math.sin(angleRad) * CLOCK_LETTER_RADIUS
    let markX = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_MARK_RADIUS
    let markY = CLOCK_CENTER_Y + Math.sin(angleRad) * CLOCK_MARK_RADIUS
    let isHour = ii % 2 === 0
    let radius = isHour ? 3 : 2;

    ctx.save()
    ctx.translate(markX, markY)
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.rotate(Math.PI / 2 +angleRad)
    ctx.roundRect(-radius, -radius * 2 , radius, radius * 2, 1)
    ctx.fill()
    ctx.restore()

    if(isHour) {
      ctx.textAlign = "center"
      ctx.fillStyle = 'black'
      ctx.fillText(((ii / 2 + 6) % 24).toString(), textX, textY + 5)
    }
  }

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

    ctx.clearRect(0, 0, 550, 550)
    draw(ctx)
  })

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <canvas id="canvas" ref={canvasRef} width="550" height="550">
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
