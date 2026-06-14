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
  { id: "w2", type: "work", title: "紧急修复", cost: 2, performance: 4, points: 1, suspicion: -1, text: "+4 业绩，+1 分，风险值 -1", flavor: "问题解决了，至于谁引入的并不重要。" },
  { id: "w3", type: "work", title: "周报文学", cost: 1, performance: 2, points: 2, text: "+2 业绩，+2 分", flavor: "把三行进度扩写成三页。" },
  { id: "w4", type: "work", title: "跨部门救火", cost: 2, performance: 5, suspicion: -2, text: "+5 业绩，风险值 -2", flavor: "火不是你点的，但功劳可以是。" },
  { id: "w5", type: "work", title: "向上管理", cost: 1, performance: 1, points: 3, suspicion: -1, text: "+1 业绩，+3 分，风险值 -1", flavor: "同步得及时，结果就显得及时。" },
  { id: "w6", type: "work", title: "流程优化", cost: 2, performance: 3, points: 2, energy: 1, text: "+3 业绩，+2 分，返还 1 精力", flavor: "开会讨论如何少开会。" },
  { id: "w7", type: "work", title: "客户好评", cost: 1, performance: 3, points: 1, text: "+3 业绩，+1 分", flavor: "截图已经放进汇报第一页。" },
  { id: "w8", type: "work", title: "季度冲刺", cost: 2, performance: 5, points: -1, text: "+5 业绩，-1 分", flavor: "今天透支的是明天的你。" },
];

const FISH_CARDS = [
  { id: "f1", type: "fish", title: "带薪咖啡", cost: 1, points: 4, suspicion: 1, text: "+4 分，风险值 +1，然后接受投票审判", flavor: "豆子有产地，工位没有归属。" },
  { id: "f2", type: "fish", title: "厕所远征", cost: 1, points: 5, suspicion: 2, text: "+5 分，风险值 +2，然后接受投票审判", flavor: "一去二十分钟，归来仍是少年。" },
  { id: "f3", type: "fish", title: "工位追剧", cost: 1, points: 6, suspicion: 2, text: "+6 分，风险值 +2，然后接受投票审判", flavor: "窗口很小，剧情很大。" },
  { id: "f4", type: "fish", title: "午休加钟", cost: 2, points: 8, suspicion: 3, text: "+8 分，风险值 +3，然后接受投票审判", flavor: "闭眼是休息，睁眼是下班。" },
  { id: "f5", type: "fish", title: "茶水间社交", cost: 1, points: 4, suspicion: 1, performance: 1, text: "+4 分，+1 业绩，风险值 +1，然后投票", flavor: "情报也是生产资料。" },
  { id: "f6", type: "fish", title: "假装调研", cost: 2, points: 7, suspicion: 2, text: "+7 分，风险值 +2，然后接受投票审判", flavor: "浏览记录充满行业洞察。" },
  { id: "f7", type: "fish", title: "远程隐身", cost: 1, points: 5, suspicion: 2, text: "+5 分，风险值 +2，然后接受投票审判", flavor: "在线状态只是一种态度。" },
  { id: "f8", type: "fish", title: "团建逃脱", cost: 2, points: 9, suspicion: 3, text: "+9 分，风险值 +3，然后接受投票审判", flavor: "最大的团队贡献是不占座位。" },
];

const GROWTH_CARDS = [
  { id: "gs1", type: "growth", growthType: "skill", growthLabel: "技能", title: "快捷键修炼", cost: 1, energy: 1, text: "技能；返还 1 精力", flavor: "省下的每一秒都可以用来发呆。" },
  { id: "gs2", type: "growth", growthType: "skill", growthLabel: "技能", title: "数据分析", cost: 1, performance: 1, text: "技能；+1 业绩", flavor: "图表一转，结论自然出现。" },
  { id: "gs3", type: "growth", growthType: "skill", growthLabel: "技能", title: "公开表达", cost: 2, performance: 2, text: "技能；+2 业绩", flavor: "声音坚定，方案就先赢了一半。" },
  { id: "gs4", type: "growth", growthType: "skill", growthLabel: "技能", title: "AI 助手", cost: 2, performance: 2, energy: 1, text: "技能；+2 业绩，返还 1 精力", flavor: "它负责输出，你负责确认语气。" },

  { id: "ge1", type: "growth", growthType: "efficiency", growthLabel: "效率", title: "时间管理", cost: 1, energy: 1, text: "效率；返还 1 精力", flavor: "管理时间的第一步是买一本书。" },
  { id: "ge2", type: "growth", growthType: "efficiency", growthLabel: "效率", title: "自动化脚本", cost: 2, energy: 2, text: "效率；返还 2 精力", flavor: "写一天脚本，省十分钟操作。" },
  { id: "ge3", type: "growth", growthType: "efficiency", growthLabel: "效率", title: "番茄工作法", cost: 1, performance: 1, text: "效率；+1 业绩", flavor: "二十五分钟认真，五分钟认真休息。" },
  { id: "ge4", type: "growth", growthType: "efficiency", growthLabel: "效率", title: "模板仓库", cost: 2, energy: 1, performance: 1, text: "效率；返还 1 精力，+1 业绩", flavor: "原创从复制自己开始。" },

  { id: "gn1", type: "growth", growthType: "network", growthLabel: "人脉", title: "茶水间情报", cost: 1, suspicion: -1, text: "人脉；风险值 -1", flavor: "公司的真实组织架构画在咖啡机旁。" },
  { id: "gn2", type: "growth", growthType: "network", growthLabel: "人脉", title: "跨组饭搭子", cost: 1, suspicion: -1, performance: 1, text: "人脉；风险值 -1，+1 业绩", flavor: "先交换菜单，再交换资源。" },
  { id: "gn3", type: "growth", growthType: "network", growthLabel: "人脉", title: "导师指点", cost: 2, suspicion: -2, text: "人脉；风险值 -2", flavor: "少走弯路，偶尔也少背一口锅。" },
  { id: "gn4", type: "growth", growthType: "network", growthLabel: "人脉", title: "部门盟友", cost: 2, suspicion: -1, points: 1, text: "人脉；风险值 -1，+1 分", flavor: "有人点赞，就像有人批准。" },

  { id: "gh1", type: "growth", growthType: "health", growthLabel: "健康", title: "工位拉伸", cost: 1, points: 1, text: "健康；+1 分", flavor: "动作不标准，态度很养生。" },
  { id: "gh2", type: "growth", growthType: "health", growthLabel: "健康", title: "规律午餐", cost: 1, energy: 1, text: "健康；返还 1 精力", flavor: "先保证胃，再保证交付。" },
  { id: "gh3", type: "growth", growthType: "health", growthLabel: "健康", title: "拒绝熬夜", cost: 2, points: 2, text: "健康；+2 分", flavor: "今天没做完的事，明天仍然没做完。" },
  { id: "gh4", type: "growth", growthType: "health", growthLabel: "健康", title: "心理边界", cost: 2, suspicion: -1, energy: 1, text: "健康；风险值 -1，返还 1 精力", flavor: "已读不等于立刻回复。" },

  { id: "gv1", type: "growth", growthType: "vision", growthLabel: "视野", title: "行业阅读", cost: 1, performance: 1, text: "视野；+1 业绩", flavor: "标题看完，趋势掌握。" },
  { id: "gv2", type: "growth", growthType: "vision", growthLabel: "视野", title: "竞品体验", cost: 1, points: 1, text: "视野；+1 分", flavor: "研究别人怎么让人加班。" },
  { id: "gv3", type: "growth", growthType: "vision", growthLabel: "视野", title: "外部分享会", cost: 2, performance: 1, points: 1, text: "视野；+1 业绩，+1 分", flavor: "换个会议室，观点就更有远见。" },
  { id: "gv4", type: "growth", growthType: "vision", growthLabel: "视野", title: "职业规划", cost: 2, points: 2, text: "视野；+2 分", flavor: "五年计划的第一步是先过周一。" },
];

function duplicate(cards, prefix) {
  return cards.flatMap((card) => [card, { ...card, id: `${card.id}-${prefix}`, title: `${card.title}·再版` }]);
}

export const CARDS = [
  ...duplicate(WORK_CARDS, "b"),
  ...duplicate(FISH_CARDS, "b"),
  ...GROWTH_CARDS,
];

export const GROWTH_TYPES = [
  ["skill", "技能"],
  ["efficiency", "效率"],
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
  { id: "r8", title: "临时汇报", text: "业绩 -2，失去 2 分。", effect: { performance: -2, points: -2 } },
  { id: "r9", title: "摸鱼实锤", text: "失去 6 分，风险值清零。", effect: { points: -6, suspicionReset: true } },
  { id: "r10", title: "屏幕共享事故", text: "失去 4 分。", effect: { points: -4 } },
  { id: "r11", title: "工位突击检查", text: "业绩 -1，风险值清零。", effect: { performance: -1, suspicionReset: true } },
  { id: "r12", title: "完美切屏", text: "+1 业绩。", effect: { performance: 1 } },
];

export const RISK_CARDS = BASE_RISK_CARDS.flatMap((card) => [0, 1, 2].map((copy) => ({
  ...card,
  id: `${card.id}-${copy}`,
})));
