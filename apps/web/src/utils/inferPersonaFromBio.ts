/**
 * 根据用户「一句话简介」做轻量本地推断（关键词命中 + 四维度计分），
 * 不调用外网 API，便于演示与离线使用。
 */

export type PersonaInference = {
  /** 推断的 MBTI 四字母 */
  mbti: string
  /** 对应小镇 Agent 名 */
  agentName: string
  agentDesc: string
  /** 短标签，用于展示 */
  traits: string[]
  /** 邮差猫 DM 短句（输入过程中） */
  catHint: string
  /** 揭晓页稍长的一句总结 */
  summary: string
}

const AGENTS: Record<string, { name: string; desc: string }> = {
  INFP: { name: 'Mira', desc: '温柔的理想主义者，用诗歌和共情连接世界' },
  ENTP: { name: 'Kai', desc: '思维碰撞者，永远在寻找下一个有趣的辩题' },
  ISFP: { name: 'Luca', desc: '安静的美学家，用镜头和画笔捕捉当下' },
  ENFJ: { name: 'Yuki', desc: '温暖的引领者，善于理解和激励身边的人' },
}

/** 其余 MBTI 映射到四只代表 Agent（产品侧可后续细化） */
const MBTI_TO_KEY: Record<string, keyof typeof AGENTS> = {
  INFP: 'INFP',
  INFJ: 'INFP',
  ENFP: 'INFP',
  INTJ: 'ENTP',
  INTP: 'ENTP',
  ENTP: 'ENTP',
  ENTJ: 'ENTP',
  ESTP: 'ENTP',
  ESTJ: 'ENTP',
  ISFP: 'ISFP',
  ISTP: 'ISFP',
  ISTJ: 'ISFP',
  ISFJ: 'ENFJ',
  ESFP: 'ENFJ',
  ESFJ: 'ENFJ',
  ENFJ: 'ENFJ',
}

const E: string[] = ['聚会', '朋友', '社交', '热闹', '外向', '一起', '团队', '聊天', '认识新人', '派对', '组局', '嗨']
const I: string[] = ['独处', '安静', '一个人', '宅', '内向', '看书', '思考', '慢热', '不爱热闹', '独自']
const S: string[] = ['具体', '细节', '实际', '当下', '事实', '务实', '眼前', '靠谱', '落地']
const N: string[] = ['想法', '未来', '脑洞', '抽象', '想象', '可能', '灵感', '创意', '如果', '假设']
const T: string[] = ['逻辑', '分析', '理性', '利弊', '客观', '数据', '道理', '效率', '判断']
const F: string[] = ['感受', '共情', '直觉', '情绪', '关心', '舒服', '委屈', '温暖', '在意']
const J: string[] = ['计划', '攻略', '安排', '提前', '准时', '清单', '按部就班', '目标']
const P: string[] = ['随性', '灵活', '临时', '到了再说', '拖延', '随机', '即兴', '看心情']

function countHits(text: string, words: string[]): number {
  let n = 0
  for (const w of words) {
    if (text.includes(w)) n++
  }
  return n
}

function pickLetter(
  text: string,
  aWords: string[],
  bWords: string[],
  aChar: string,
  bChar: string,
): string {
  const a = countHits(text, aWords)
  const b = countHits(text, bWords)
  if (a === 0 && b === 0) return aChar
  return a >= b ? aChar : bChar
}

function inferMbti(text: string): string {
  const hits =
    countHits(text, E) +
    countHits(text, I) +
    countHits(text, S) +
    countHits(text, N) +
    countHits(text, T) +
    countHits(text, F) +
    countHits(text, J) +
    countHits(text, P)
  if (hits === 0) return 'INFP'

  const e_i = pickLetter(text, E, I, 'E', 'I')
  const s_n = pickLetter(text, S, N, 'S', 'N')
  const t_f = pickLetter(text, T, F, 'T', 'F')
  const j_p = pickLetter(text, J, P, 'J', 'P')
  return `${e_i}${s_n}${t_f}${j_p}`
}

const TRAIT_POOL: { keys: string[]; label: string }[] = [
  { keys: ['外向', '社交', '热闹', '聚会', '一起'], label: '外向热情' },
  { keys: ['安静', '独处', '内向', '一个人', '宅'], label: '安静内敛' },
  { keys: ['计划', '攻略', '提前', '清单', '安排'], label: '爱做计划' },
  { keys: ['随性', '灵活', '临时', '即兴'], label: '随性自由' },
  { keys: ['逻辑', '理性', '分析', '客观'], label: '偏理性' },
  { keys: ['感受', '共情', '情绪', '温暖'], label: '偏感性' },
  { keys: ['创意', '脑洞', '想象', '灵感'], label: '爱开脑洞' },
  { keys: ['务实', '当下', '细节', '靠谱'], label: '务实具体' },
]

function collectTraits(text: string): string[] {
  const out: string[] = []
  for (const { keys, label } of TRAIT_POOL) {
    if (keys.some((k) => text.includes(k))) out.push(label)
  }
  return [...new Set(out)].slice(0, 4)
}

function buildSummary(mbti: string, traits: string[], agentName: string): string {
  const traitStr = traits.length ? traits.join('、') : '温和中立'
  return `从这句话里，我读到你有点像「${traitStr}」的气质；为你匹配的分身是 ${agentName}（${mbti}）。`
}

function buildCatHint(text: string, trimmed: string, mbti: string, traits: string[]): string {
  if (!trimmed) {
    return '喵～我是小镇邮差猫，写一句话让我认识你吧。'
  }
  if (trimmed.length < 6) {
    return '再多写一点点，我会读得更准喵～'
  }
  const bits: string[] = []
  if (mbti.startsWith('E')) bits.push('外向活力')
  else bits.push('内敛沉稳')
  if (mbti.includes('N')) bits.push('爱想远的')
  else bits.push('脚踏实地')
  const t = traits[0]
  if (t) {
    return `嗯…有「${t}」的味道，${bits.join('、')} —— 继续写也没问题喵。`
  }
  return `嗯…${bits.join('、')}，我已经在脑内给你画小像了喵～`
}

export function inferPersonaFromBio(raw: string): PersonaInference {
  const text = raw.trim()
  if (!text) {
    return {
      mbti: 'INFP',
      agentName: AGENTS.INFP.name,
      agentDesc: AGENTS.INFP.desc,
      traits: [],
      catHint: '喵～我是小镇邮差猫，写一句话让我认识你吧。',
      summary: '还没读到你的句子，先为你准备了温柔向的默认分身 Mira。',
    }
  }

  const mbti = inferMbti(text)
  const key = MBTI_TO_KEY[mbti] ?? 'INFP'
  const { name, desc } = AGENTS[key]
  const traits = collectTraits(text)
  const summary = buildSummary(mbti, traits, name)
  const catHint = buildCatHint(text, text, mbti, traits)

  return {
    mbti,
    agentName: name,
    agentDesc: desc,
    traits,
    catHint,
    summary,
  }
}
