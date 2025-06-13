import { Bell, Save, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@shared/schema";

interface TopBarProps {
  project: Project;
}

export default function TopBar({ project }: TopBarProps) {
  return (
    <header className="surface-glass border-b border-[var(--border)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-display-md">{project.name}</h2>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[var(--accent-tertiary)] rounded-full pulse-ring"></div>
                <span className="text-sm font-mono text-[var(--foreground-muted)] tracking-wider">LIVE</span>
              </div>
              {project.bpm && (
                <div className="flex items-center space-x-2">
                  <Activity size={14} className="text-[var(--accent-secondary)]" />
                  <span className="text-sm font-mono text-[var(--foreground-secondary)]">{project.bpm} BPM</span>
                </div>
              )}
              {project.keySignature && (
                <div className="px-3 py-1 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg">
                  <span className="text-sm font-mono text-[var(--foreground-secondary)]">{project.keySignature}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)] p-3 rounded-xl transition-all duration-200"
            >
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-primary)] rounded-full pulse-ring flex items-center justify-center">
                <span className="text-xs font-bold text-[var(--background)]">3</span>
              </div>
            </Button>
          </div>
          
          <Button className="btn-premium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--background)] hover:scale-105 transition-transform duration-200 px-6 py-3 rounded-xl font-semibold">
            <Zap size={16} className="mr-2" />
            RENDER MIX
          </Button>
        </div>
      </div>
    </header>
  );
}
