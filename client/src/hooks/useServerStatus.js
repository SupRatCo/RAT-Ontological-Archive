import { useCallback, useEffect, useState } from "react";
import { settingsApi } from "../api/settings.api";
import { apiPath } from "../api/apiClient";

export default function useServerStatus() {
  const [status, setStatus] = useState({ state: "checking", healthUrl: apiPath("/health") });

  const test = useCallback(async () => {
    const started = performance.now();
    try {
      const health = await settingsApi.health();
      setStatus({ state: "connected", latency: Math.round(performance.now() - started), healthUrl: apiPath("/health"), health });
      return health;
    } catch (error) {
      setStatus({ state: "disconnected", error: error.message, healthUrl: apiPath("/health") });
      throw error;
    }
  }, []);

  useEffect(() => {
    test().catch(() => {});
  }, [test]);

  return { status, test };
}
