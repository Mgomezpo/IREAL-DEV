export const toZonedDate = (date: Date, timeZone: string) => {
  // Fallback conversion without extra deps; uses Intl to shift into the desired TZ.
  return new Date(date.toLocaleString("en-US", { timeZone }))
}
