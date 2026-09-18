# Real-Time SSE Architecture & Inventory Synchronization

## Endpoint
`GET /api/events/availability?venueId={venueId}&date={date}`

## Connection Lifecycle

1. **Scoped Subscription:** Connected clients only subscribe to the `venueId` and `date` they are currently viewing, preventing unnecessary server overhead.
2. **Handshake:** Server responds with `text/event-stream` and an initial connection confirmation payload.
3. **Keep-Alive Heartbeats:** Emits `: heartbeat {timestamp}` every 15 seconds to prevent NAT/firewall proxy timeouts.
4. **Broadcast Events:** When state changes occur (`slot.held`, `slot.released`, `slot.booked`, `slot.blocked`), the event is dispatched to all matching streams.
5. **Teardown:** On client tab close or navigation, the `AbortSignal` listener tears down the listener and cleans up resources.

```json
{
  "id": "evt_1726643200_a8f9",
  "type": "slot.booked",
  "venueId": "venue-1",
  "resourceId": "res-turf-1",
  "date": "2026-09-18",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "BOOKED",
  "timestamp": "2026-09-18T07:10:00.000Z"
}
```
