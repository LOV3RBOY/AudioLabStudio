import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, SkipBack, SkipForward, Mic, Upload, Radio, Settings, Save, Download, Sparkles, Music, Plus, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

interface Project {
  id: number;
  name: string;
  description?: string;
  genre?: string;
  bpm?: number;
  keySignature?: string;
  settings: {
    targetLoudness: number;
    outputFormat: string;
    sampleRate: number;
    bitDepth?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Stem {
  id: number;
  projectId: number;
  name: string;
  type: string;
  fileUrl: string;
  volume: number;
  pan: number;
  soloEnabled: boolean;
  muteEnabled: boolean;
  analysis: {
    peakLevel: number;
    averageLevel: number;
    loudness: number;
    dynamicRange: number;
    spectralCentroid: number;
    keyEstimate: string;
    bpmEstimate: number;
    typeConfidence: number;
    suitability: number;
  };
}

interface MixJob {
  id: number;
  projectId: number;
  prompt: string;
  status: string;
  progress: number;
  currentPhase?: string;
  settings: {
    style: string;
    mood: string;
    intensity: number;
    targetLoudness: number;
    stereoWidth: number;
    dynamicRange: string;
    mixStyle: string;
    matchReference: boolean;
    generateMissing: boolean;
    professionalMaster: boolean;
  };
  resultFileUrl?: string;
}

interface ReferenceTrack {
  id: number;
  projectId: number;
  name: string;
  fileUrl: string;
  analysis: {
    peakLevel: number;
    averageLevel: number;
    loudness: number;
    dynamicRange: number;
    keyEstimate: string;
    bpmEstimate: number;
    timeSignature: string;
    spectralCentroid: number;
    stereoWidth: number;
    detectedInstruments: Array<{
      instrument: string;
      confidence: number;
    }>;
  };
}

const getStemColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    drums: "stem-drums",
    bass: "stem-bass", 
    vocals: "stem-vocals",
    guitar: "stem-guitar",
    keys: "stem-keys",
    synth: "stem-synth",
    strings: "stem-strings",
    brass: "stem-brass",
    fx: "stem-fx",
    other: "stem-other"
  };
  return colorMap[type] || "stem-other";
};

export default function Studio() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [newProjectName, setNewProjectName] = useState("");
  const [stemName, setStemName] = useState("");
  const [stemType, setStemType] = useState("other");
  const [stemFile, setStemFile] = useState<File | null>(null);
  const [referenceName, setReferenceName] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showStemUpload, setShowStemUpload] = useState(false);
  const [showReferenceUpload, setShowReferenceUpload] = useState(false);
  const [showAiMix, setShowAiMix] = useState(false);
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch stems for selected project
  const { data: stems = [] } = useQuery<Stem[]>({
    queryKey: ["/api/projects", selectedProject?.id, "stems"],
    enabled: !!selectedProject,
  });

  // Fetch reference tracks for selected project
  const { data: referenceTracks = [] } = useQuery<ReferenceTrack[]>({
    queryKey: ["/api/projects", selectedProject?.id, "reference-tracks"],
    enabled: !!selectedProject,
  });

  // Fetch mix jobs for selected project
  const { data: mixJobs = [] } = useQuery<MixJob[]>({
    queryKey: ["/api/projects", selectedProject?.id, "mix-jobs"],
    enabled: !!selectedProject,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; genre?: string; bpm?: number }) =>
      apiRequest(`/api/projects`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowNewProject(false);
      setNewProjectName("");
    },
  });

  // Create AI mix job mutation
  const createMixJobMutation = useMutation({
    mutationFn: (data: { 
      prompt: string; 
      settings: {
        style: string;
        mood: string;
        intensity: number;
        targetLoudness: number;
        stereoWidth: number;
        dynamicRange: string;
        mixStyle: string;
        matchReference: boolean;
        generateMissing: boolean;
        professionalMaster: boolean;
      }
    }) =>
      apiRequest(`/api/projects/${selectedProject?.id}/mix-jobs`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "mix-jobs"] });
      setShowAiMix(false);
      setAiPrompt("");
    },
  });

  // Upload stem mutation
  const uploadStemMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; projectId: number; file: File }) => {
      const formData = new FormData();
      formData.append('audioFile', data.file);
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('projectId', data.projectId.toString());

      const response = await fetch('/api/upload/stem', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "stems"] });
      setShowStemUpload(false);
      setStemName("");
      setStemType("other");
      setStemFile(null);
    },
  });

  // Upload reference track mutation
  const uploadReferenceMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: number; file: File }) => {
      const formData = new FormData();
      formData.append('audioFile', data.file);
      formData.append('name', data.name);
      formData.append('projectId', data.projectId.toString());

      const response = await fetch('/api/upload/reference', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "reference-tracks"] });
      setShowReferenceUpload(false);
      setReferenceName("");
      setReferenceFile(null);
    },
  });

  // Update stem mutation
  const updateStemMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; volume?: number; pan?: number; soloEnabled?: boolean; muteEnabled?: boolean }) =>
      apiRequest(`/api/stems/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "stems"] });
    },
  });

  // Transport controls
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStop = () => {
    setIsPlaying(false);
    setPosition(0);
  };

  // Handle stem updates
  const handleStemVolumeChange = (id: number, volume: number) => {
    updateStemMutation.mutate({ id, volume: volume / 100 });
  };

  const handleStemPanChange = (id: number, pan: number) => {
    updateStemMutation.mutate({ id, pan: (pan - 50) / 50 });
  };

  const handleStemMute = (id: number, muted: boolean) => {
    updateStemMutation.mutate({ id, muteEnabled: muted });
  };

  const handleStemSolo = (id: number, solo: boolean) => {
    updateStemMutation.mutate({ id, soloEnabled: solo });
  };

  // Handle form submissions
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate({
        name: newProjectName.trim(),
        description: "New audio production project",
        genre: "Electronic",
        bpm: 128
      });
    }
  };

  const handleUploadStem = () => {
    if (stemName.trim() && selectedProject && stemFile) {
      uploadStemMutation.mutate({
        name: stemName.trim(),
        type: stemType,
        projectId: selectedProject.id,
        file: stemFile
      });
    }
  };

  const handleUploadReference = () => {
    if (referenceName.trim() && selectedProject && referenceFile) {
      uploadReferenceMutation.mutate({
        name: referenceName.trim(),
        projectId: selectedProject.id,
        file: referenceFile
      });
    }
  };

  const handleStartAiMix = () => {
    if (aiPrompt.trim() && selectedProject) {
      createMixJobMutation.mutate({
        prompt: aiPrompt.trim(),
        settings: {
          style: "Electronic",
          mood: "Upbeat",
          intensity: 8,
          targetLoudness: -14,
          stereoWidth: 0.8,
          dynamicRange: "medium",
          mixStyle: "modern",
          matchReference: true,
          generateMissing: false,
          professionalMaster: true
        }
      });
    }
  };

  // Auto-select first project if available
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const activeMixJob = mixJobs.find((job: MixJob) => 
    job.status === "pending" || job.status === "analyzing" || job.status === "generating" || job.status === "mixing"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-elevated">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Radio className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Studio
              </h1>
            </div>

            {selectedProject && (
              <div className="flex items-center space-x-2 ml-8">
                <Music className="h-5 w-5 text-foreground-muted" />
                <span className="font-medium">{selectedProject.name}</span>
                {selectedProject.genre && (
                  <Badge variant="secondary">{selectedProject.genre}</Badge>
                )}
                {selectedProject.bpm && (
                  <Badge variant="outline">{selectedProject.bpm} BPM</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Start a new audio production project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowNewProject(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim() || createProjectMutation.isPending}
                      className="flex-1"
                    >
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - Project & Track Management */}
        <div className="w-80 border-r border-border bg-background-panel">
          <div className="p-4">
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="stems">Stems</TabsTrigger>
                <TabsTrigger value="reference">Reference</TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="mt-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {projects.map((project: Project) => (
                      <Card
                        key={project.id}
                        className={`cursor-pointer transition-colors hover:bg-surface-hover ${
                          selectedProject?.id === project.id ? 'border-primary bg-surface-hover' : ''
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <CardContent className="p-3">
                          <h3 className="font-medium truncate">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-foreground-muted truncate mt-1">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            {project.genre && (
                              <Badge variant="secondary" className="text-xs">{project.genre}</Badge>
                            )}
                            {project.bpm && (
                              <Badge variant="outline" className="text-xs">{project.bpm} BPM</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="stems" className="mt-4">
                <div className="space-y-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowStemUpload(true)}
                    disabled={!selectedProject}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Stem
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {stems.map((stem: Stem) => (
                      <Card key={stem.id} className="stem-strip">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium ${getStemColor(stem.type)}`}>
                              {stem.name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {stem.type}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Volume</Label>
                              <Slider
                                value={[stem.volume * 100]}
                                onValueChange={([value]) => handleStemVolumeChange(stem.id, value)}
                                max={100}
                                step={1}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Pan</Label>
                              <Slider
                                value={[(stem.pan * 50) + 50]}
                                onValueChange={([value]) => handleStemPanChange(stem.id, value)}
                                max={100}
                                step={1}
                                className="mt-1"
                              />
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                variant={stem.muteEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStemMute(stem.id, !stem.muteEnabled)}
                                className="flex-1"
                              >
                                {stem.muteEnabled ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant={stem.soloEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStemSolo(stem.id, !stem.soloEnabled)}
                                className="flex-1"
                              >
                                S
                              </Button>
                            </div>

                            <div className="text-xs text-foreground-muted">
                              <div>Key: {stem.analysis?.keyEstimate || 'Unknown'}</div>
                              <div>BPM: {stem.analysis?.bpmEstimate || 'Unknown'}</div>
                              <div>Suitability: {stem.analysis?.suitability ? Math.round(stem.analysis.suitability * 100) : 0}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="reference" className="mt-4">
                <div className="space-y-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowReferenceUpload(true)}
                    disabled={!selectedProject}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Reference
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {referenceTracks.map((track: ReferenceTrack) => (
                      <Card key={track.id} className="border-accent/20">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-accent">{track.name}</h4>
                          <div className="text-xs text-foreground-muted mt-2">
                            <div>Key: {track.analysis?.keyEstimate || 'Unknown'}</div>
                            <div>BPM: {track.analysis?.bpmEstimate || 'Unknown'}</div>
                            <div>Time: {track.analysis?.timeSignature || 'Unknown'}</div>
                            <div>Loudness: {track.analysis?.loudness || 'Unknown'} LUFS</div>
                            <div>Stereo Width: {track.analysis?.stereoWidth ? Math.round(track.analysis.stereoWidth * 100) : 0}%</div>
                          </div>
                          {track.analysis?.detectedInstruments?.length > 0 && (
                            <div className="mt-2">
                              <Label className="text-xs">Detected Instruments:</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {track.analysis?.detectedInstruments?.slice(0, 3).map((inst, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {inst.instrument}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Working Area */}
        <div className="flex-1 flex flex-col">
          {/* Waveform / Timeline Area */}
          <div className="flex-1 bg-background-elevated border-b border-border">
            <div className="p-6">
              {selectedProject ? (
                <div className="waveform-container h-64">
                  <div className="flex items-center justify-center h-full text-foreground-muted">
                    <div className="text-center">
                      <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Waveform visualization will appear here</p>
                      <p className="text-sm mt-2">Upload stems to see audio waveforms</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-foreground-muted">
                  <div className="text-center">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a project to start working</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transport Controls */}
          <div className="bg-background-panel border-b border-border p-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPosition(0)}
                className="transport-button"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={isPlaying ? handlePause : handlePlay}
                className={`transport-button ${isPlaying ? 'active' : ''}`}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleStop}
                className="transport-button"
              >
                <Square className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="transport-button"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <Separator orientation="vertical" className="h-8" />

              <Button
                variant="outline"
                size="lg"
                className="transport-button"
              >
                <Mic className="h-5 w-5" />
              </Button>

              <div className="flex items-center space-x-2 ml-8">
                <span className="text-sm font-mono">00:00</span>
                <div className="w-32 h-2 bg-background-surface rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${position}%` }}
                  />
                </div>
                <span className="text-sm font-mono">03:24</span>
              </div>
            </div>
          </div>

          {/* AI Control Panel */}
          <div className="bg-background-elevated p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                AI Mixing Engine
              </h3>

              <Dialog open={showAiMix} onOpenChange={setShowAiMix}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedProject || !!activeMixJob}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start AI Mix
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>AI Mixing Assistant</DialogTitle>
                    <DialogDescription>
                      Describe how you want your track to sound and the AI will analyze your stems and create a professional mix
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="aiPrompt">Mixing Instructions</Label>
                      <Textarea
                        id="aiPrompt"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Create a modern pop mix with punchy drums, warm vocals, and wide stereo image. Match the energy of the reference track."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Style</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                            <SelectItem value="lo-fi">Lo-Fi</SelectItem>
                            <SelectItem value="clinical">Clinical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Mood</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mood" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="energetic">Energetic</SelectItem>
                            <SelectItem value="mellow">Mellow</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                            <SelectItem value="dreamy">Dreamy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowAiMix(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStartAiMix}
                        disabled={!aiPrompt.trim() || createMixJobMutation.isPending}
                        className="flex-1"
                      >
                        Start AI Mix
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stem Upload Dialog */}
            <Dialog open={showStemUpload} onOpenChange={setShowStemUpload}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Audio Stem</DialogTitle>
                  <DialogDescription>
                    Add a new audio stem to your project for AI mixing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stemName">Stem Name</Label>
                    <Input
                      id="stemName"
                      value={stemName}
                      onChange={(e) => setStemName(e.target.value)}
                      placeholder="e.g. Vocals, Drums, Bass"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stemType">Stem Type</Label>
                    <Select value={stemType} onValueChange={setStemType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocals">Vocals</SelectItem>
                        <SelectItem value="drums">Drums</SelectItem>
                        <SelectItem value="bass">Bass</SelectItem>
                        <SelectItem value="guitar">Guitar</SelectItem>
                        <SelectItem value="keys">Keys</SelectItem>
                        <SelectItem value="synth">Synth</SelectItem>
                        <SelectItem value="strings">Strings</SelectItem>
                        <SelectItem value="brass">Brass</SelectItem>
                        <SelectItem value="fx">FX</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stemFile">Audio File</Label>
                    <Input
                      id="stemFile"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setStemFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {stemFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {stemFile.name}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowStemUpload(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadStem}
                      disabled={!stemName.trim() || !stemFile || uploadStemMutation.isPending}
                      className="flex-1"
                    >
                      {uploadStemMutation.isPending ? "Uploading..." : "Upload Stem"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Reference Track Upload Dialog */}
            <Dialog open={showReferenceUpload} onOpenChange={setShowReferenceUpload}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Reference Track</DialogTitle>
                  <DialogDescription>
                    Add a reference track for the AI to analyze and match its style
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="referenceName">Reference Track Name</Label>
                    <Input
                      id="referenceName"
                      value={referenceName}
                      onChange={(e) => setReferenceName(e.target.value)}
                      placeholder="e.g. Professional Mix Reference"
                    />
                  </div>
                  <div>
                    <Label htmlFor="referenceFile">Audio File</Label>
                    <Input
                      id="referenceFile"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {referenceFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {referenceFile.name}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowReferenceUpload(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadReference}
                      disabled={!referenceName.trim() || !referenceFile || uploadReferenceMutation.isPending}
                      className="flex-1"
                    >
                      {uploadReferenceMutation.isPending ? "Uploading..." : "Upload Reference"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Active Mix Job Status */}
            {activeMixJob && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">AI Mix in Progress</h4>
                    <Badge variant="secondary">{activeMixJob.currentPhase || activeMixJob.status}</Badge>
                  </div>
                  <Progress value={activeMixJob.progress * 100} className="mb-2" />
                  <p className="text-sm text-foreground-muted">{activeMixJob.prompt}</p>
                </CardContent>
              </Card>
            )}

            {/* Completed Mix Jobs */}
            {mixJobs.filter((job: MixJob) => job.status === "completed").length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recent Mixes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {mixJobs
                    .filter((job: MixJob) => job.status === "completed")
                    .slice(0, 4)
                    .map((job: MixJob) => (
                      <Card key={job.id} className="cursor-pointer hover:bg-surface-hover">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Mix #{job.id}</span>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-foreground-muted mt-1 truncate">
                            {job.prompt}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}