export function shouldShowBathrooms(bedrooms: number | null | undefined, propertyType: string | undefined): boolean {
  if (propertyType === 'bedsitter') return false
  if (bedrooms == null) return true
  return bedrooms >= 2
}
