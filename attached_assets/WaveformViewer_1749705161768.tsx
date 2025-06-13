import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "../shared/ThemeProvider";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom";
import HoverPlugin from "wavesurfer.js/dist/plugins/hover";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  MessageSquare,
  Download,
  Volume2,
  VolumeX,
  Scissors,
  Layers,
  Plus,
  Minus,
} from "lucide-react";

// Types for markers and regions
export interface WaveformMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  draggable?: boolean;
}

export interface WaveformRegion {
  id: string;
  start: number;
  end: number;
  color: string;
  content?: string | HTMLElement;
  draggable?: boolean;
  resize?: boolean;
}

export interface WaveformComment {
  id: string;
  time: number;
  text: string;
  author: string;
  authorAvatar?: string;
  createdAt: Date;
}

export interface TrackData {
  id: string;
  name: string;
  url: string;
  waveColor?: string;
  progressColor?: string;
  type?: string; // "drums" | "bass" | "vocals" | etc.
  volume?: number;
  muted?: boolean;
  solo?: boolean;
  effects?: string[];
}

// Props for the WaveformViewer component
interface WaveformViewerProps {
  tracks: TrackData[];
  height?: number;
  waveHeight?: number;
  trackGap?: number;
  markers?: WaveformMarker[];
  regions?: WaveformRegion[];
  comments?: WaveformComment[];
  showTimeline?: boolean;
  showTrackLabels?: boolean;
  showControls?: boolean;
  showZoom?: boolean;
  showVolume?: boolean;
  autoCenter?: boolean;
  minPxPerSec?: number;
  maxPxPerSec?: number;
  initialZoom?: number;
  onMarkerClick?: (markerId: string) => void;
  onRegionClick?: (regionId: string) => void;
  onRegionUpdate?: (region: WaveformRegion) => void;
  onAddComment?: (time: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onReady?: () => void;
  onPositionChange?: (position: number) => void;
  onTrackVolumeChange?: (trackId: string, volume: number) => void;
  onTrackMuteChange?: (trackId: string, muted: boolean) => void;
  onTrackSoloChange?: (trackId: string, solo: boolean) => void;
  className?: string;
}

const WaveformViewer: React.FC<WaveformViewerProps> = ({
  tracks,
  height = 400,
  waveHeight = 80,
  trackGap = 20,
  markers = [],
  regions = [],
  comments = [],
  showTimeline = true,
  showTrackLabels = true,
  showControls = true,
  showZoom = true,
  showVolume = true,
  autoCenter = true,
  minPxPerSec = 10,
  maxPxPerSec = 500,
  initialZoom = 50,
  onMarkerClick,
  onRegionClick,
  onRegionUpdate,
  onAddComment,
  onPlayPause,
  onReady,
  onPositionChange,
  onTrackVolumeChange,
  onTrackMuteChange,
  onTrackSoloChange,
  className = "",
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<HTMLDivElement[]>([]);
  const wavesurferRefs = useRef<Record<string, WaveSurfer>>({});
  const regionsPluginRefs = useRef<Record<string, RegionsPlugin>>({});
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(initialZoom);
  const [isReady, setIsReady] = useState(false);
  const [activeComments, setActiveComments] = useState<string[]>([]);
  const [showAllTracks, setShowAllTracks] = useState(true);
  const [activeTracks, setActiveTracks] = useState<string[]>(tracks.map(t => t.id));
  const [soloTracks, setSoloTracks] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [displayMarkers, setDisplayMarkers] = useState<WaveformMarker[]>([]);

  // Format time in MM:SS.ms format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 100);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Initialize WaveSurfer instances
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up previous instances
    Object.values(wavesurferRefs.current).forEach(ws => ws.destroy());
    wavesurferRefs.current = {};
    regionsPluginRefs.current = {};
    
    let maxDuration = 0;
    let loadedCount = 0;
    
    // Create WaveSurfer instances for each track
    tracks.forEach((track, index) => {
      if (!trackRefs.current[index]) return;

      // Determine colors based on track type and theme
      const waveColor = track.waveColor || getStemColor(track.type || 'other', theme);
      const progressColor = track.progressColor || theme.colors.accent.default;
      
      // Create timeline plugin for the first track only
      const timelinePlugin = index === 0 && showTimeline && timelineRef.current
        ? TimelinePlugin.create({
            container: timelineRef.current,
            timeInterval: 1,
            primaryLabelInterval: 10,
            secondaryLabelInterval: 1,
          })
        : null;
      
      // Create regions plugin
      const regionsPlugin = RegionsPlugin.create();
      
      // Create hover plugin
      const hoverPlugin = HoverPlugin.create({
        lineColor: theme.colors.accent.default,
        lineWidth: 1,
        labelBackground: theme.colors.background.elevated,
        labelColor: theme.colors.foreground.primary,
        formatTimeCallback: formatTime,
      });
      
      // Create zoom plugin
      const zoomPlugin = ZoomPlugin.create();
      
      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: trackRefs.current[index],
        waveColor,
        progressColor,
        height: waveHeight,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorColor: theme.colors.waveform?.cursor || theme.colors.accent.default,
        cursorWidth: 2,
        autoCenter,
        backend: 'MediaElement',
        normalize: true,
        fillParent: true,
        plugins: [
          regionsPlugin,
          hoverPlugin,
          zoomPlugin,
          ...(timelinePlugin ? [timelinePlugin] : []),
        ],
      });
      
      // Save references
      wavesurferRefs.current[track.id] = wavesurfer;
      regionsPluginRefs.current[track.id] = regionsPlugin;
      
      // Load audio
      wavesurfer.load(track.url);
      
      // Set initial volume
      if (track.volume !== undefined) {
        wavesurfer.setVolume(track.volume);
      }
      
      // Set initial mute state
      if (track.muted) {
        wavesurfer.setMuted(true);
      }
      
      // Event listeners
      wavesurfer.on('ready', () => {
        const trackDuration = wavesurfer.getDuration();
        maxDuration = Math.max(maxDuration, trackDuration);
        
        // Apply initial zoom
        wavesurfer.zoom(initialZoom);
        
        // Mark track as loaded
        loadedCount++;
        
        // If all tracks are loaded, initialize regions and markers
        if (loadedCount === tracks.length) {
          setDuration(maxDuration);
          setIsReady(true);
          
          // Initialize regions and markers on the primary track (first track)
          if (index === 0) {
            // Add regions
            regions.forEach(region => {
              regionsPlugin.addRegion({
                id: region.id,
                start: region.start,
                end: region.end,
                color: region.color || `${theme.colors.accent.default}33`,
                drag: region.draggable,
                resize: region.resize,
                content: region.content,
              });
            });
            
            // Set markers to state
            setDisplayMarkers(markers);
          }
          
          if (onReady) onReady();
        }
      });
      
      wavesurfer.on('audioprocess', (currentTime) => {
        if (index === 0) {
          setCurrentTime(currentTime);
          if (onPositionChange) onPositionChange(currentTime);
        }
      });
      
      wavesurfer.on('play', () => {
        if (index === 0) {
          setIsPlaying(true);
          if (onPlayPause) onPlayPause(true);
        }
      });
      
      wavesurfer.on('pause', () => {
        if (index === 0) {
          setIsPlaying(false);
          if (onPlayPause) onPlayPause(false);
        }
      });
      
      wavesurfer.on('interaction', () => {
        if (index === 0) {
          const newTime = wavesurfer.getCurrentTime();
          setCurrentTime(newTime);
          if (onPositionChange) onPositionChange(newTime);
        }
      });
      
      // Region events
      regionsPlugin.on('region-clicked', (region) => {
        if (onRegionClick) onRegionClick(region.id);
      });
      
      regionsPlugin.on('region-updated', (region) => {
        if (onRegionUpdate) {
          onRegionUpdate({
            id: region.id,
            start: region.start,
            end: region.end,
            color: region.color,
            content: region.content,
          });
        }
      });
      

    });
    
    // Cleanup function
    return () => {
      Object.values(wavesurferRefs.current).forEach(ws => {
        ws.destroy();
      });
    };
  }, [tracks, theme]);
  
  // Synchronize playback between all tracks
  const syncPlayback = useCallback((mainTrackId: string) => {
    const mainWavesurfer = wavesurferRefs.current[mainTrackId];
    if (!mainWavesurfer) return;
    
    const currentTime = mainWavesurfer.getCurrentTime();
    
    Object.entries(wavesurferRefs.current).forEach(([trackId, ws]) => {
      if (trackId !== mainTrackId) {
        ws.setTime(currentTime);
        if (isPlaying) {
          ws.play();
        }
      }
    });
  }, [isPlaying]);
  
  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    const firstTrackId = tracks[0]?.id;
    if (!firstTrackId) return;
    const primaryWavesurfer = wavesurferRefs.current[firstTrackId];
    if (!primaryWavesurfer) return;
    
    if (isPlaying) {
      Object.values(wavesurferRefs.current).forEach(ws => ws.pause());
    } else {
      Object.values(wavesurferRefs.current).forEach(ws => ws.play());
    }
    
    setIsPlaying(!isPlaying);
    if (onPlayPause) onPlayPause(!isPlaying);
  }, [isPlaying, tracks, onPlayPause]);
  
  // Handle stop
  const handleStop = useCallback(() => {
    Object.values(wavesurferRefs.current).forEach(ws => {
      ws.stop();
    });
    setIsPlaying(false);
    if (onPlayPause) onPlayPause(false);
  }, [onPlayPause]);
  
  // Handle seek
  const handleSeek = useCallback((time: number) => {
    Object.values(wavesurferRefs.current).forEach(ws => {
      ws.setTime(time);
    });
    setCurrentTime(time);
    if (onPositionChange) onPositionChange(time);
  }, [onPositionChange]);
  
  // Handle skip forward/backward
  const handleSkip = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    handleSeek(newTime);
  }, [currentTime, duration, handleSeek]);
  
  // Handle zoom
  const handleZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(minPxPerSec, Math.min(maxPxPerSec, newZoom));
    
    Object.values(wavesurferRefs.current).forEach(ws => {
      ws.zoom(clampedZoom);
    });
    
    setZoom(clampedZoom);
  }, [minPxPerSec, maxPxPerSec]);
  
  // Handle track volume change
  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    const wavesurfer = wavesurferRefs.current[trackId];
    if (!wavesurfer) return;
    
    wavesurfer.setVolume(volume);
    if (onTrackVolumeChange) onTrackVolumeChange(trackId, volume);
  }, [onTrackVolumeChange]);
  
  // Handle track mute toggle
  const handleTrackMuteToggle = useCallback((trackId: string) => {
    const wavesurfer = wavesurferRefs.current[trackId];
    if (!wavesurfer) return;
    
    const isMuted = !wavesurfer.getMuted();
    wavesurfer.setMuted(isMuted);
    
    if (onTrackMuteChange) onTrackMuteChange(trackId, isMuted);
  }, [onTrackMuteChange]);
  
  // Handle track solo toggle
  const handleTrackSoloToggle = useCallback((trackId: string) => {
    let newSoloTracks: string[];
    
    if (soloTracks.includes(trackId)) {
      // Unsolo this track
      newSoloTracks = soloTracks.filter(id => id !== trackId);
    } else {
      // Solo this track
      newSoloTracks = [...soloTracks, trackId];
    }
    
    // Apply solo logic
    tracks.forEach(track => {
      const wavesurfer = wavesurferRefs.current[track.id];
      if (!wavesurfer) return;
      
      // If any track is soloed, mute all tracks except soloed ones
      if (newSoloTracks.length > 0) {
        wavesurfer.setMuted(!newSoloTracks.includes(track.id));
      } else {
        // If no tracks are soloed, unmute all tracks
        wavesurfer.setMuted(false);
      }
    });
    
    setSoloTracks(newSoloTracks);
    if (onTrackSoloChange) onTrackSoloChange(trackId, !soloTracks.includes(trackId));
  }, [soloTracks, tracks, onTrackSoloChange]);
  
  // Handle track visibility toggle
  const handleTrackVisibilityToggle = useCallback((trackId: string) => {
    setActiveTracks(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  }, []);
  
  // Handle toggle all tracks
  const handleToggleAllTracks = useCallback(() => {
    if (showAllTracks) {
      setActiveTracks([]);
    } else {
      setActiveTracks(tracks.map(t => t.id));
    }
    setShowAllTracks(!showAllTracks);
  }, [showAllTracks, tracks]);
  
  // Handle add comment
  const handleAddComment = useCallback(() => {
    if (onAddComment) onAddComment(currentTime);
  }, [currentTime, onAddComment]);
  
  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Get stem color based on type and theme
  function getStemColor(type: string, theme: any): string {
    const stemColors = theme.colors.stems;
    return stemColors[type] || stemColors.other;
  }
  
  // Calculate total height based on visible tracks
  const totalHeight = showTimeline 
    ? height 
    : Math.min(
        height, 
        activeTracks.length * (waveHeight + trackGap) + (showControls ? 60 : 0)
      );
  
  return (
    <div 
      ref={containerRef}
      className={`waveform-viewer relative overflow-hidden rounded-lg border border-solid ${theme.isDark ? 'border-gray-700' : 'border-gray-200'} ${className}`}
      style={{
        height: isFullscreen ? '100%' : `${totalHeight}px`,
        backgroundColor: theme.colors.background.secondary,
      }}
    >
      {/* Timeline */}
      {showTimeline && (
        <div 
          ref={timelineRef}
          className="waveform-timeline"
          style={{
            height: '30px',
            borderBottom: `1px solid ${theme.colors.border.default}`,
            backgroundColor: theme.colors.background.tertiary,
          }}
        />
      )}
      
      {/* Tracks container */}
      <div 
        className="waveform-tracks-container overflow-y-auto"
        style={{
          height: isFullscreen 
            ? 'calc(100% - 90px)' 
            : `${totalHeight - (showTimeline ? 30 : 0) - (showControls ? 60 : 0)}px`,
        }}
      >
        {tracks.map((track, index) => (
          <div 
            key={track.id}
            className={`waveform-track-wrapper relative ${!activeTracks.includes(track.id) ? 'hidden' : ''}`}
            style={{
              marginBottom: index < tracks.length - 1 ? `${trackGap}px` : 0,
            }}
          >
            {showTrackLabels && (
              <div 
                className="waveform-track-label absolute left-2 top-2 z-10 rounded px-2 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${getStemColor(track.type || 'other', theme)}88`,
                  color: theme.colors.foreground.primary,
                }}
              >
                {track.name}
              </div>
            )}
            
            {/* Track controls */}
            <div 
              className="waveform-track-controls absolute right-2 top-2 z-10 flex items-center space-x-2"
            >
              {showVolume && (
                <div className="flex items-center space-x-1">
                  <button
                    className="rounded p-1 hover:bg-black hover:bg-opacity-20"
                    onClick={() => handleTrackMuteToggle(track.id)}
                    title={wavesurferRefs.current[track.id]?.getMuted() ? "Unmute" : "Mute"}
                  >
                    {wavesurferRefs.current[track.id]?.getMuted() ? (
                      <VolumeX size={14} />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>
                  <button
                    className={`rounded p-1 hover:bg-black hover:bg-opacity-20 ${
                      soloTracks.includes(track.id) ? 'bg-yellow-500 bg-opacity-50' : ''
                    }`}
                    onClick={() => handleTrackSoloToggle(track.id)}
                    title={soloTracks.includes(track.id) ? "Unsolo" : "Solo"}
                  >
                    <span className="text-xs font-bold">S</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Waveform container */}
            <div
              ref={el => {
                if (el) trackRefs.current[index] = el;
              }}
              className="waveform-track"
              style={{
                height: `${waveHeight}px`,
                backgroundColor: theme.colors.background.primary,
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Comments overlay */}
      {comments.length > 0 && (
        <div className="waveform-comments-overlay absolute inset-0 pointer-events-none">
          {comments.map(comment => {
            const firstTrackId = tracks[0]?.id;
            if (!firstTrackId) return null;
            const primaryWavesurfer = wavesurferRefs.current[firstTrackId];
            if (!primaryWavesurfer) return null;
            
            const duration = primaryWavesurfer.getDuration();
            const containerWidth = primaryWavesurfer.getWrapper().offsetWidth;
            const pixelPosition = duration > 0 ? (comment.time / duration) * containerWidth : 0;
            const isActive = activeComments.includes(comment.id);
            
            return (
              <div
                key={comment.id}
                className="waveform-comment absolute"
                style={{
                  left: `${pixelPosition}px`,
                  top: showTimeline ? '30px' : '0',
                }}
              >
                <div 
                  className="waveform-comment-marker h-full w-0.5 pointer-events-auto cursor-pointer"
                  style={{
                    backgroundColor: theme.colors.accent.default,
                    height: `${activeTracks.length * (waveHeight + trackGap) - trackGap}px`,
                  }}
                  onClick={() => {
                    setActiveComments(prev => 
                      prev.includes(comment.id) 
                        ? prev.filter(id => id !== comment.id)
                        : [...prev, comment.id]
                    );
                  }}
                />
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="waveform-comment-bubble absolute z-20 pointer-events-auto"
                      style={{
                        top: `${activeTracks.length * (waveHeight + trackGap) - trackGap + 10}px`,
                        transform: 'translateX(-50%)',
                        maxWidth: '200px',
                        backgroundColor: theme.colors.background.elevated,
                        borderRadius: '8px',
                        boxShadow: theme.shadows.md,
                        padding: '8px',
                        border: `1px solid ${theme.colors.border.default}`,
                      }}
                    >
                      <div className="flex items-start space-x-2">
                        <div 
                          className="waveform-comment-avatar w-6 h-6 rounded-full bg-gray-300 flex-shrink-0"
                          style={{
                            backgroundImage: comment.authorAvatar ? `url(${comment.authorAvatar})` : undefined,
                            backgroundColor: comment.authorAvatar ? undefined : theme.colors.accent.muted,
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{comment.author}</span>
                            <span className="text-xs text-gray-500">
                              {formatTime(comment.time)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Markers overlay */}
      {displayMarkers.length > 0 && (
        <div className="waveform-markers-overlay absolute inset-0 pointer-events-none">
          {displayMarkers.map(marker => {
            const firstTrackId = tracks[0]?.id;
            if (!firstTrackId) return null;
            const primaryWavesurfer = wavesurferRefs.current[firstTrackId];
            if (!primaryWavesurfer || !primaryWavesurfer.getDuration) return null;
            
            const pixelPosition = (marker.time / primaryWavesurfer.getDuration()) * primaryWavesurfer.getWrapper().offsetWidth;
            
            return (
              <div
                key={marker.id}
                className="waveform-marker absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${pixelPosition}px`,
                  top: showTimeline ? '30px' : '0',
                }}
                onClick={() => {
                  if (onMarkerClick) onMarkerClick(marker.id);
                }}
              >
                <div 
                  className="waveform-marker-line h-full w-1"
                  style={{
                    backgroundColor: marker.color || theme.colors.accent.default,
                    height: `${activeTracks.length * (waveHeight + trackGap) - trackGap}px`,
                    opacity: 0.8,
                  }}
                />
                <div 
                  className="waveform-marker-label absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-1 px-2 py-1 rounded text-xs whitespace-nowrap"
                  style={{
                    backgroundColor: marker.color || theme.colors.accent.default,
                    color: theme.colors.foreground.primary,
                  }}
                >
                  {marker.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Playback controls */}
      {showControls && (
        <div 
          className="waveform-controls flex items-center justify-between px-4"
          style={{
            height: '60px',
            borderTop: `1px solid ${theme.colors.border.default}`,
            backgroundColor: theme.colors.background.tertiary,
          }}
        >
          <div className="flex items-center space-x-2">
            <button
              className="waveform-control-button rounded-full p-2 hover:bg-black hover:bg-opacity-10"
              onClick={() => handleSkip(-5)}
              disabled={!isReady}
              title="Skip backward 5 seconds"
            >
              <SkipBack size={16} />
            </button>
            
            <button
              className="waveform-control-button rounded-full p-2 hover:bg-black hover:bg-opacity-10"
              onClick={togglePlayPause}
              disabled={!isReady}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              className="waveform-control-button rounded-full p-2 hover:bg-black hover:bg-opacity-10"
              onClick={() => handleSkip(5)}
              disabled={!isReady}
              title="Skip forward 5 seconds"
            >
              <SkipForward size={16} />
            </button>
            
            <div className="waveform-time text-sm font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {onAddComment && (
              <button
                className="waveform-control-button rounded p-1 hover:bg-black hover:bg-opacity-10"
                onClick={handleAddComment}
                disabled={!isReady}
                title="Add comment at current position"
              >
                <MessageSquare size={16} />
              </button>
            )}
            
            <button
              className="waveform-control-button rounded p-1 hover:bg-black hover:bg-opacity-10"
              onClick={handleToggleAllTracks}
              title={showAllTracks ? "Collapse tracks" : "Expand all tracks"}
            >
              <Layers size={16} />
            </button>
            
            {showZoom && (
              <div className="flex items-center space-x-1">
                <button
                  className="waveform-control-button rounded p-1 hover:bg-black hover:bg-opacity-10"
                  onClick={() => handleZoom(zoom * 0.8)}
                  disabled={zoom <= minPxPerSec}
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                
                <button
                  className="waveform-control-button rounded p-1 hover:bg-black hover:bg-opacity-10"
                  onClick={() => handleZoom(zoom * 1.2)}
                  disabled={zoom >= maxPxPerSec}
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}
            
            <button
              className="waveform-control-button rounded p-1 hover:bg-black hover:bg-opacity-10"
              onClick={handleFullscreenToggle}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      )}
      
      {/* Hover time indicator */}
      {hoveredPosition !== null && (
        <div 
          className="waveform-hover-time absolute top-0 px-2 py-1 rounded text-xs"
          style={{
            left: `${hoveredPosition}px`,
            transform: 'translateX(-50%)',
            backgroundColor: theme.colors.background.elevated,
            color: theme.colors.foreground.primary,
            border: `1px solid ${theme.colors.border.default}`,
            boxShadow: theme.shadows.sm,
            zIndex: 30,
          }}
        >
          {formatTime(hoveredPosition / zoom)}
        </div>
      )}
    </div>
  );
};

export default WaveformViewer;
