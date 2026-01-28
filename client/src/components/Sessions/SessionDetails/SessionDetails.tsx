import { CopyText } from "@/components/CopyText";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useGetSessionDetailsInfinite } from "../../../api/analytics/hooks/useGetUserSessions";
import { GetSessionsResponse, SessionEvent } from "../../../api/analytics/endpoints";
import { Browser } from "../../../app/[site]/components/shared/icons/Browser";
import { CountryFlag } from "../../../app/[site]/components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../../app/[site]/components/shared/icons/OperatingSystem";
import { useGetRegionName } from "../../../lib/geo";
import { getCountryName, getLanguageName } from "../../../lib/utils";
import { Avatar, generateName } from "../../Avatar";
import { EventTypeFilter } from "../../EventTypeFilter";
import { IdentifiedBadge } from "../../IdentifiedBadge";
import { Button } from "../../ui/button";
import { PageviewItem } from "./PageviewItem";
import { SessionDetailsTimelineSkeleton } from "./SessionDetailsTimelineSkeleton";

interface SessionDetailsProps {
  session: GetSessionsResponse[number];
  userId?: string;
}

export function SessionDetails({ session, userId }: SessionDetailsProps) {
  const {
    data: sessionDetailsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSessionDetailsInfinite(session.session_id);
  const { site } = useParams();

  // Flatten all events into a single array
  const allEvents = useMemo(() => {
    if (!sessionDetailsData?.pages) return [];
    return sessionDetailsData.pages.flatMap((page) => page.data?.events || []);
  }, [sessionDetailsData?.pages]);

  // Get session details from the first page
  const sessionDetails = sessionDetailsData?.pages[0]?.data?.session;

  // Calculate total pageviews and events
  const totalPageviews = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "pageview").length;
  }, [allEvents]);

  const totalEvents = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "custom_event")
      .length;
  }, [allEvents]);

  const totalErrors = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "error").length;
  }, [allEvents]);

  const totalOutbound = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "outbound").length;
  }, [allEvents]);

  const totalButtonClicks = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "button_click")
      .length;
  }, [allEvents]);

  const totalCopies = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "copy").length;
  }, [allEvents]);

  const totalFormSubmits = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "form_submit")
      .length;
  }, [allEvents]);

  const totalInputChanges = useMemo(() => {
    return allEvents.filter((p: SessionEvent) => p.type === "input_change")
      .length;
  }, [allEvents]);

  // Event type filter state
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(
    new Set([
      "pageview",
      "custom_event",
      "outbound",
      "button_click",
      "copy",
      "form_submit",
      "input_change",
    ])
  );

  const toggleEventType = (type: string) => {
    setVisibleEventTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Filter events based on visible types
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event: SessionEvent) =>
      visibleEventTypes.has(event.type)
    );
  }, [allEvents, visibleEventTypes]);

  const { getRegionName } = useGetRegionName();

  const isIdentified = !!session.identified_user_id;

  return (
    <div className="px-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-850">
      {isLoading ? (
        <SessionDetailsTimelineSkeleton
          itemCount={session.pageviews + session.events}
        />
      ) : error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            Error loading session details. Please try again.
          </AlertDescription>
        </Alert>
      ) : sessionDetailsData?.pages[0]?.data ? (
        <Tabs defaultValue="timeline" className="mt-4">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="info">Session Info</TabsTrigger>
            </TabsList>
            {!userId && (
              <Link
                href={`/${site}/user/${encodeURIComponent(
                  isIdentified ? session.identified_user_id : session.user_id
                )}`}
              >
                <Button size={"sm"} variant={"success"}>
                  View User <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>

          <TabsContent value="timeline">
            <div className="mb-4">
              <EventTypeFilter
                visibleTypes={visibleEventTypes}
                onToggle={toggleEventType}
                counts={{
                  pageview: totalPageviews,
                  custom_event: totalEvents,
                  error: totalErrors,
                  outbound: totalOutbound,
                  button_click: totalButtonClicks,
                  copy: totalCopies,
                  form_submit: totalFormSubmits,
                  input_change: totalInputChanges,
                }}
              />
            </div>
            <div className="mb-4 px-1">
              {filteredEvents.map((pageview: SessionEvent, index: number) => {
                // Determine the next timestamp for duration calculation
                // For the last item, use the session end time
                let nextTimestamp;
                if (index < filteredEvents.length - 1) {
                  nextTimestamp = filteredEvents[index + 1].timestamp;
                } else if (sessionDetails) {
                  nextTimestamp = sessionDetails.session_end;
                }

                return (
                  <PageviewItem
                    key={`${pageview.timestamp}-${index}`}
                    item={pageview}
                    index={index}
                    isLast={index === filteredEvents.length - 1 && !hasNextPage}
                    nextTimestamp={nextTimestamp}
                  />
                );
              })}

              {hasNextPage && (
                <div className="flex justify-center mt-6 mb-4">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More</span>
                    )}
                  </Button>
                </div>
              )}

              {sessionDetailsData.pages[0]?.data?.pagination?.total > 0 && (
                <div className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                  Showing {allEvents.length} of{" "}
                  {sessionDetailsData.pages[0]?.data?.pagination?.total} events
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_auto_auto] gap-8 mb-6">
              {/* User Information */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  User Information
                </h4>
                <div className="space-y-3">
                  {sessionDetails?.user_id && (
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
                        <Avatar
                          size={40}
                          id={
                            isIdentified
                              ? session.identified_user_id
                              : sessionDetails.user_id
                          }
                        />
                      </div>
                      <div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                          <span className="font-medium text-neutral-600 dark:text-neutral-300">
                            {isIdentified
                              ? (session.traits?.username as string) ||
                                (session.traits?.name as string) ||
                                session.identified_user_id
                              : generateName(sessionDetails.user_id)}
                          </span>
                          {isIdentified && (
                            <IdentifiedBadge traits={session.traits} />
                          )}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
                          <span className="font-medium text-neutral-600 dark:text-neutral-300">
                            User ID:
                          </span>
                          <CopyText
                            text={
                              isIdentified
                                ? session.identified_user_id
                                : sessionDetails.user_id
                            }
                            maxLength={24}
                            className="inline-flex ml-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {sessionDetails?.language && (
                      <div className="text-sm flex items-center gap-2">
                        <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                          Language:
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {sessionDetails.language
                            ? getLanguageName(sessionDetails.language)
                            : "N/A"}
                        </span>
                      </div>
                    )}

                    {sessionDetails?.country && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                          Country:
                        </span>
                        <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                          <CountryFlag country={sessionDetails.country} />
                          <span>{getCountryName(sessionDetails.country)}</span>
                          {sessionDetails.region && (
                            <span>({sessionDetails.region})</span>
                          )}
                        </div>
                      </div>
                    )}
                    {sessionDetails?.region &&
                      getRegionName(sessionDetails.region) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                            Region:
                          </span>
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {getRegionName(sessionDetails.region)}
                          </span>
                        </div>
                      )}
                    {sessionDetails?.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                          City:
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {sessionDetails.city}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  Device Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                      Device:
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      {sessionDetails?.device_type === "Desktop" && (
                        <Monitor className="w-4 h-4" />
                      )}
                      {sessionDetails?.device_type === "Mobile" && (
                        <Smartphone className="w-4 h-4" />
                      )}
                      {sessionDetails?.device_type === "Tablet" && (
                        <Tablet className="w-4 h-4" />
                      )}
                      <span>{sessionDetails?.device_type || "Unknown"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                      Browser:
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <Browser
                        browser={sessionDetails?.browser || "Unknown"}
                      />
                      <span>
                        {sessionDetails?.browser || "Unknown"}
                        {sessionDetails?.browser_version && (
                          <span className="ml-1">
                            v{sessionDetails.browser_version}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                      OS:
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <OperatingSystem
                        os={sessionDetails?.operating_system || ""}
                      />
                      <span>
                        {sessionDetails?.operating_system || "Unknown"}
                        {sessionDetails?.operating_system_version && (
                          <span className="ml-1">
                            {sessionDetails.operating_system_version}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {sessionDetails?.screen_width &&
                  sessionDetails?.screen_height ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                        Screen:
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {sessionDetails.screen_width} ×{" "}
                        {sessionDetails.screen_height}
                      </span>
                    </div>
                  ) : null}
                  {sessionDetails?.ip && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                        IP:
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {sessionDetails.ip}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Source Information */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  Source Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                      Channel:
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <span>{sessionDetails?.channel || "None"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                      Referrer:
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <span>{sessionDetails?.referrer || "None"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 min-w-[80px]">
                      Entry Page:
                    </span>
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <span>{sessionDetails?.entry_page || "None"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-4 text-center text-neutral-400">
          No data available
        </div>
      )}
    </div>
  );
}
