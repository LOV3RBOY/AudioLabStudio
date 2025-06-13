import { useQuery } from "@tanstack/react-query";
import { Expand, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIAssistant from "./ai-assistant";
import MixHistory from "./mix-history";
import type { Stem, GeneratedStem } from "@shared/schema";

interface TimelineViewProps {
  projectId: number;
  activeTab: "timeline" | "ai-assistant" | "mix-history";
}

export default function TimelineView({ projectId, activeTab }: TimelineViewProps) {
  const { data: stems = [] } = useQuery<Stem[]>({
    queryKey: ['/api/projects', projectId, 'stems'],
  });

  const { data: generatedStems = [] } = useQuery<GeneratedStem[]>({
    queryKey: ['/api/projects', projectId, 'generated-stems'],
  });

  if (activeTab === "ai-assistant") {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <AIAssistant projectId={projectId} />
      </div>
    );
  }

  if (activeTab === "mix-history") {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <MixHistory projectId={projectId} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Master Timeline</h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <Expand size={16} className="mr-1" />
              Zoom
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <Settings size={16} className="mr-1" />
              Settings
            </Button>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center mb-4 text-xs text-slate-400">
            <div className="w-20">00:00</div>
            <div className="w-20">00:30</div>
            <div className="w-20">01:00</div>
            <div className="w-20">01:30</div>
            <div className="w-20">02:00</div>
            <div className="w-20">02:30</div>
            <div className="w-20">03:00</div>
          </div>
          
          <div className="relative">
            <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-indigo-500 z-10"></div>
            
            <div className="space-y-2">
              {stems.map((stem) => (
                <div key={`timeline-stem-${stem.id}`} className="flex items-center h-12">
                  <div className="w-16 text-sm text-slate-300 truncate">{stem.type}</div>
                  <div className="flex-1 bg-slate-700 rounded h-8 relative overflow-hidden">
                    <div 
                      className="waveform-container h-full"
                      style={{ width: `${Math.min(stem.metadata.duration / 180 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              
              {generatedStems.map((stem) => (
                <div key={`timeline-generated-${stem.id}`} className="flex items-center h-12">
                  <div className="w-16 text-sm text-emerald-300 truncate">{stem.type}</div>
                  <div className="flex-1 bg-slate-700 rounded h-8 relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-700 rounded"
                      style={{ width: `${Math.min(stem.metadata.duration / 180 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              
              {stems.length === 0 && generatedStems.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>No stems to display in timeline</p>
                  <p className="text-xs text-slate-500 mt-1">Upload stems or generate them with AI</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AIAssistant projectId={projectId} />
    </div>
  );
}
