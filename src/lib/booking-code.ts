export function createBookingCode(now = new Date(), random = Math.random()) {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(random * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");

  return `PP-${datePart}-${randomPart}`;
}
