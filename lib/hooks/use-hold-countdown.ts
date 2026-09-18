"use client";

import { useState, useEffect } from "react";

export function useHoldCountdown(expiresAt: string | null, onExpire?: () => void) {
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingMs(0);
        setIsExpired(true);
        if (onExpire) onExpire();
      } else {
        setRemainingMs(diff);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { remainingMs, isExpired, formatted, minutes, seconds };
}
