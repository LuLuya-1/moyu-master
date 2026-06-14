export const CONFIG = {
  totalRounds: 12,
  minPlayers: 2,
  maxPlayers: 4,
  startingEnergy: 2,
  energyPerRound: 1,
  energyCap: 5,
  performanceTarget: 12,
  cardsPerLane: 2,
};

const WORK_CARDS = [
  { id: "w1", type: "work", title: "晨会发言", cost: 1, performance: 2, points: 1, suspicion: -1, text: "+2 业绩，+1 分，风险值 -1", flavor: "说得越像做过，掌声越响。" },
  { id: "w2", type: "work", title: "紧急修复", cost: 2, performance: 3, points: 1, suspicion: -1, text: "+3 业绩，+1 分，风险值 -1", flavor: "问题解决了，至于谁引入的并不重要。" },
  { id: "w3", type: "work", title: "周报文学", cost: 1, performance: 2, points: 1, text: "+2 业绩，+1 分", flavor: "把三行进度扩写成三页。" },
  { id: "w4", type: "work", title: "跨部门救火", cost: 2, performance: 3, suspicion: -2, text: "+3 业绩，风险值 -2", flavor: "火不是你点的，但功劳可以是。" },
  { id: "w5", type: "work", title: "向上管理", cost: 1, performance: 1, points: 3, suspicion: -1, text: "+1 业绩，+3 分，风险值 -1", flavor: "同步得及时，结果就显得及时。" },
  { id: "w6", type: "work", title: "流程优化", cost: 2, performance: 3, points: 1, energy: 1, text: "+3 业绩，+1 分，返还 1 精力", flavor: "开会讨论如何少开会。" },
  { id: "w7", type: "work", title: "客户好评", cost: 1, performance: 3, text: "+3 业绩", flavor: "截图已经放进汇报第一页。" },
  { id: "w8", type: "work", title: "季度冲刺", cost: 2, performance: 3, points: -1, text: "+3 业绩，-1 分", flavor: "今天透支的是明天的你。" },
  { id: "w9", type: "work", title: "会议纪要", cost: 1, performance: 2, suspicion: -1, text: "+2 业绩，风险值 -1", flavor: "记下所有结论，包括没有结论。" },
  { id: "w10", type: "work", title: "需求澄清", cost: 1, performance: 2, energy: 1, text: "+2 业绩，返还 1 精力", flavor: "把一句话的问题拆成十二个问题。" },
  { id: "w11", type: "work", title: "项目交付", cost: 2, performance: 3, points: 2, text: "+3 业绩，+2 分", flavor: "压线交付也是一种准时。" },
  { id: "w12", type: "work", title: "替同事顶班", cost: 2, performance: 3, suspicion: -2, text: "+3 业绩，风险值 -2", flavor: "人情记在账上，班记在你头上。" },
];

const FISH_CARDS = [
  { id: "f1", type: "fish", title: "带薪咖啡", cost: 1, points: 4, suspicion: 1, text: "+4 分，风险值 +1，然后接受投票审判", flavor: "豆子有产地，工位没有归属。" },
  { id: "f2", type: "fish", title: "厕所远征", cost: 1, points: 5, suspicion: 2, text: "+5 分，风险值 +2，然后接受投票审判", flavor: "一去二十分钟，归来仍是少年。" },
  { id: "f3", type: "fish", title: "工位追剧", cost: 1, points: 5, suspicion: 2, text: "+5 分，风险值 +2，然后接受投票审判", flavor: "窗口很小，剧情很大。" },
  { id: "f4", type: "fish", title: "午休加钟", cost: 2, points: 8, suspicion: 3, text: "+8 分，风险值 +3，然后接受投票审判", flavor: "闭眼是休息，睁眼是下班。" },
  { id: "f5", type: "fish", title: "茶水间社交", cost: 1, points: 4, suspicion: 1, performance: 1, text: "+4 分，+1 业绩，风险值 +1，然后投票", flavor: "情报也是生产资料。" },
  { id: "f6", type: "fish", title: "假装调研", cost: 2, points: 7, suspicion: 2, text: "+7 分，风险值 +2，然后接受投票审判", flavor: "浏览记录充满行业洞察。" },
  { id: "f7", type: "fish", title: "远程隐身", cost: 1, points: 5, suspicion: 2, text: "+5 分，风险值 +2，然后接受投票审判", flavor: "在线状态只是一种态度。" },
  { id: "f8", type: "fish", title: "团建逃脱", cost: 2, points: 9, suspicion: 3, text: "+9 分，风险值 +3，然后接受投票审判", flavor: "最大的团队贡献是不占座位。" },
  { id: "f9", type: "fish", title: "带薪逛论坛", cost: 1, points: 4, suspicion: 1, energy: 1, text: "+4 分，返还 1 精力，风险值 +1，然后投票", flavor: "热帖里藏着行业未来，也藏着午饭推荐。" },
  { id: "f10", type: "fish", title: "假装开会", cost: 1, points: 6, suspicion: 3, text: "+6 分，风险值 +3，然后投票", flavor: "会议室门一关，谁知道里面有没有人。" },
  { id: "f11", type: "fish", title: "下午茶团购", cost: 2, points: 7, suspicion: 1, text: "+7 分，风险值 +1，然后投票", flavor: "凑单是团队协作的最高形式。" },
  { id: "f12", type: "fish", title: "请假看演唱会", cost: 2, points: 10, suspicion: 4, text: "+10 分，风险值 +4，然后投票", flavor: "工作会再来，返场不一定。" },
];

const GROWTH_CARDS = [
  { id: "gs1", type: "growth", growthType: "skill", growthLabel: "技能", title: "数据分析", cost: 1, performance: 1, text: "技能；+1 业绩", flavor: "图表一转，结论自然出现。" },
  { id: "gs2", type: "growth", growthType: "skill", growthLabel: "技能", title: "公开表达", cost: 2, performance: 1, points: 1, text: "技能；+1 业绩，+1 分", flavor: "声音坚定，方案就先赢了一半。" },
  { id: "gs3", type: "growth", growthType: "skill", growthLabel: "技能", title: "AI 助手", cost: 2, performance: 1, energy: 1, text: "技能；+1 业绩，返还 1 精力", flavor: "它负责输出，你负责确认语气。" },
  { id: "gn1", type: "growth", growthType: "network", growthLabel: "人脉", title: "部门盟友", cost: 2, suspicion: -1, points: 1, text: "人脉；风险值 -1，+1 分", flavor: "有人点赞，就像有人批准。" },
  { id: "gn2", type: "growth", growthType: "network", growthLabel: "人脉", title: "校友群", cost: 1, energy: 1, text: "人脉；返还 1 精力", flavor: "平时潜水，换工作时浮上来。" },
  { id: "gn3", type: "growth", growthType: "network", growthLabel: "人脉", title: "供应商朋友", cost: 2, performance: 1, suspicion: -1, text: "人脉；+1 业绩，风险值 -1", flavor: "关系到位，附件随后补。" },
  { id: "gh1", type: "growth", growthType: "health", growthLabel: "健康", title: "工位拉伸", cost: 1, points: 1, text: "健康；+1 分", flavor: "动作不标准，态度很养生。" },
  { id: "gh2", type: "growth", growthType: "health", growthLabel: "健康", title: "规律午餐", cost: 2, energy: 1, text: "健康；返还 1 精力", flavor: "先保证胃，再保证交付。" },
  { id: "gh3", type: "growth", growthType: "health", growthLabel: "健康", title: "拒绝熬夜", cost: 2, points: 1, text: "健康；+1 分", flavor: "今天没做完的事，明天仍然没做完。" },
  { id: "gv1", type: "growth", growthType: "vision", growthLabel: "视野", title: "行业阅读", cost: 1, performance: 1, text: "视野；+1 业绩", flavor: "标题看完，趋势掌握。" },
  { id: "gv2", type: "growth", growthType: "vision", growthLabel: "视野", title: "竞品体验", cost: 1, points: 1, text: "视野；+1 分", flavor: "研究别人怎么让人加班。" },
  { id: "gv3", type: "growth", growthType: "vision", growthLabel: "视野", title: "外部分享会", cost: 2, performance: 1, points: 1, text: "视野；+1 业绩，+1 分", flavor: "换个会议室，观点就更有远见。" },
];

function copies(cards, count) {
  return cards.flatMap((card) => Array.from({ length: count }, (_, copy) => ({
    ...card,
    id: `${card.id}-${copy + 1}`,
  })));
}

export function buildCards(playerCount) {
  return [
    ...copies(WORK_CARDS, playerCount),
    ...copies(FISH_CARDS, playerCount),
    ...copies(GROWTH_CARDS, 2),
  ];
}

export const GROWTH_TYPES = [
  ["skill", "技能"],
  ["network", "人脉"],
  ["health", "健康"],
  ["vision", "视野"],
];

const BASE_RISK_CARDS = [
  { id: "r1", title: "老板没看见", text: "平安无事。", effect: {} },
  { id: "r2", title: "同事帮忙打掩护", text: "风险值 -1。", effect: { suspicion: -1 } },
  { id: "r3", title: "消息撤回及时", text: "平安无事。", effect: {} },
  { id: "r4", title: "会议临时取消", text: "+1 分。", effect: { points: 1 } },
  { id: "r5", title: "突然被 @", text: "失去 1 精力。", effect: { energy: -1 } },
  { id: "r6", title: "摄像头亮了", text: "失去 2 分。", effect: { points: -2 } },
  { id: "r7", title: "老板经过", text: "失去 3 分，风险值降至 2。", effect: { points: -3, suspicionCap: 2 } },
  { id: "r8", title: "临时汇报", text: "业绩 -1，失去 2 分。", effect: { performance: -1, points: -2 } },
  { id: "r9", title: "摸鱼实锤", text: "失去 4 分，风险值清零。", effect: { points: -4, suspicionReset: true } },
  { id: "r10", title: "屏幕共享事故", text: "失去 4 分。", effect: { points: -4 } },
  { id: "r11", title: "工位突击检查", text: "业绩 -1，风险值清零。", effect: { performance: -1, suspicionReset: true } },
  { id: "r12", title: "完美切屏", text: "+1 业绩。", effect: { performance: 1 } },
];

const RISK_COUNTS = [
  (players) => 4 * players,
  (players) => 3 * players,
  (players) => 2 * players,
  () => 5,
  (players) => players,
  () => 5,
  (players) => players,
  (players) => players,
  (players) => players,
  () => 5,
  () => 5,
  () => 5,
];

export function buildRiskCards(playerCount) {
  return BASE_RISK_CARDS.flatMap((card, index) => copies([card], RISK_COUNTS[index](playerCount)));
}
