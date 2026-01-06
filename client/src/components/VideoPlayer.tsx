import { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: {
      Player: new (element: HTMLIFrameElement, options?: Record<string, unknown>) => VimeoPlayer;
    };
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

interface VimeoPlayer {
  on: (event: string, callback: (data: { seconds?: number; duration?: number; percent?: number }) => void) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
  destroy: () => void;
}

interface VideoPlayerProps {
  videoUrl: string;
  onCanComplete: (canComplete: boolean) => void;
}

export default function VideoPlayer({ videoUrl, onCanComplete }: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const maxWatchedTimeRef = useRef(0);
  const lastPlaybackTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isVimeo, setIsVimeo] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const getYouTubeVideoId = useCallback((url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }, []);

  const getVimeoVideoId = useCallback((url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }, []);

  useEffect(() => {
    const youtubeId = getYouTubeVideoId(videoUrl);
    const vimeoId = getVimeoVideoId(videoUrl);
    
    setIsYouTube(!!youtubeId);
    setIsVimeo(!!vimeoId);
    maxWatchedTimeRef.current = 0;
    lastPlaybackTimeRef.current = 0;
    wasPlayingRef.current = false;
    durationRef.current = 0;
    setProgress(0);
    setIsComplete(false);
    onCanComplete(false);

    if (youtubeId) {
      const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
          initializePlayer(youtubeId);
          return;
        }

        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (!existingScript) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }

        const checkAPI = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkAPI);
            initializePlayer(youtubeId);
          }
        }, 100);

        setTimeout(() => clearInterval(checkAPI), 10000);
      };

      const initializePlayer = (videoId: string) => {
        if (!containerRef.current) return;
        
        const newPlayerId = `youtube-player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        
        const playerDiv = document.createElement("div");
        playerDiv.id = newPlayerId;
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(playerDiv);

        playerRef.current = new window.YT.Player(newPlayerId, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              durationRef.current = event.target.getDuration();
              startTracking();
            },
            onStateChange: (event) => {
              const state = event.data;
              
              if (state === window.YT.PlayerState.PLAYING) {
                wasPlayingRef.current = true;
              } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.BUFFERING) {
                if (wasPlayingRef.current && playerRef.current) {
                  lastPlaybackTimeRef.current = playerRef.current.getCurrentTime();
                }
                wasPlayingRef.current = false;
              } else if (state === window.YT.PlayerState.ENDED) {
                const dur = event.target.getDuration();
                maxWatchedTimeRef.current = dur;
                setProgress(100);
                setIsComplete(true);
                onCanComplete(true);
              }
            },
          },
        });
      };

      const startTracking = () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
        }
        
        trackingIntervalRef.current = setInterval(() => {
          if (!playerRef.current) return;
          
          try {
            const currentTime = playerRef.current.getCurrentTime();
            const totalDuration = playerRef.current.getDuration();
            const playerState = playerRef.current.getPlayerState();
            
            if (playerState === window.YT.PlayerState.PLAYING) {
              if (currentTime > maxWatchedTimeRef.current + 2) {
                playerRef.current.seekTo(maxWatchedTimeRef.current, true);
              } else {
                if (currentTime > maxWatchedTimeRef.current) {
                  maxWatchedTimeRef.current = currentTime;
                }
                lastPlaybackTimeRef.current = currentTime;
              }
            }

            const progressPercent = totalDuration > 0 
              ? Math.min((maxWatchedTimeRef.current / totalDuration) * 100, 100)
              : 0;
            setProgress(progressPercent);

            if (progressPercent >= 90) {
              setIsComplete(true);
              onCanComplete(true);
            }
          } catch (e) {
          }
        }, 500);
      };

      loadYouTubeAPI();
    }

    if (vimeoId) {
      const loadVimeoAPI = () => {
        const existingScript = document.querySelector('script[src*="player.vimeo.com/api"]');
        if (!existingScript) {
          const tag = document.createElement("script");
          tag.src = "https://player.vimeo.com/api/player.js";
          tag.onload = () => {
            setTimeout(() => initializeVimeoPlayer(), 100);
          };
          document.body.appendChild(tag);
        } else if (window.Vimeo) {
          initializeVimeoPlayer();
        } else {
          const checkAPI = setInterval(() => {
            if (window.Vimeo) {
              clearInterval(checkAPI);
              initializeVimeoPlayer();
            }
          }, 100);
          setTimeout(() => clearInterval(checkAPI), 10000);
        }
      };

      const initializeVimeoPlayer = () => {
        if (!iframeRef.current || !window.Vimeo) return;
        
        try {
          vimeoPlayerRef.current = new window.Vimeo.Player(iframeRef.current);
          
          vimeoPlayerRef.current.getDuration().then(dur => {
            durationRef.current = dur;
          });

          vimeoPlayerRef.current.on("timeupdate", (data) => {
            const currentTime = data.seconds || 0;
            const dur = durationRef.current;
            
            if (currentTime > maxWatchedTimeRef.current + 2) {
              vimeoPlayerRef.current?.setCurrentTime(maxWatchedTimeRef.current);
            } else {
              if (currentTime > maxWatchedTimeRef.current) {
                maxWatchedTimeRef.current = currentTime;
              }
              lastPlaybackTimeRef.current = currentTime;
            }
            
            const progressPercent = dur > 0 ? (maxWatchedTimeRef.current / dur) * 100 : 0;
            setProgress(progressPercent);
            
            if (progressPercent >= 90) {
              setIsComplete(true);
              onCanComplete(true);
            }
          });

          vimeoPlayerRef.current.on("ended", () => {
            setProgress(100);
            setIsComplete(true);
            onCanComplete(true);
          });
        } catch (e) {
        }
      };

      loadVimeoAPI();
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
        }
        playerRef.current = null;
      }
      if (vimeoPlayerRef.current) {
        try {
          vimeoPlayerRef.current.destroy();
        } catch (e) {
        }
        vimeoPlayerRef.current = null;
      }
    };
  }, [videoUrl, getYouTubeVideoId, getVimeoVideoId, onCanComplete]);

  if (isYouTube) {
    return (
      <div className="relative w-full">
        <div ref={containerRef} className="aspect-video w-full" />
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
          <div className="flex items-center justify-between text-white text-xs mb-1">
            <span className="flex items-center gap-1">
              {isComplete ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Video tamamlandı
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  Video atlama devre dışı
                </>
              )}
            </span>
            <span>{Math.round(progress)}% izlendi</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isVimeo) {
    const vimeoId = getVimeoVideoId(videoUrl);

    return (
      <div className="relative w-full">
        <iframe
          ref={iframeRef}
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          className="aspect-video w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
          <div className="flex items-center justify-between text-white text-xs mb-1">
            <span className="flex items-center gap-1">
              {isComplete ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Video tamamlandı
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  Video atlama devre dışı
                </>
              )}
            </span>
            <span>{Math.round(progress)}% izlendi</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={videoUrl}
      className="aspect-video w-full"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}
