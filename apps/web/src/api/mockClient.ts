import type { MenuItem } from '@cafe/shared';

export const mockMenu: MenuItem[] = [
  {
    id: 'hilltop-flat-white',
    name: 'Hilltop Flat White',
    description: 'Double espresso, silky steamed milk.',
    priceCents: 480,
    category: 'coffee',
    tags: ['house favorite'],
    available: true,
  },
  {
    id: 'maple-oat-latte',
    name: 'Maple Oat Latte',
    description: 'Our espresso with oat milk and a touch of maple.',
    priceCents: 560,
    category: 'coffee',
    tags: ['plant based'],
    available: true,
  },
  {
    id: 'garden-mint-tea',
    name: 'Garden Mint Tea',
    description: 'A bright, calming cup from our favorite local blender.',
    priceCents: 390,
    category: 'tea',
    tags: ['caffeine free'],
    available: true,
  },
  {
    id: 'brown-butter-cookie',
    name: 'Brown Butter Cookie',
    description: 'A little crisp at the edge, soft in the middle.',
    priceCents: 350,
    category: 'bakery',
    tags: ['baked daily'],
    available: true,
  },
];
