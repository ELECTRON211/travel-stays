export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'hotel_room', label: 'Hotel room' },
  { value: 'house', label: 'Entire house' },
]

export function propertyLabel(value) {
  return PROPERTY_TYPES.find((type) => type.value === value)?.label ?? 'Stay'
}
