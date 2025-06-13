import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIAssistantProps {
  projectId: number;
}

export default function AIAssistant({ projectId }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [energyLevel, setEnergyLevel] = useState([7]);
  const [generateInstruments, setGenerateInstruments] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMixJobMutation = useMutation({
    mutationFn: async () => {
      if (!prompt.trim()) {
        throw new Error("Please provide mixing instructions");
      }

      const mixJobData = {
        projectId,
        prompt: prompt.trim(),
        status: "queued",
        config: {
          engine: "ai_mixer_v2",
          parameters: {
            genre: genre || "auto",
            energyLevel: energyLevel[0],
            generateInstruments,
          },
          includeStems: [], // Would be populated with actual stem IDs
          ...(generateInstruments && {
            generateInstruments: ["bass", "drums", "synth"],
          }),
          ...(genre && { targetGenre: genre }),
        },
        progress: 0,
        phases: [
          { name: "Analysis", status: "pending" },
          { name: "Stem Processing", status: "pending" },
          { name: "AI Mixing", status: "pending" },
          { name: "Mastering", status: "pending" },
          { name: "Export", status: "pending" },
        ],
        version: Date.now(), // Simple versioning
      };

      return apiRequest("POST", `/api/projects/${projectId}/mix-jobs`, mixJobData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'mix-jobs'] });
      toast({
        title: "Mix job started",
        description: "Your AI mixing job has been queued and will begin processing shortly.",
      });
      setPrompt("");
    },
    onError: (error) => {
      toast({
        title: "Failed to start mix job",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const genres = [
    { value: "pop", label: "Pop" },
    { value: "rock", label: "Rock" },
    { value: "electronic", label: "Electronic" },
    { value: "hip-hop", label: "Hip-Hop" },
    { value: "jazz", label: "Jazz" },
    { value: "classical", label: "Classical" },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Bot className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Mixing Assistant</h3>
          <p className="text-sm text-slate-400">Describe your vision and let AI create the perfect mix</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Mixing Instructions</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500 resize-none"
            rows={4}
            placeholder="e.g., 'Create an uplifting summer pop mix with punchy drums, warm vocals, and a driving bassline. Add some subtle reverb and make it radio-ready.'"
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Genre</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
                <SelectValue placeholder="Select genre (optional)" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genreOption) => (
                  <SelectItem key={genreOption.value} value={genreOption.value}>
                    {genreOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Energy Level</label>
            <Slider
              value={energyLevel}
              onValueChange={setEnergyLevel}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Calm</span>
              <span className="text-slate-300">{energyLevel[0]}/10</span>
              <span>Energetic</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="generateInstruments"
            checked={generateInstruments}
            onCheckedChange={setGenerateInstruments}
            className="border-slate-600"
          />
          <label htmlFor="generateInstruments" className="text-sm text-slate-300">
            Generate missing instruments
          </label>
        </div>
        
        <Button
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105 transition-all"
          onClick={() => createMixJobMutation.mutate()}
          disabled={createMixJobMutation.isPending || !prompt.trim()}
        >
          <Sparkles size={16} className="mr-2" />
          {createMixJobMutation.isPending ? "Starting..." : "Start AI Mix"}
        </Button>
      </div>
    </div>
  );
}
