import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Drum, Bot, Headphones, VolumeX, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import AudioVisualizer from "@/components/ui/audio-visualizer";
import { apiRequest } from "@/lib/queryClient";
import type { Stem, GeneratedStem } from "@shared/schema";

interface StemCardProps {
  stem: Stem | GeneratedStem;
  type: "uploaded" | "generated";
}

export default function StemCard({ stem, type }: StemCardProps) {
  const [volume, setVolume] = useState([stem.volume || 0]);
  const [pan, setPan] = useState([stem.pan || 0]);
  const queryClient = useQueryClient();

  const updateStemMutation = useMutation({
    mutationFn: async (updates: Partial<Stem | GeneratedStem>) => {
      const endpoint = type === "uploaded" ? `/api/stems/${stem.id}` : `/api/generated-stems/${stem.id}`;
      return apiRequest("PATCH", endpoint, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', stem.projectId, type === "uploaded" ? 'stems' : 'generated-stems'] 
      });
    },
  });

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    updateStemMutation.mutate({ volume: newVolume[0] });
  };

  const handlePanChange = (newPan: number[]) => {
    setPan(newPan);
    updateStemMutation.mutate({ pan: newPan[0] });
  };

  const toggleMute = () => {
    updateStemMutation.mutate({ muteEnabled: !stem.muteEnabled });
  };

  const toggleSolo = () => {
    updateStemMutation.mutate({ soloEnabled: !stem.soloEnabled });
  };

  const getTypeIcon = () => {
    if (type === "generated") return Bot;
    if (stem.type === "drums") return Drum;
    return Volume2;
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className={`bg-slate-800 rounded-lg p-3 border transition-colors ${
      type === "generated" 
        ? "border-emerald-700 hover:border-emerald-600" 
        : "border-slate-700 hover:border-slate-600"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center ${
            type === "generated"
              ? "bg-gradient-to-br from-emerald-500 to-teal-500"
              : "bg-gradient-to-br from-purple-500 to-pink-500"
          }`}>
            <TypeIcon className="text-white" size={12} />
          </div>
          <div>
            <h4 className="text-sm font-medium">{stem.name}</h4>
            <p className={`text-xs ${
              type === "generated" ? "text-emerald-400" : "text-slate-400"
            }`}>
              {type === "generated" 
                ? `Generated • ${Math.floor(stem.metadata.duration / 60)}:${String(Math.floor(stem.metadata.duration % 60)).padStart(2, '0')}` 
                : `${Math.floor(stem.metadata.duration / 60)}:${String(Math.floor(stem.metadata.duration % 60)).padStart(2, '0')} • ${(stem.metadata.sampleRate / 1000).toFixed(1)}kHz`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className={`p-1 transition-colors ${
              stem.soloEnabled ? "text-emerald-400" : "text-slate-400 hover:text-emerald-400"
            }`}
            onClick={toggleSolo}
          >
            <Headphones size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`p-1 transition-colors ${
              stem.muteEnabled ? "text-red-400" : "text-slate-400 hover:text-red-400"
            }`}
            onClick={toggleMute}
          >
            <VolumeX size={12} />
          </Button>
        </div>
      </div>
      
      <AudioVisualizer 
        audioUrl={stem.fileUrl}
        isGeneratedStem={type === "generated"}
      />
      
      <div className="space-y-2 mt-2">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              min={-60}
              max={12}
              step={1}
              className="w-full"
            />
          </div>
          <span className="text-xs text-slate-400 w-8">
            {volume[0] > 0 ? '+' : ''}{volume[0]}dB
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 w-4">L</span>
          <div className="flex-1">
            <Slider
              value={pan}
              onValueChange={handlePanChange}
              min={-100}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <span className="text-xs text-slate-400 w-4">R</span>
        </div>
      </div>
    </div>
  );
}
