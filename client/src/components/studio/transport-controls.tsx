import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TransportControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("01:24");
  const [totalTime] = useState("03:42");

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="surface-glass border-b border-[var(--border)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)] p-3 rounded-xl transition-all duration-200"
          >
            <SkipBack size={20} />
          </Button>
          
          <Button
            size="lg"
            className="btn-premium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--background)] hover:scale-110 transition-transform duration-200 w-16 h-16 rounded-2xl glow-primary"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)] p-3 rounded-xl transition-all duration-200"
          >
            <SkipForward size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)] p-3 rounded-xl transition-all duration-200"
          >
            <Square size={20} />
          </Button>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="card-elevated px-6 py-3 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="text-lg font-mono font-bold text-[var(--foreground)]">{currentTime}</div>
              <div className="text-[var(--foreground-muted)]">/</div>
              <div className="text-lg font-mono text-[var(--foreground-muted)]">{totalTime}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <Volume2 size={18} className="text-[var(--foreground-muted)]" />
            <div className="flex items-end space-x-1 h-8">
              <div className="spectrum-bar w-2 bg-gradient-to-t from-[var(--accent-tertiary)] to-[var(--accent-secondary)] rounded-t"></div>
              <div className="spectrum-bar w-2 bg-gradient-to-t from-[var(--accent-tertiary)] to-[var(--accent-secondary)] rounded-t"></div>
              <div className="spectrum-bar w-2 bg-gradient-to-t from-[var(--accent-tertiary)] to-[var(--accent-secondary)] rounded-t"></div>
              <div className="spectrum-bar w-2 bg-gradient-to-t from-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-t"></div>
              <div className="spectrum-bar w-2 bg-gradient-to-t from-[var(--accent-primary)] to-red-400 rounded-t"></div>
            </div>
            <span className="text-sm font-mono text-[var(--foreground-muted)]">-12dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
