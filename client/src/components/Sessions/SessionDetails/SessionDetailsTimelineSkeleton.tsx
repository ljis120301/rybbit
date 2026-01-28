import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

import { cn } from "../../../lib/utils";

export const SessionDetailsTimelineSkeleton = memo(
  ({ itemCount }: { itemCount: number }) => {
    // Function to get a random width class for skeletons
    const getRandomWidth = () => {
      const widths = [
        "w-28",
        "w-36",
        "w-44",
        "w-52",
        "w-60",
        "w-72",
        "w-80",
        "w-96",
        "w-full",
      ];
      return widths[Math.floor(Math.random() * widths.length)];
    };

    return (
      <div className="py-4">
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {/* Timeline tab skeleton */}
        <div className="mb-4">
          {/* Timeline items skeleton */}
          {Array.from({ length: Math.min(itemCount, 100) }).map((_, i) => (
            <div key={i} className="flex mb-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-3" />
                  <Skeleton
                    className={cn("h-4", getRandomWidth(), "max-w-md mr-4")}
                  />
                  <Skeleton className="h-3 w-16 shrink-0 ml-auto" />
                </div>
                <div className="mt-1 pl-7">
                  {Math.random() > 0.5 && (
                    <Skeleton
                      className={cn(
                        "h-3",
                        Math.random() > 0.7 ? "w-48" : "w-32"
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
