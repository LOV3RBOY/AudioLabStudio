import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { MixJob } from "@shared/schema";

interface MixJobStatusProps {
  projectId: number;
}

export default function MixJobStatus({ projectId }: MixJobStatusProps) {
  const { data: mixJobs = [], isLoading } = useQuery<MixJob[]>({
    queryKey: ['/api/projects', projectId, 'mix-jobs'],
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  const currentJob = mixJobs.find(job => 
    job.status === "processing" || job.status === "queued"
  ) || mixJobs[0];

  if (isLoading) {
    return (
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Current Mix Job</h3>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-2 bg-slate-700 rounded"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Current Mix Job</h3>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <Clock className="mx-auto mb-2 text-slate-500" size={32} />
          <p className="text-slate-400 mb-2">No active mix jobs</p>
          <p className="text-xs text-slate-500">Start an AI mix to see progress here</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Loader2 className="animate-spin text-amber-500" size={16} />;
      case "completed":
        return <CheckCircle className="text-emerald-500" size={16} />;
      case "failed":
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-slate-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-amber-900 text-amber-200";
      case "completed":
        return "bg-emerald-900 text-emerald-200";
      case "failed":
        return "bg-red-900 text-red-200";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  const getPhaseStatus = (phase: any) => {
    switch (phase.status) {
      case "completed":
        return <CheckCircle className="text-emerald-500" size={12} />;
      case "processing":
        return <div className="w-2 h-2 bg-amber-500 rounded-full pulse-ring"></div>;
      case "failed":
        return <AlertCircle className="text-red-500" size={12} />;
      default:
        return <div className="w-2 h-2 bg-slate-600 rounded-full"></div>;
    }
  };

  return (
    <div className="p-4 border-b border-slate-800">
      <h3 className="text-lg font-semibold mb-4">Current Mix Job</h3>
      
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Mix Version {currentJob.version}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(currentJob.status)}`}>
            {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
          </span>
        </div>
        
        {currentJob.status === "processing" && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Overall Progress</span>
              <span>{currentJob.progress}%</span>
            </div>
            <Progress value={currentJob.progress} className="w-full" />
          </div>
        )}
        
        <div className="space-y-2">
          {currentJob.phases.map((phase, index) => (
            <div key={index} className="flex items-center space-x-2">
              {getPhaseStatus(phase)}
              <span className={`text-sm ${
                phase.status === "completed" ? "text-slate-300" :
                phase.status === "processing" ? "text-slate-300" :
                phase.status === "failed" ? "text-red-400" :
                "text-slate-500"
              }`}>
                {phase.name}
              </span>
              <span className="text-xs ml-auto">
                {phase.status === "completed" ? "✓" :
                 phase.status === "processing" ? `${phase.progress || 0}%` :
                 phase.status === "failed" ? "✗" :
                 "Pending"}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            {currentJob.status === "processing" 
              ? "Estimated completion: 2 minutes"
              : currentJob.status === "completed"
              ? "Mix completed successfully"
              : currentJob.status === "failed"
              ? currentJob.error || "Mix failed"
              : "Queued for processing"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
