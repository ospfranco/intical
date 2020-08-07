import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { getSortedPostsData } from '../lib/posts'
import Link from 'next/link'
import Date from '../components/date'
import { useRef, useEffect } from 'react'

let CLOCK_RADIUS = 150
let CLOCK_MARK_RADIUS = 140
let CLOCK_CENTER_X = 200
let CLOCK_CENTER_Y = 200

function draw(ctx: CanvasRenderingContext2D) {
  /**
   * Draw base clock
   */
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
    let x = CLOCK_CENTER_X + Math.cos(angleRad) * CLOCK_MARK_RADIUS
    let y = CLOCK_CENTER_Y + Math.sin(angleRad) * CLOCK_MARK_RADIUS
    let radius = ii % 2 === 0 ? 3 : 2;

    console.warn(`angle rad`, angleRad)

    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.rotate(Math.PI / 2 +angleRad)
    ctx.fillRect(-radius, -radius * 2 , radius, radius * 2)
    ctx.restore()
  }

  /**
   * End base clock
   */
}

export default function Home({ allPostsData }) {
  let canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let ctx = canvasRef.current.getContext('2d')
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
