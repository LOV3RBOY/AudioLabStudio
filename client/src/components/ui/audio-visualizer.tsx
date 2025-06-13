import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioUrl: string;
  isGeneratedStem?: boolean;
}

export default function AudioVisualizer({ audioUrl, isGeneratedStem = false }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mock waveform visualization
    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      if (isGeneratedStem) {
        gradient.addColorStop(0, 'rgb(16, 185, 129)');
        gradient.addColorStop(0.5, 'rgb(5, 150, 105)');
        gradient.addColorStop(1, 'rgb(4, 120, 87)');
      } else {
        gradient.addColorStop(0, 'rgb(99, 102, 241)');
        gradient.addColorStop(0.5, 'rgb(79, 70, 229)');
        gradient.addColorStop(1, 'rgb(67, 56, 202)');
      }
      
      ctx.fillStyle = gradient;
      
      const barWidth = 2;
      const barSpacing = 1;
      const maxHeight = canvas.height;
      
      for (let i = 0; i < canvas.width; i += barWidth + barSpacing) {
        const height = Math.random() * maxHeight * 0.8 + maxHeight * 0.1;
        ctx.fillRect(i, (maxHeight - height) / 2, barWidth, height);
      }
    };

    drawWaveform();
  }, [audioUrl, isGeneratedStem]);

  return (
    <div className="waveform-container rounded mb-2 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-full"
      />
    </div>
  );
}
