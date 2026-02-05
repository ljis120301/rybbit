"use client";

import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import Link from "next/link";
import { Event } from "../../../../../api/analytics/endpoints";
import { fetchSession } from "../../../../../api/analytics/endpoints/sessions";
import { CopyText } from "../../../../../components/CopyText";
import { EventTypeIcon } from "../../../../../components/EventIcons";
import { Badge } from "../../../../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../../../../components/ui/sheet";
import { hour12, userLocale } from "../../../../../lib/dateTimeUtils";
import { getTimezone } from "../../../../../lib/store";
import { getCountryName, getUserDisplayName } from "../../../../../lib/utils";
import { Browser } from "../../../components/shared/icons/Browser";
import { CountryFlag } from "../../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../../components/shared/icons/OperatingSystem";
import { buildEventPath, DeviceIcon, getEventTypeLabel, parseEventProperties } from "./eventLogUtils";

interface EventDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  site: string;
}

export function EventDetailsSheet({ open, onOpenChange, event, site }: EventDetailsSheetProps) {
  const selectedEventProperties = event ? parseEventProperties(event) : {};

  const sessionQuery = useQuery({
    queryKey: ["event-session", site, event?.session_id],
    queryFn: () =>
      fetchSession(site, {
        sessionId: event?.session_id || "",
        limit: 1,
        offset: 0,
      }).then(res => res.data),
    enabled: open && !!event?.session_id && !!site,
    staleTime: 30000,
  });

  return (
    <Sheet
      open={open}
      onOpenChange={nextOpen => {
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-[520px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Event Details</SheetTitle>
        </SheetHeader>

        {!event ? (
          <div className="text-sm text-neutral-500 dark:text-neutral-400">No event selected.</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <EventTypeIcon type={event.type} />
                <span className="font-medium">{getEventTypeLabel(event.type)}</span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Timestamp</span>
                  <span>
                    {DateTime.fromSQL(event.timestamp, { zone: "utc" })
                      .setLocale(userLocale)
                      .setZone(getTimezone())
                      .toFormat(hour12 ? "MMM d, h:mm:ss a" : "dd MMM, HH:mm:ss")}
                  </span>
                </div>
                {/* <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">User</span>
                  <Link
                    href={`/${site}/user/${encodeURIComponent(event.identified_user_id || event.user_id)}`}
                    className="text-neutral-700 dark:text-neutral-200 hover:underline"
                  >
                    {getUserDisplayName({
                      identified_user_id: event.identified_user_id || undefined,
                      user_id: event.user_id,
                    })}
                  </Link>
                </div> */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">User ID</span>
                  <CopyText text={event.user_id} maxLength={24} />
                </div>
                {!!event.identified_user_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Identified ID</span>
                    <CopyText text={event.identified_user_id} maxLength={24} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Session</span>
                  <CopyText text={event.session_id} maxLength={24} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Hostname</span>
                  <span className="truncate max-w-[280px]">{event.hostname || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Path</span>
                  <span className="truncate max-w-[280px]">{buildEventPath(event) || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Referrer</span>
                  <span className="truncate max-w-[280px]">{event.referrer || "-"}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Device Info</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {event.country && (
                  <Badge variant="outline" className="gap-1">
                    <CountryFlag country={event.country} />
                    {getCountryName(event.country)}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Browser browser={event.browser || "Unknown"} />
                  {event.browser || "Unknown"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <OperatingSystem os={event.operating_system || ""} />
                  {event.operating_system || "Unknown"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <DeviceIcon deviceType={event.device_type || ""} />
                  {event.device_type || "Unknown"}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Properties</div>
              {Object.keys(selectedEventProperties).length > 0 ? (
                <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-3 overflow-auto max-h-64">
                  {JSON.stringify(selectedEventProperties, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-neutral-500 dark:text-neutral-400">No properties</div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Session</div>
              {sessionQuery.isLoading ? (
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Loading session...</div>
              ) : sessionQuery.data?.session ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Start</span>
                    <span>
                      {DateTime.fromSQL(sessionQuery.data.session.session_start, { zone: "utc" })
                        .setLocale(userLocale)
                        .setZone(getTimezone())
                        .toFormat(hour12 ? "MMM d, h:mm a" : "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">End</span>
                    <span>
                      {DateTime.fromSQL(sessionQuery.data.session.session_end, { zone: "utc" })
                        .setLocale(userLocale)
                        .setZone(getTimezone())
                        .toFormat(hour12 ? "MMM d, h:mm a" : "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Duration</span>
                    <span>{Math.round(sessionQuery.data.session.session_duration / 60)} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Pageviews</span>
                    <span>{sessionQuery.data.session.pageviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Events</span>
                    <span>{sessionQuery.data.session.events}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Entry</span>
                    <span className="truncate max-w-[260px]">{sessionQuery.data.session.entry_page || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Exit</span>
                    <span className="truncate max-w-[260px]">{sessionQuery.data.session.exit_page || "-"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 dark:text-neutral-400">No session data</div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
