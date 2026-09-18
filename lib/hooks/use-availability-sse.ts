"use client";

import { useEffect, useState } from "react";
import { SSEEventEnvelope } from "@/lib/services/event-bus";

interface UseAvailabilitySSEProps {
  venueId: string;
  date: string;
  onEvent?: (event: SSEEventEnvelope) => void;
}

export function useAvailabilitySSE({ venueId, date, onEvent }: UseAvailabilitySSEProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEventEnvelope | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !venueId || !date) return;

    const eventSource = new EventSource(
      `/api/events/availability?venueId=${encodeURIComponent(venueId)}&date=${encodeURIComponent(date)}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    const handleSSE = (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type && parsed.type !== "connected") {
          setLastEvent(parsed);
          if (onEvent) onEvent(parsed);
        }
      } catch {}
    };

    eventSource.addEventListener("slot.held", handleSSE);
    eventSource.addEventListener("slot.released", handleSSE);
    eventSource.addEventListener("slot.booked", handleSSE);
    eventSource.addEventListener("slot.blocked", handleSSE);
    eventSource.onmessage = handleSSE;

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [venueId, date, onEvent]);

  return { isConnected, lastEvent };
}
