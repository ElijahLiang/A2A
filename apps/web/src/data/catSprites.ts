import type { SquareCat } from '../types'
import type { MotionDirection } from '../lib/world'

export type CatFacing = 'front' | 'back' | 'left' | 'right'

type CatFrames = {
  idleByFacing: Record<CatFacing, string>
  walk: string[]
  rest: string[]
  special?: string[]
}

export const CAT_SPRITES: Record<SquareCat['type'], CatFrames> = {
  orange: {
    idleByFacing: {
      front: '/sprites/cats/orange/idle_front.png',
      back: '/sprites/cats/orange/idle_back.png',
      left: '/sprites/cats/orange/idle_left.png',
      right: '/sprites/cats/orange/idle_right.png',
    },
    walk: ['/sprites/cats/orange/walk_1.png', '/sprites/cats/orange/walk_2.png'],
    rest: ['/sprites/cats/orange/sitting.png', '/sprites/cats/orange/lying_down.png'],
  },
  black: {
    idleByFacing: {
      front: '/sprites/cats/tuxedo/idle_front.png',
      back: '/sprites/cats/tuxedo/idle_back.png',
      left: '/sprites/cats/tuxedo/idle_left.png',
      right: '/sprites/cats/tuxedo/idle_right.png',
    },
    walk: ['/sprites/cats/tuxedo/walk_1.png', '/sprites/cats/tuxedo/walk_2.png'],
    rest: ['/sprites/cats/tuxedo/sitting.png', '/sprites/cats/tuxedo/lying_down.png'],
  },
  white: {
    idleByFacing: {
      front: '/sprites/cats/gray/idle_front.png',
      back: '/sprites/cats/gray/idle_back.png',
      left: '/sprites/cats/gray/idle_left.png',
      right: '/sprites/cats/gray/idle_right.png',
    },
    walk: ['/sprites/cats/gray/walk_1.png', '/sprites/cats/gray/walk_2.png'],
    rest: ['/sprites/cats/gray/sitting.png', '/sprites/cats/gray/lying_down.png'],
  },
  calico: {
    idleByFacing: {
      front: '/sprites/cats/gray/idle_front.png',
      back: '/sprites/cats/gray/idle_back.png',
      left: '/sprites/cats/gray/idle_left.png',
      right: '/sprites/cats/gray/idle_right.png',
    },
    walk: ['/sprites/cats/gray/walk_1.png', '/sprites/cats/gray/walk_2.png'],
    rest: ['/sprites/cats/gray/sitting.png', '/sprites/cats/gray/lying_down.png'],
  },
  hidden: {
    idleByFacing: {
      front: '/sprites/cats/gray_actions/tail_swish_1.png',
      back: '/sprites/cats/gray_actions/tail_swish_2.png',
      left: '/sprites/cats/gray_actions/meowing.png',
      right: '/sprites/cats/gray_actions/stretching.png',
    },
    walk: ['/sprites/cats/gray_actions/tail_swish_1.png', '/sprites/cats/gray_actions/tail_swish_2.png'],
    rest: ['/sprites/cats/gray_actions/sleeping.png', '/sprites/cats/gray_actions/grooming.png'],
    special: [
      '/sprites/cats/gray_actions/jumping.png',
      '/sprites/cats/gray_actions/meowing.png',
      '/sprites/cats/gray_actions/playing_with_toy.png',
      '/sprites/cats/gray_actions/stretching.png',
    ],
  },
}

export function directionToFacing(direction: MotionDirection): CatFacing {
  if (direction === 'up') return 'back'
  if (direction === 'down') return 'front'
  return direction
}

export function getCatFrame(
  type: SquareCat['type'],
  direction: MotionDirection,
  animState: 'idle' | 'walk',
  frameIndex: number,
  idleOverride?: string | null,
): string {
  const set = CAT_SPRITES[type] ?? CAT_SPRITES.orange
  if (animState === 'walk') {
    return set.walk[frameIndex % set.walk.length]
  }
  if (idleOverride) return idleOverride
  return set.idleByFacing[directionToFacing(direction)]
}
