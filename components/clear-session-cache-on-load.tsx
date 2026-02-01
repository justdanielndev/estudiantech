import { useEffect } from "react";

const SESSION_CACHE_PREFIXES = [
  "announcements-cache-v1",
  "tasks-cache-v1",
  "counters-cache-v1",
  "unread-marks-cache-v1",
  "schedule-cache-v1-"
];

export function ClearSessionCacheOnLoad() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.keys(sessionStorage).forEach((key) => {
        if (SESSION_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, []);
  return null;
}
