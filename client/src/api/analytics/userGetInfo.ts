import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "../utils";

export type LinkedDevice = {
  anonymous_id: string;
  created_at: string;
};

export type UserInfo = {
  duration: number;
  sessions: number;
  anonymous_id: string;
  is_identified: boolean;
  country: string;
  region: string;
  city: string;
  language: string;
  device_type: string;
  browser: string;
  browser_version: string;
  operating_system: string;
  operating_system_version: string;
  screen_height: number;
  screen_width: number;
  last_seen: string;
  first_seen: string;
  pageviews: number;
  events: number;
  ip?: string;
  traits: Record<string, unknown> | null;
  linked_devices: LinkedDevice[];
};

export function useUserInfo(siteId: number, userId: string) {
  return useQuery<UserInfo>({
    queryKey: ["user-info", userId, siteId],
    queryFn: async () => {
      const response = await authedFetch<{ data: UserInfo }>(`/user/info/${userId}/${siteId}`);
      return response.data;
    },
  });
}
