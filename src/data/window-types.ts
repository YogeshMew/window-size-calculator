/**
 * WindowMetrics — Window Type Reference Data
 *
 * Skeleton entries for all 11 window types.
 * Dimensional ranges are approximate — will be refined with actual data.
 */

import type { WindowTypeData } from '@/types/dataset.js';

export const WINDOW_TYPES: WindowTypeData[] = [
  {
    type: 'single-hung',
    label: 'Single Hung',
    description: 'The lower sash slides up while the upper sash remains fixed. The most common and affordable window type.',
    widthMmRange: [406, 1219],
    heightMmRange: [610, 1829],
    advantages: ['Lower cost', 'Easy to operate', 'Widely available'],
    disadvantages: ['Only bottom half opens', 'Harder to clean exterior'],
    recommendedRooms: ['bedroom', 'bathroom', 'living-room'],
  },
  {
    type: 'double-hung',
    label: 'Double Hung',
    description: 'Both sashes slide up and down independently, providing better ventilation and easier cleaning.',
    widthMmRange: [406, 1219],
    heightMmRange: [610, 1829],
    advantages: ['Both sashes open', 'Easy to clean', 'Good ventilation'],
    disadvantages: ['Higher cost than single hung', 'More moving parts'],
    recommendedRooms: ['bedroom', 'kitchen', 'living-room'],
  },
  {
    type: 'sliding',
    label: 'Sliding',
    description: 'One or both sashes slide horizontally. Great for wide openings where vertical clearance is limited.',
    widthMmRange: [610, 2438],
    heightMmRange: [406, 1219],
    advantages: ['Easy to operate', 'Good for wide openings', 'Simple mechanism'],
    disadvantages: ['Tracks can get dirty', 'Only half opens at once'],
    recommendedRooms: ['living-room', 'bedroom', 'kitchen'],
  },
  {
    type: 'casement',
    label: 'Casement',
    description: 'Hinged on one side and cranked open outward. Provides excellent ventilation and a tight seal when closed.',
    widthMmRange: [305, 914],
    heightMmRange: [610, 1829],
    advantages: ['Maximum ventilation', 'Excellent seal', 'Easy to operate'],
    disadvantages: ['Cannot use with window AC', 'Swing clearance needed outside'],
    recommendedRooms: ['kitchen', 'bathroom', 'office'],
  },
  {
    type: 'awning',
    label: 'Awning',
    description: 'Hinged at the top and opens outward from the bottom. Allows ventilation even in light rain.',
    widthMmRange: [406, 1524],
    heightMmRange: [305, 914],
    advantages: ['Opens in light rain', 'Good ventilation', 'Privacy option'],
    disadvantages: ['Limited opening size', 'Cannot use with window AC'],
    recommendedRooms: ['bathroom', 'kitchen', 'basement'],
  },
  {
    type: 'picture',
    label: 'Picture',
    description: 'Fixed window that does not open. Maximizes light and views.',
    widthMmRange: [305, 3048],
    heightMmRange: [305, 2438],
    advantages: ['Maximum light', 'Large sizes available', 'Best views', 'Low cost'],
    disadvantages: ['Does not open', 'No ventilation'],
    recommendedRooms: ['living-room', 'office'],
  },
  {
    type: 'bay',
    label: 'Bay',
    description: 'Projects outward from the wall at 30° or 45° angles, typically with a center picture window.',
    widthMmRange: [914, 3658],
    heightMmRange: [610, 1829],
    advantages: ['Adds space', 'Architectural character', 'Good views'],
    disadvantages: ['Expensive', 'Complex installation', 'Heat loss'],
    recommendedRooms: ['living-room'],
  },
  {
    type: 'bow',
    label: 'Bow',
    description: 'Curved projection made of 4 or more window units, creating a gentle arc.',
    widthMmRange: [1219, 4267],
    heightMmRange: [610, 1829],
    advantages: ['Elegant appearance', 'More interior space', 'Good light'],
    disadvantages: ['Very expensive', 'Complex installation'],
    recommendedRooms: ['living-room'],
  },
  {
    type: 'garden',
    label: 'Garden',
    description: 'Box-shaped window that projects outward, often used for plants and herbs.',
    widthMmRange: [610, 1219],
    heightMmRange: [457, 762],
    advantages: ['Interior shelf space', 'Good light for plants', 'Decorative'],
    disadvantages: ['Smaller size', 'Can condense moisture'],
    recommendedRooms: ['kitchen'],
  },
  {
    type: 'fixed',
    label: 'Fixed',
    description: 'Non-operable window, permanently sealed. Used for light and aesthetics.',
    widthMmRange: [152, 3048],
    heightMmRange: [152, 3048],
    advantages: ['Any shape or size', 'Maximum light', 'Low cost'],
    disadvantages: ['Does not open', 'No ventilation'],
    recommendedRooms: ['living-room', 'office', 'bathroom'],
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Non-standard dimensions or shapes not covered by standard types.',
    widthMmRange: [152, 9144],
    heightMmRange: [152, 9144],
    advantages: ['Any size', 'Any shape'],
    disadvantages: ['Higher cost', 'Longer lead time'],
    recommendedRooms: ['living-room', 'office', 'other'],
  },
];

/** Get a window type by its type key */
export function getWindowType(type: string): WindowTypeData | undefined {
  return WINDOW_TYPES.find((w) => w.type === type);
}
