import { useCallback, useEffect, useState } from "react";
import { testFirebaseConfiguration } from "../services/settingsService";
import { isCloudinaryConfigured } from "../services/cloudinaryService";

export default function useServerStatus() {
  const [status, setStatus] = useState({
    state: "checking",
    auth: "Firebase Authentication",
    database: "Cloud Firestore",
    media: "Cloudinary"
  });

  const test = useCallback(async () => {
    const started = performance.now();
    try {
      const health = testFirebaseConfiguration();
      setStatus({
        state: isCloudinaryConfigured ? "connected" : "partial",
        latency: Math.round(performance.now() - started),
        health,
        cloudinary: isCloudinaryConfigured ? "configured" : "missing"
      });
      return health;
    } catch (error) {
      setStatus({
        state: "disconnected",
        error: error.message,
        cloudinary: isCloudinaryConfigured ? "configured" : "missing"
      });
      throw error;
    }
  }, []);

  useEffect(() => {
    test().catch(() => {});
  }, [test]);

  return { status, test };
}
