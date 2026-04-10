import type { AnimState, Direction } from '../components/SpriteCharacter'

export type HumanSpriteType = 'male' | 'female'

type HumanSpriteSet = {
  idle: Record<Direction, string>
  walk: Record<Direction, string[]>
  special: string[]
  portrait: string
}

const COMMON_SPECIAL = [
  '/sprites/human/special_actions/drinking_coffee.png',
  '/sprites/human/special_actions/happy_emotion.png',
  '/sprites/human/special_actions/idle_bounce_a_f1.png',
  '/sprites/human/special_actions/idle_bounce_a_f2.png',
  '/sprites/human/special_actions/idle_bounce_b_f1.png',
  '/sprites/human/special_actions/idle_bounce_b_f2.png',
  '/sprites/human/special_actions/reading_book.png',
  '/sprites/human/special_actions/sitting_on_bench.png',
  '/sprites/human/special_actions/surprised_emotion.png',
  '/sprites/human/special_actions/talking.png',
  '/sprites/human/special_actions/waving_hand_f1.png',
  '/sprites/human/special_actions/waving_hand_f2.png',
]

export const HUMAN_SPRITES: Record<HumanSpriteType, HumanSpriteSet> = {
  male: {
    idle: {
      down: '/sprites/human/male/idle_stand_front.png',
      up: '/sprites/human/male/idle_stand_back.png',
      left: '/sprites/human/male/walk_left_f2.png',
      right: '/sprites/human/male/walk_right_f2.png',
    },
    walk: {
      down: ['/sprites/human/male/walk_down_f1.png', '/sprites/human/male/walk_down_f2.png'],
      up: ['/sprites/human/male/walk_up_f1.png', '/sprites/human/male/walk_up_f2.png'],
      left: [
        '/sprites/human/male/walk_left_f1.png',
        '/sprites/human/male/walk_left_f2.png',
      ],
      right: [
        '/sprites/human/male/walk_right_f1.png',
        '/sprites/human/male/walk_right_f2.png',
      ],
    },
    special: COMMON_SPECIAL,
    portrait: '/sprites/human/variants/male_with_hat.png',
  },
  female: {
    idle: {
      down: '/sprites/human/female/idle_stand_front.png',
      up: '/sprites/human/female/idle_stand_back.png',
      left: '/sprites/human/female/walk_left_f2.png',
      right: '/sprites/human/female/walk_right_f2.png',
    },
    walk: {
      down: ['/sprites/human/female/walk_down_f1.png', '/sprites/human/female/walk_down_f2.png'],
      up: ['/sprites/human/female/walk_up_f1.png', '/sprites/human/female/walk_up_f2.png'],
      left: [
        '/sprites/human/female/walk_left_f1.png',
        '/sprites/human/female/walk_left_f2.png',
      ],
      right: [
        '/sprites/human/female/walk_right_f1.png',
        '/sprites/human/female/walk_right_f2.png',
      ],
    },
    special: COMMON_SPECIAL,
    portrait: '/sprites/human/variants/female_with_hat.png',
  },
}

export function getHumanFrame(
  type: HumanSpriteType,
  direction: Direction,
  animState: AnimState,
  frameIndex: number,
  idleOverride?: string | null,
): string {
  const set = HUMAN_SPRITES[type]
  if (animState === 'walk') {
    const frames = set.walk[direction]
    return frames[frameIndex % frames.length]
  }
  return idleOverride ?? set.idle[direction]
}

export function getHumanPortrait(type: HumanSpriteType): string {
  return HUMAN_SPRITES[type].portrait
}
