import { useEffect, useRef } from 'react'
import './WaveformVisualizer.css'

type WaveformVisualizerProps = {
  analyser: AnalyserNode | null
  active: boolean
}

export function WaveformVisualizer({ analyser, active }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser || !active) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const buffer = new Uint8Array(analyser.frequencyBinCount)
    let frame = 0

    const draw = () => {
      analyser.getByteTimeDomainData(buffer)
      const { width, height } = canvas
      context.clearRect(0, 0, width, height)
      context.lineWidth = 2
      context.strokeStyle = '#16a34a'
      context.beginPath()
      const slice = width / buffer.length
      for (let index = 0; index < buffer.length; index += 1) {
        const x = index * slice
        const y = (buffer[index] / 255) * height
        if (index === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      }
      context.stroke()
      frame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frame)
  }, [analyser, active])

  return (
    <canvas
      ref={canvasRef}
      className="waveform-visualizer"
      width={320}
      height={64}
      aria-hidden={!active}
    />
  )
}
