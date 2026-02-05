"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Event } from "../../../../api/analytics/endpoints";
import { useGetEventsInfinite } from "../../../../api/analytics/hooks/events/useGetEvents";
import { NothingFound } from "../../../../components/NothingFound";
import { ErrorState } from "../../../../components/ErrorState";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { EventDetailsSheet } from "./EventDetailsSheet";
import { EventLogItemSkeleton } from "./EventLogItem";
import { EventRow } from "./EventRow";
import { getEventKey } from "./eventLogUtils";

export function EventLog() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetEventsInfinite({
    pageSize: 100,
    isRealtime: true,
    refetchIntervalMs: 3000,
  });


  const { site } = useParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const prevFirstKeyRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const isAtTopRef = useRef(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const allEvents = data?.pages.flatMap(page => page.data) || [];
  const firstEventKey = allEvents[0] ? getEventKey(allEvents[0]) : null;

  const rowVirtualizer = useVirtualizer({
    count: allEvents.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 28,
    overscan: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!virtualItems.length) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem.index >= allEvents.length - 5 && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [virtualItems, allEvents.length, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>("[data-slot=\"scroll-area-viewport\"]");
    if (!viewport) return;
    viewportRef.current = viewport;
    setScrollElement(viewport);

    const handleScroll = () => {
      lastScrollTopRef.current = viewport.scrollTop;
      isAtTopRef.current = viewport.scrollTop < 8;
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const newScrollHeight = viewport.scrollHeight;

    if (prevFirstKeyRef.current && firstEventKey && prevFirstKeyRef.current !== firstEventKey) {
      if (!isAtTopRef.current) {
        const delta = newScrollHeight - prevScrollHeightRef.current;
        if (delta > 0) {
          viewport.scrollTop = lastScrollTopRef.current + delta;
          lastScrollTopRef.current = viewport.scrollTop;
        }
      }
    }

    prevFirstKeyRef.current = firstEventKey;
    prevScrollHeightRef.current = newScrollHeight;
  }, [firstEventKey, allEvents.length]);

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
    return <NothingFound title={"No events found"} description={"Try a different date range or filter"} />;
  }

  return (
    <>
      <ScrollArea className="h-[80vh] border border-neutral-100 dark:border-neutral-800 rounded-lg" ref={scrollAreaRef}>
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
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {virtualItems.map(virtualRow => {
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
