"use client";

import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Event } from "../../../../../api/analytics/endpoints";
import { fetchSessions } from "../../../../../api/analytics/endpoints/sessions";
import { CopyText } from "../../../../../components/CopyText";
import { EventTypeIcon } from "../../../../../components/EventIcons";
import { SessionCard, SessionCardSkeleton } from "../../../../../components/Sessions/SessionCard";
import { Badge } from "../../../../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../../../../components/ui/sheet";
import { hour12, userLocale } from "../../../../../lib/dateTimeUtils";
import { getTimezone } from "../../../../../lib/store";
import { getCountryName } from "../../../../../lib/utils";
import { Browser } from "../../../components/shared/icons/Browser";
import { CountryFlag } from "../../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../../components/shared/icons/OperatingSystem";
import { buildEventPath, getEventTypeLabel, parseEventProperties } from "./eventLogUtils";
import { DeviceIcon } from "../../../components/shared/icons/Device";

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
      fetchSessions(site, {
        sessionId: event?.session_id || "",
        limit: 1,
        page: 1,
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        timeZone: getTimezone(),
      }).then(res => res.data[0] ?? null),
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
      <SheetContent side="right" className="w-full sm:max-w-[1000px] overflow-y-auto">
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
                <SessionCardSkeleton count={1} />
              ) : sessionQuery.data ? (
                <SessionCard session={sessionQuery.data} expandedByDefault />
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
