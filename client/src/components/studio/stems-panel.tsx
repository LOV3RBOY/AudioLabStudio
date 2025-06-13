import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StemCard from "./stem-card";
import FileUpload from "./file-upload";
import type { Stem, GeneratedStem } from "@shared/schema";

interface StemsPanelProps {
  projectId: number;
}

export default function StemsPanel({ projectId }: StemsPanelProps) {
  const [showUpload, setShowUpload] = useState(false);

  const { data: stems = [], isLoading: stemsLoading } = useQuery<Stem[]>({
    queryKey: ['/api/projects', projectId, 'stems'],
  });

  const { data: generatedStems = [], isLoading: generatedStemsLoading } = useQuery<GeneratedStem[]>({
    queryKey: ['/api/projects', projectId, 'generated-stems'],
  });

  const isLoading = stemsLoading || generatedStemsLoading;

  return (
    <div className="w-80 surface-glass border-r border-[var(--border-strong)] flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-display-md">STEMS</h3>
            <p className="text-sm text-[var(--foreground-muted)] font-mono tracking-wide">AUDIO TRACKS</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)] p-3 rounded-xl transition-all duration-200 glow-primary"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Plus size={20} />
          </Button>
        </div>
        
        {showUpload && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <FileUpload
              projectId={projectId}
              onUploadComplete={() => setShowUpload(false)}
            />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-slate-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2 mt-1"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {stems.map((stem) => (
              <StemCard key={`stem-${stem.id}`} stem={stem} type="uploaded" />
            ))}
            
            {generatedStems.map((stem) => (
              <StemCard key={`generated-${stem.id}`} stem={stem} type="generated" />
            ))}
            
            {stems.length === 0 && generatedStems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No stems yet</p>
                <p className="text-xs text-slate-500">Upload audio files to get started</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
