export const CARDINAL_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;

export type CardinalDirection = typeof CARDINAL_DIRECTIONS[number];
