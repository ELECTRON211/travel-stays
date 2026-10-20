export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'hotel_room', label: 'Hotel room' },
  { value: 'house', label: 'Entire house' },
]

export const DESTINATIONS = [
  { city: 'Lagos', note: 'Beaches, nightlife and business' },
  { city: 'Abuja', note: 'The calm, green capital' },
  { city: 'Calabar', note: 'Carnival city by the rainforest' },
  { city: 'Port Harcourt', note: 'The Garden City' },
  { city: 'Ibadan', note: 'History across seven hills' },
  { city: 'Enugu', note: 'Cool hills of the Coal City' },
]

export function propertyLabel(value) {
  return PROPERTY_TYPES.find((type) => type.value === value)?.label ?? 'Stay'
}
