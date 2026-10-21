import {
  AirVent,
  Baby,
  Ban,
  BatteryCharging,
  Car,
  Coffee,
  CookingPot,
  Laptop,
  Moon,
  PartyPopper,
  PawPrint,
  ShieldCheck,
  ShowerHead,
  Tv,
  WashingMachine,
  Waves,
  Wifi,
} from 'lucide-react'

export const AMENITIES = [
  { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { value: 'power', label: '24/7 power / generator', icon: BatteryCharging },
  { value: 'ac', label: 'Air conditioning', icon: AirVent },
  { value: 'security', label: 'Security / gated', icon: ShieldCheck },
  { value: 'parking', label: 'Free parking', icon: Car },
  { value: 'kitchen', label: 'Kitchen', icon: CookingPot },
  { value: 'hot_water', label: 'Hot water', icon: ShowerHead },
  { value: 'tv', label: 'TV', icon: Tv },
  { value: 'workspace', label: 'Workspace', icon: Laptop },
  { value: 'washer', label: 'Washing machine', icon: WashingMachine },
  { value: 'pool', label: 'Pool', icon: Waves },
  { value: 'breakfast', label: 'Breakfast', icon: Coffee },
]

export const HOUSE_RULES = [
  { value: 'no_smoking', label: 'No smoking', icon: Ban },
  { value: 'no_parties', label: 'No parties or events', icon: PartyPopper },
  { value: 'no_pets', label: 'No pets', icon: PawPrint },
  { value: 'quiet_hours', label: 'Quiet hours 10pm – 7am', icon: Moon },
  { value: 'children_ok', label: 'Suitable for children', icon: Baby },
]

// Fixed templates (not free text) so guests and hosts can't disagree about
// what was promised — see PRD section 5.3.
export const CANCELLATION_POLICIES = [
  {
    value: 'flexible',
    label: 'Flexible',
    short: 'Free cancellation until 24 hours before check-in',
    text: 'Full refund if cancelled at least 24 hours before check-in. After that, the first night is non-refundable.',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    short: 'Free cancellation until 5 days before check-in',
    text: 'Full refund if cancelled at least 5 days before check-in. After that, 50% of the nightly cost is refunded.',
  },
  {
    value: 'strict',
    label: 'Strict',
    short: '50% refund until 7 days before check-in',
    text: '50% refund if cancelled at least 7 days before check-in. No refund after that.',
  },
]

export function cancellationPolicy(value) {
  return CANCELLATION_POLICIES.find((p) => p.value === value) ?? CANCELLATION_POLICIES[1]
}

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
