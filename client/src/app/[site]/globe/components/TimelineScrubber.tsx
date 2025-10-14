import { debounce } from "lodash";
import { AlertTriangle, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TimelineSlider } from "../../../../components/ui/timeline-slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";
import { useTimelineSessions } from "../hooks/useTimelineSessions";
import { useTimelineStore } from "../timelineStore";
import { formatTimelineTime, generateTimeWindows, getActiveSessions } from "../timelineUtils";

export function TimelineScrubber() {
  const { currentTime, timeRange, windowSize, setCurrentTime } = useTimelineStore();
  const { activeSessions, allSessions, isLoading, hasMoreData } = useTimelineSessions();
  const [isPlaying, setIsPlaying] = useState(false);
  const [localSliderIndex, setLocalSliderIndex] = useState(0);

  // Generate time windows for the slider
  const timeWindows = useMemo(() => {
    if (!timeRange) return [];
    return generateTimeWindows(timeRange.start, timeRange.end, windowSize);
  }, [timeRange, windowSize]);

  // Get current window index from store
  const currentIndex = useMemo(() => {
    if (!currentTime || timeWindows.length === 0) return 0;
    const index = timeWindows.findIndex(w => w.equals(currentTime));
    return index >= 0 ? index : 0;
  }, [currentTime, timeWindows]);

  // Sync local slider index with store (on initial load and during playback)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      setLocalSliderIndex(currentIndex);
      isInitialMount.current = false;
    } else if (isPlaying) {
      setLocalSliderIndex(currentIndex);
    }
  }, [currentIndex, isPlaying]);

  // Create debounced update function
  const debouncedUpdateTime = useRef(
    debounce((index: number, windows: ReturnType<typeof generateTimeWindows>) => {
      if (windows[index]) {
        setCurrentTime(windows[index]);
      }
    }, 100)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateTime.cancel();
    };
  }, [debouncedUpdateTime]);

  // Handle slider change - update local state immediately, debounce the expensive update
  const handleSliderChange = useCallback(
    (value: number[]) => {
      const index = value[0];
      setLocalSliderIndex(index);
      debouncedUpdateTime(index, timeWindows);
    },
    [timeWindows, debouncedUpdateTime]
  );

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || timeWindows.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= timeWindows.length) {
        // Loop back to start
        setCurrentTime(timeWindows[0]);
        setIsPlaying(false);
      } else {
        setCurrentTime(timeWindows[nextIndex]);
      }
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, timeWindows, setCurrentTime]);

  // Get the display time based on local slider position
  const displayTime = useMemo(() => {
    return timeWindows[localSliderIndex] || currentTime;
  }, [timeWindows, localSliderIndex, currentTime]);

  // Calculate session counts per time window for histogram
  const sessionCounts = useMemo(() => {
    if (timeWindows.length === 0 || allSessions.length === 0) return [];

    return timeWindows.map(windowStart => {
      const sessionsInWindow = getActiveSessions(allSessions, windowStart, windowSize);
      return sessionsInWindow.length;
    });
  }, [timeWindows, allSessions, windowSize]);

  // Get max count for scaling the histogram
  const maxCount = useMemo(() => {
    return sessionCounts.length > 0 ? Math.max(...sessionCounts, 1) : 1;
  }, [sessionCounts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 h-[66px] w-full">
        <div className="w-4 h-4 border-2 border-neutral-600 border-t-accent-500 rounded-full animate-spin" />
        <span>Loading sessions...</span>
      </div>
    );
  }

  if (!timeRange || timeWindows.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Session histogram */}
      <div className="w-full h-8 flex items-end gap-[1px]">
        {sessionCounts.map((count, index) => {
          const heightPercentage = (count / maxCount) * 100;
          const isActive = index === localSliderIndex;

          return (
            <div
              key={index}
              className="flex-1 transition-all duration-150 cursor-pointer hover:opacity-80"
              style={{
                height: `${heightPercentage}%`,
                backgroundColor: isActive ? "hsl(var(--accent-600))" : "rgba(115, 115, 115, 0.4)",
                minHeight: count > 0 ? "2px" : "0px",
              }}
              title={`${count} session${count !== 1 ? "s" : ""}`}
              onClick={() => {
                setLocalSliderIndex(index);
                if (timeWindows[index]) {
                  setCurrentTime(timeWindows[index]);
                }
              }}
            />
          );
        })}
      </div>
      <TimelineSlider value={[localSliderIndex]} max={timeWindows.length - 1} onValueChange={handleSliderChange} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 w-full">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded hover:bg-neutral-800 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-neutral-300" /> : <Play className="w-4 h-4 text-neutral-300" />}
          </button>
          <span className="text-xs text-neutral-400 min-w-[80px]">
            {displayTime ? formatTimelineTime(displayTime, windowSize) : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-400 flex items-center gap-1 whitespace-nowrap">
            <span className="font-bold text-accent-400">
              {activeSessions.length} / {allSessions.length}
            </span>{" "}
            sessions
            {hasMoreData && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Showing only the first 50,000 sessions. More data may be available.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
