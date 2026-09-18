/**
 * Generates and triggers a standard .ics calendar file download
 */
export function exportBookingToIcs(booking: {
  bookingNumber: string;
  venueName: string;
  resourceName: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const [year, month, day] = booking.date.split("-").map(Number);
  const [startH, startM] = booking.startTime.split(":").map(Number);
  const [endH, endM] = booking.endTime.split(":").map(Number);

  // Convert Asia/Kolkata (+05:30) to UTC format YYYYMMDDTHHMMSSZ
  const startUtc = new Date(Date.UTC(year, month - 1, day, startH - 5, startM - 30));
  const endUtc = new Date(Date.UTC(year, month - 1, day, endH - 5, endM - 30));

  const formatDateToIcs = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TheBookMyVenues//Booking Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.bookingNumber}@thebookmyvenues.in`,
    `DTSTAMP:${formatDateToIcs(new Date())}`,
    `DTSTART:${formatDateToIcs(startUtc)}`,
    `DTEND:${formatDateToIcs(endUtc)}`,
    `SUMMARY:Slot Reservation: ${booking.venueName} (${booking.resourceName})`,
    `DESCRIPTION:Your booking reference is ${booking.bookingNumber}. Please arrive 10 minutes before your slot.`,
    `LOCATION:${booking.address}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `booking-${booking.bookingNumber}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
