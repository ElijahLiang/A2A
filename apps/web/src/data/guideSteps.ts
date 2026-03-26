/** 新手引导文案（ui-interaction-spec §3） */
export type GuideStep = {
  id: string
  body: string
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    body:
      '欢迎来到 A2A 小镇！我是小邮 🐱，你的信使向导。这里每栋建筑都代表一种活动，派出你的小人去找志同道合的伙伴。',
  },
  {
    id: 'buildings',
    body: '点击任意建筑，小人会走过去，镜头会跟随。到达后你可以发布活动、收信或逛广场。',
  },
  {
    id: 'publish',
    body: '在发布意图里写好描述后，长按「盖章派出」寄出信封。不同人数消耗不同代币。',
  },
  {
    id: 'mailbox',
    body: '右下角是邮箱：有新信时会提示。空邮箱时盖子「开口」，有信时合上并微动。',
  },
  {
    id: 'letter',
    body: '在信里向上撕开信封。回信与私聊由 Agent 协助；第 3 轮要确认或婉拒约定。',
  },
  {
    id: 'friends',
    body: '邮箱旁是好友入口。会面成功可加好友，之后串门更方便。',
  },
  {
    id: 'cats',
    body: '广场上的猫咪代表不同活动氛围，点一点看看当季消息。',
  },
  {
    id: 'wish',
    body: '城镇广场里有许愿池：投入心愿或捞一条别人的心愿，缘分就这么来 ✨',
  },
]
