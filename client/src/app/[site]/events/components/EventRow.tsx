"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { Event } from "../../../../api/analytics/endpoints";
import { Avatar } from "../../../../components/Avatar";
import { EventTypeIcon } from "../../../../components/EventIcons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";
import { hour12, userLocale } from "../../../../lib/dateTimeUtils";
import { getTimezone } from "../../../../lib/store";
import { getCountryName, getUserDisplayName, truncateString } from "../../../../lib/utils";
import { Browser } from "../../components/shared/icons/Browser";
import { CountryFlag } from "../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../components/shared/icons/OperatingSystem";
import { DeviceIcon, getEventTypeLabel, getMainData, parseEventProperties } from "./eventLogUtils";

interface EventRowProps {
  event: Event;
  site: string;
  onClick: (event: Event) => void;
}

export function EventRow({ event, site, onClick }: EventRowProps) {
  const eventProperties = parseEventProperties(event);
  const eventTime = DateTime.fromSQL(event.timestamp, { zone: "utc" })
    .setLocale(userLocale)
    .setZone(getTimezone());
  const mainData = getMainData(event, eventProperties);
  const userProfileId = event.identified_user_id || event.user_id;
  const displayName = getUserDisplayName({
    identified_user_id: event.identified_user_id || undefined,
    user_id: event.user_id,
  });

  return (
    <div
      className="grid grid-cols-[140px_220px_160px_160px_minmax(240px,1fr)] border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 cursor-pointer"
      onClick={() => onClick(event)}
    >
      <div className="text-neutral-500 dark:text-neutral-400 px-2 py-1 flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{eventTime.toFormat(hour12 ? "MMM d, h:mm:ss a" : "dd MMM, HH:mm:ss")}</span>
          </TooltipTrigger>
          <TooltipContent>
            <span>{eventTime.toRelative()}</span>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="px-2 py-1">
        <Link
          href={`/${site}/user/${encodeURIComponent(userProfileId)}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          <Avatar size={18} id={event.user_id} lastActiveTime={eventTime} />
          <div className="text-neutral-700 dark:text-neutral-200 truncate max-w-[160px] hover:underline">{displayName}</div>
        </Link>
      </div>

      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200 px-2 py-1">
        <EventTypeIcon type={event.type} />
        <span>{getEventTypeLabel(event.type)}</span>
      </div>

      <div className="flex space-x-1 items-center px-2 py-1">
        {event.country && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <CountryFlag country={event.country} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getCountryName(event.country)}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Browser browser={event.browser || "Unknown"} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{event.browser || "Unknown browser"}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <OperatingSystem os={event.operating_system || ""} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{event.operating_system || "Unknown OS"}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DeviceIcon deviceType={event.device_type || ""} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{event.device_type || "Unknown device"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="text-neutral-600 dark:text-neutral-300 px-2 py-1">
        {mainData.url ? (
          <Link
            href={mainData.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="truncate hover:underline inline-block max-w-[380px]"
            title={mainData.label}
          >
            {truncateString(mainData.label, 80)}
          </Link>
        ) : (
          <span className="truncate inline-block max-w-[380px]" title={mainData.label}>
            {truncateString(mainData.label, 80)}
          </span>
        )}
      </div>
    </div>
  );
}
