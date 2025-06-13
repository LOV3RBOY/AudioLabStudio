import { useQuery } from "@tanstack/react-query";
import { Play, Download, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MixJob } from "@shared/schema";

interface MixHistoryProps {
  projectId: number;
}

export default function MixHistory({ projectId }: MixHistoryProps) {
  const { data: mixJobs = [], isLoading } = useQuery<MixJob[]>({
    queryKey: ['/api/projects', projectId, 'mix-jobs'],
  });

  const sortedJobs = [...mixJobs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Clock className="text-amber-500" size={16} />;
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Mix History</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Mix History</h3>
      
      <div className="space-y-3">
        {sortedJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-2">No mix history yet</p>
            <p className="text-xs text-slate-500">Start an AI mix to see your mixing history</p>
          </div>
        ) : (
          sortedJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Version {job.version}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                {job.prompt}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {formatTimeAgo(new Date(job.createdAt))}
                </span>
                
                {job.status === "completed" && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 h-auto"
                    >
                      <Play size={12} className="mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white transition-colors p-1 h-auto"
                    >
                      <Download size={12} />
                    </Button>
                  </div>
                )}
                
                {job.status === "failed" && (
                  <span className="text-red-400 text-xs">
                    {job.error ? "Error" : "Failed"}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
