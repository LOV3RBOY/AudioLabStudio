/**
 * Audio Performance Monitoring and Optimization
 * 
 * This module provides utilities for monitoring audio processing performance,
 * detecting audio dropouts, measuring latency, and optimizing audio workloads.
 */

export interface PerformanceMetrics {
  audioLatency: number;          // ms
  bufferSize: number;           // samples
  sampleRate: number;           // Hz
  cpuUsage: number;            // 0-100%
  memoryUsage: number;         // MB
  dropouts: number;            // count
  processingTime: number;      // ms
  timestamp: number;           // unix timestamp
}

export class AudioPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private audioContext?: AudioContext;
  private startTime = 0;
  private dropoutCount = 0;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext;
  }

  startMonitoring(intervalMs = 1000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.dropoutCount = 0;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  private collectMetrics(): void {
    const now = performance.now();
    const metrics: PerformanceMetrics = {
      audioLatency: this.measureAudioLatency(),
      bufferSize: this.audioContext?.baseLatency ? 
        Math.round(this.audioContext.baseLatency * this.audioContext.sampleRate) : 128,
      sampleRate: this.audioContext?.sampleRate || 44100,
      cpuUsage: this.estimateCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
      dropouts: this.dropoutCount,
      processingTime: now - this.startTime,
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    
    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  private measureAudioLatency(): number {
    if (!this.audioContext) return 0;
    
    // Combine base latency and output latency
    const baseLatency = this.audioContext.baseLatency || 0;
    const outputLatency = this.audioContext.outputLatency || 0;
    
    return (baseLatency + outputLatency) * 1000; // Convert to ms
  }

  private estimateCPUUsage(): number {
    // Simplified CPU usage estimation
    // Real implementation would use performance.measureUserAgentSpecificMemory
    return Math.random() * 30 + 10; // Mock: 10-40%
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] ?? null : null;
  }

  getAverageMetrics(samples = 10): Partial<PerformanceMetrics> {
    const recentMetrics = this.metrics.slice(-samples);
    if (recentMetrics.length === 0) return {};

    const averages = recentMetrics.reduce(
      (acc, metric) => ({
        audioLatency: acc.audioLatency + metric.audioLatency,
        cpuUsage: acc.cpuUsage + metric.cpuUsage,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        processingTime: acc.processingTime + metric.processingTime,
      }),
      { audioLatency: 0, cpuUsage: 0, memoryUsage: 0, processingTime: 0 }
    );

    const count = recentMetrics.length;
    return {
      audioLatency: averages.audioLatency / count,
      cpuUsage: averages.cpuUsage / count,
      memoryUsage: averages.memoryUsage / count,
      processingTime: averages.processingTime / count,
    };
  }

  reportDropout(): void {
    this.dropoutCount++;
  }

  isPerformanceGood(): boolean {
    const latest = this.getLatestMetrics();
    if (!latest) return true;

    return (
      latest.audioLatency < 50 &&     // Less than 50ms latency
      latest.cpuUsage < 80 &&         // Less than 80% CPU
      latest.dropouts === 0           // No dropouts
    );
  }
}

/**
 * Audio Buffer Pool for memory optimization
 */
export class AudioBufferPool {
  private pools = new Map<string, AudioBuffer[]>();
  private maxPoolSize = 10;

  getBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
    const key = `${channels}_${length}_${sampleRate}`;
    const pool = this.pools.get(key) || [];
    
    if (pool.length > 0) {
      return pool.pop()!;
    }

    // Create new buffer
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext.createBuffer(channels, length, sampleRate);
  }

  returnBuffer(buffer: AudioBuffer): void {
    const key = `${buffer.numberOfChannels}_${buffer.length}_${buffer.sampleRate}`;
    const pool = this.pools.get(key) || [];
    
    if (pool.length < this.maxPoolSize) {
      // Clear buffer data
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        buffer.getChannelData(i).fill(0);
      }
      
      pool.push(buffer);
      this.pools.set(key, pool);
    }
  }

  clear(): void {
    this.pools.clear();
  }
}

/**
 * Audio Processing Optimizer
 */
export class AudioOptimizer {
  static optimizeBufferSize(sampleRate: number, targetLatency: number): number {
    // Calculate optimal buffer size for target latency
    const bufferSize = Math.round((targetLatency / 1000) * sampleRate);
    
    // Round to nearest power of 2
    return Math.pow(2, Math.round(Math.log2(bufferSize)));
  }

  static shouldUseOfflineProcessing(duration: number, complexity: number): boolean {
    // Use offline processing for long or complex audio
    return duration > 30 || complexity > 0.8;
  }

  static estimateProcessingComplexity(effects: number, channels: number, sampleRate: number): number {
    // Simple complexity estimation
    const baseComplexity = effects * 0.1;
    const channelComplexity = channels * 0.05;
    const rateComplexity = (sampleRate - 44100) / 100000;
    
    return Math.min(1, baseComplexity + channelComplexity + rateComplexity);
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new AudioPerformanceMonitor();

// Global buffer pool instance
export const globalBufferPool = new AudioBufferPool();

/**
 * Web Application Performance Monitor
 */
export class PerformanceMonitor {
  private static config: any = {};
  private static observers: PerformanceObserver[] = [];

  static init(config: {
    captureErrors?: boolean;
    captureNavigation?: boolean;
    captureNetworkRequests?: boolean;
    sampleRate?: number;
    reportingEndpoint?: string;
  }): void {
    this.config = config;

    if (config.captureNavigation) {
      this.observeNavigation();
    }

    if (config.captureNetworkRequests) {
      this.observeResources();
    }
  }

  private static observeNavigation(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('Navigation timing:', entry);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  private static observeResources(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            console.log('Resource timing:', entry.name, entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  static captureException(error: Error, errorInfo?: any): void {
    console.error('Captured exception:', error, errorInfo);
    
    // Send to reporting endpoint if configured
    if (this.config.reportingEndpoint) {
      // In production, this would send to a real monitoring service
      console.log('Would send error to:', this.config.reportingEndpoint);
    }
  }

  static reportWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Report Core Web Vitals
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log(`${entry.name}: ${(entry as any).value}`);
          }
        });
        observer.observe({ entryTypes: ['web-vital'] });
        this.observers.push(observer);
      } catch (e) {
        // Fallback for browsers that don't support web-vital
        console.log('Web vitals not supported');
      }
    }
  }

  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}
