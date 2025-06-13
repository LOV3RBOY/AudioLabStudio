import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Mock real-time subscription hook
// In a real Convex implementation, this would use Convex's real-time subscriptions
export function useConvexSubscription<T>(
  queryKey: string[],
  intervalMs: number = 5000
) {
  const query = useQuery<T>({
    queryKey,
    refetchInterval: intervalMs,
  });

  return query;
}

// Mock real-time updates for mix job progress
export function useMixJobProgress(mixJobId: number | null) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!mixJobId) return;

    // Simulate real-time progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 10;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [mixJobId]);

  return progress;
}
