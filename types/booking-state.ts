/**
 * Centralized Booking State Machine for TheBookMyVenues
 */

export const SlotState = {
  AVAILABLE: "AVAILABLE",
  SELECTED: "SELECTED",
  HELD: "HELD",
  BOOKED: "BOOKED",
  BLOCKED: "BLOCKED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export type SlotStateType = (typeof SlotState)[keyof typeof SlotState];

export interface SlotStateMetadata {
  state: SlotStateType;
  isSelectable: boolean;
  label: string;
  badgeVariant: "default" | "success" | "warning" | "danger" | "brand" | "glass";
  description: string;
  iconName: "CheckCircle" | "Clock" | "Lock" | "AlertCircle" | "Check" | "Ban";
}

export const SLOT_STATE_CONFIG: Record<SlotStateType, SlotStateMetadata> = {
  [SlotState.AVAILABLE]: {
    state: SlotState.AVAILABLE,
    isSelectable: true,
    label: "Available",
    badgeVariant: "default",
    description: "Open for reservation",
    iconName: "CheckCircle",
  },
  [SlotState.SELECTED]: {
    state: SlotState.SELECTED,
    isSelectable: true,
    label: "Selected",
    badgeVariant: "brand",
    description: "In your booking cart",
    iconName: "Check",
  },
  [SlotState.HELD]: {
    state: SlotState.HELD,
    isSelectable: false,
    label: "Held (10m lock)",
    badgeVariant: "warning",
    description: "Another user is completing checkout",
    iconName: "Clock",
  },
  [SlotState.BOOKED]: {
    state: SlotState.BOOKED,
    isSelectable: false,
    label: "Booked",
    badgeVariant: "danger",
    description: "Confirmed reservation",
    iconName: "Lock",
  },
  [SlotState.BLOCKED]: {
    state: SlotState.BLOCKED,
    isSelectable: false,
    label: "Blocked",
    badgeVariant: "danger",
    description: "Maintenance / Admin block",
    iconName: "Ban",
  },
  [SlotState.EXPIRED]: {
    state: SlotState.EXPIRED,
    isSelectable: true,
    label: "Available (Re-opened)",
    badgeVariant: "default",
    description: "Previous hold expired",
    iconName: "CheckCircle",
  },
  [SlotState.CANCELLED]: {
    state: SlotState.CANCELLED,
    isSelectable: true,
    label: "Available (Cancelled)",
    badgeVariant: "default",
    description: "Slot became available after cancellation",
    iconName: "CheckCircle",
  },
};

/**
 * Validates whether a state transition is legal according to business rules.
 */
export function canTransitionSlot(
  from: SlotStateType,
  to: SlotStateType
): boolean {
  const allowedTransitions: Record<SlotStateType, SlotStateType[]> = {
    [SlotState.AVAILABLE]: [SlotState.SELECTED, SlotState.HELD, SlotState.BLOCKED],
    [SlotState.SELECTED]: [SlotState.AVAILABLE, SlotState.HELD],
    [SlotState.HELD]: [SlotState.BOOKED, SlotState.EXPIRED, SlotState.AVAILABLE],
    [SlotState.BOOKED]: [SlotState.CANCELLED],
    [SlotState.EXPIRED]: [SlotState.AVAILABLE, SlotState.HELD, SlotState.SELECTED],
    [SlotState.CANCELLED]: [SlotState.AVAILABLE, SlotState.HELD, SlotState.SELECTED],
    [SlotState.BLOCKED]: [SlotState.AVAILABLE],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}
