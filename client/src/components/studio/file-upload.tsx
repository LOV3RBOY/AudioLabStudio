import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  projectId: number;
  onUploadComplete: (result: any) => void;
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stemName, setStemName] = useState("");
  const [stemType, setStemType] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !stemName || !stemType) {
        throw new Error("Please fill in all fields and select a file");
      }

      // Simulate file upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // Upload file (mock implementation)
      const uploadResponse = await apiRequest("POST", "/api/upload", {
        filename: file.name,
        size: file.size,
        type: file.type,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { fileUrl } = await uploadResponse.json();

      // Create stem record
      const stemData = {
        projectId,
        name: stemName,
        type: stemType,
        fileUrl,
        metadata: {
          duration: 154, // Mock duration
          sampleRate: 44100,
          bitDepth: 16,
          channels: 2,
          format: file.name.split('.').pop()?.toUpperCase() || 'WAV',
          fileSize: file.size,
        },
        isActive: true,
        volume: 0,
        pan: 0,
        soloEnabled: false,
        muteEnabled: false,
      };

      return apiRequest("POST", `/api/projects/${projectId}/stems`, stemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'stems'] });
      toast({
        title: "Upload successful",
        description: `${stemName} has been uploaded and added to your project.`,
      });
      onUploadComplete();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const resetForm = () => {
    setFile(null);
    setStemName("");
    setStemType("");
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      if (!stemName) {
        setStemName(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!stemName) {
        setStemName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const stemTypes = [
    { value: "drums", label: "Drums" },
    { value: "bass", label: "Bass" },
    { value: "vocals", label: "Vocals" },
    { value: "guitar", label: "Guitar" },
    { value: "synth", label: "Synth" },
    { value: "other", label: "Other" },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file type
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/flac', 'audio/aac', 'audio/ogg'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['wav', 'mp3', 'flac', 'aac', 'ogg', 'm4a'];

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        throw new Error("Invalid file type. Please upload a valid audio file (WAV, MP3, FLAC, AAC, OGG)");
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File too large. Please upload a file smaller than 100MB");
      }

      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('name', file.name);
      formData.append('type', detectStemType(file.name));
      formData.append('projectId', projectId.toString());

      const response = await fetch('/api/upload/stem', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully`,
      });

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const detectStemType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('drum') || name.includes('kick') || name.includes('snare')) return 'drums';
    if (name.includes('bass')) return 'bass';
    if (name.includes('vocal') || name.includes('voice')) return 'vocals';
    if (name.includes('guitar')) return 'guitar';
    if (name.includes('key') || name.includes('piano')) return 'keys';
    if (name.includes('synth')) return 'synth';
    return 'other';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Stem name (e.g., Lead Vocals)"
          value={stemName}
          onChange={(e) => setStemName(e.target.value)}
          className="bg-slate-800 border-slate-600 text-slate-100"
        />

        <Select value={stemType} onValueChange={setStemType}>
          <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
            <SelectValue placeholder="Select stem type" />
          </SelectTrigger>
          <SelectContent>
            {stemTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={`upload-area border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {file ? (
          <div>
            <CloudUpload className="mx-auto mb-2 text-emerald-500" size={32} />
            <p className="text-sm text-slate-300 mb-1">{file.name}</p>
            <p className="text-xs text-slate-500">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div>
            <CloudUpload className="mx-auto mb-2 text-slate-500" size={32} />
            <p className="text-sm text-slate-400">Drop audio files here or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">WAV, MP3, FLAC up to 100MB</p>
          </div>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Uploading...</span>
            <span className="text-slate-400">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      <div className="flex space-x-2">
        <Button
          variant="outline"
          className="flex-1 bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
          onClick={onUploadComplete}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => uploadMutation.mutate()}
          disabled={uploadMutation.isPending || !file || !stemName || !stemType}
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
}