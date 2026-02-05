"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Event } from "../../../../../api/analytics/endpoints";
import { NothingFound } from "../../../../../components/NothingFound";
import { ErrorState } from "../../../../../components/ErrorState";
import { ScrollArea } from "../../../../../components/ui/scroll-area";
import { EventDetailsSheet } from "./EventDetailsSheet";
import { EventLogItemSkeleton } from "./EventLogItem";
import { EventRow } from "./EventRow";
import { RealtimeToggle } from "./RealtimeToggle";
import { useEventLogState } from "./useEventLogState";

export function EventLog() {
  const { site } = useParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const {
    isRealtime,
    toggleRealtime,
    allEvents,
    isLoading,
    isError,
    scrollElement,
    scrollAreaCallbackRef,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLive,
    bufferedCount,
    flushAndScrollToTop,
  } = useEventLogState();

  const rowVirtualizer = useVirtualizer({
    count: allEvents.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 28,
    overscan: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // --- Infinite scroll trigger ---
  const lastItem = virtualItems[virtualItems.length - 1];
  if (
    lastItem &&
    lastItem.index >= allEvents.length - 5 &&
    hasNextPage &&
    !isFetchingNextPage &&
    !isLoading
  ) {
    fetchNextPage();
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 24 }).map((_, index) => (
          <EventLogItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load events"
        message="There was a problem fetching the events. Please try again later."
      />
    );
  }

  if (allEvents.length === 0) {
    return (
      <>
        <RealtimeToggle isRealtime={isRealtime} onToggle={toggleRealtime} />
        <NothingFound
          title={"No events found"}
          description={"Try a different date range or filter"}
        />
      </>
    );
  }

  return (
    <>
      <RealtimeToggle isRealtime={isRealtime} onToggle={toggleRealtime} />

      <div className="relative">
        {/* New events indicator */}
        {isRealtime && !isLive && bufferedCount > 0 && (
          <button
            onClick={flushAndScrollToTop}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-medium shadow-lg hover:bg-accent-600 transition-colors cursor-pointer"
          >
            ↑ {bufferedCount} new event{bufferedCount !== 1 ? "s" : ""}
          </button>
        )}

        <ScrollArea
          className="h-[80vh] border border-neutral-100 dark:border-neutral-800 rounded-lg"
          ref={scrollAreaCallbackRef}
        >
          <div className="relative h-full pr-2 font-mono text-[11px] leading-4">
            <div className="sticky top-0 z-20 bg-neutral-50/95 dark:bg-neutral-850/95 backdrop-blur border-b border-neutral-100 dark:border-neutral-800">
              <div className="grid grid-cols-[140px_220px_160px_160px_minmax(240px,1fr)] px-2 py-1.5 uppercase tracking-wide text-[10px] text-neutral-500 dark:text-neutral-400">
                <div>Timestamp</div>
                <div>User</div>
                <div>Event Type</div>
                <div>Device Info</div>
                <div>Main Data</div>
              </div>
            </div>

            <div className="relative">
              <div
                style={{
                  height: rowVirtualizer.getTotalSize(),
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const event = allEvents[virtualRow.index];
                  if (!event) return null;

                  return (
                    <div
                      key={`${event.timestamp}-${virtualRow.index}`}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <EventRow
                        event={event}
                        site={site as string}
                        onClick={(selected) => {
                          setSelectedEvent(selected);
                          setSheetOpen(true);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {isFetchingNextPage && (
              <div className="py-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <EventLogItemSkeleton key={`next-page-${index}`} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <EventDetailsSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
        site={site as string}
      />
    </>
  );
}
