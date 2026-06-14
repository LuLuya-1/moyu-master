import { CARDS, CONFIG, GROWTH_TYPES, RISK_CARDS } from "./data.js";

export function seededRandom(seed = Date.now()) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createPlayer(name) {
  return {
    name,
    energy: CONFIG.startingEnergy + CONFIG.energyPerRound,
    performance: 0,
    points: 0,
    suspicion: 0,
    cards: [],
    growthCounts: Object.fromEntries(GROWTH_TYPES.map(([type]) => [type, 0])),
  };
}

export function createGame(names = ["玩家 1", "玩家 2"], seed = Date.now()) {
  if (names.length < CONFIG.minPlayers || names.length > CONFIG.maxPlayers) {
    throw new Error(`玩家人数必须为 ${CONFIG.minPlayers}-${CONFIG.maxPlayers} 人`);
  }
  const random = seededRandom(seed);
  const decks = Object.fromEntries(
    ["work", "fish", "growth"].map((type) => [type, shuffle(CARDS.filter((card) => card.type === type), random)]),
  );
  const market = { work: [], fish: [], growth: [] };
  for (const type of Object.keys(market)) refillLane(market, decks, type);

  return {
    round: 1,
    turnId: 1,
    startingPlayerIndex: 0,
    activePlayerIndex: 0,
    actedPlayerIndexes: [],
    turnPhase: "action",
    finished: false,
    players: names.map((name, index) => createPlayer(name.trim() || `玩家 ${index + 1}`)),
    decks,
    market,
    marketDiscard: { work: [], fish: [], growth: [] },
    riskDeck: shuffle(RISK_CARDS, random),
    riskDiscard: [],
    pendingRisk: null,
    random,
    log: [`第 1 回合开始：所有玩家领取 ${CONFIG.energyPerRound} 精力。`],
  };
}

export function getActivePlayer(game) {
  return game.players[game.activePlayerIndex];
}

function refillLane(gameOrMarket, decksOrType, maybeType) {
  const legacyCall = maybeType != null;
  const game = legacyCall ? null : gameOrMarket;
  const market = legacyCall ? gameOrMarket : game.market;
  const decks = legacyCall ? decksOrType : game.decks;
  const type = legacyCall ? maybeType : decksOrType;
  while (market[type].length < CONFIG.cardsPerLane) {
    if (!decks[type].length && game?.marketDiscard[type].length) {
      decks[type] = shuffle(game.marketDiscard[type], game.random);
      game.marketDiscard[type] = [];
      game.log.unshift(`${type === "work" ? "工作" : type === "fish" ? "摸鱼" : "自我提升"}弃牌堆已重新洗入牌库。`);
    }
    if (!decks[type].length) break;
    market[type].push(decks[type].pop());
  }
}

function clampPlayer(player) {
  player.energy = Math.max(0, Math.min(CONFIG.energyCap, player.energy));
  player.performance = Math.max(0, player.performance);
  player.suspicion = Math.max(0, player.suspicion);
}

function applyEffect(player, effect = {}) {
  player.energy += effect.energy ?? 0;
  player.performance += effect.performance ?? 0;
  player.points += effect.points ?? 0;
  player.suspicion += effect.suspicion ?? 0;
  if (effect.suspicionCap != null) player.suspicion = Math.min(player.suspicion, effect.suspicionCap);
  if (effect.suspicionReset) player.suspicion = 0;
  clampPlayer(player);
}

function drawRisk(game) {
  if (!game.riskDeck.length) {
    game.riskDeck = shuffle(game.riskDiscard, game.random);
    game.riskDiscard = [];
  }
  const card = game.riskDeck.pop();
  if (!card) throw new Error("风险牌数量不足");
  return card;
}

export function beginRiskVote(game) {
  const player = getActivePlayer(game);
  const drawCount = player.suspicion;
  const drawn = Array.from({ length: drawCount }, () => drawRisk(game));
  game.pendingRisk = {
    activePlayerIndex: game.activePlayerIndex,
    drawn,
    voterIndexes: game.players.map((_, index) => index).filter((index) => index !== game.activePlayerIndex),
    votes: {},
    winningCardIds: [],
  };
  game.log.unshift(`${player.name} 风险值为 ${drawCount}，抽取 ${drawCount} 张风险牌，等待其他玩家投票。`);
  return game.pendingRisk;
}

export function castRiskVote(game, voterIndex, cardId) {
  const pending = game.pendingRisk;
  if (!pending) throw new Error("当前没有风险投票");
  if (!pending.voterIndexes.includes(voterIndex)) throw new Error("该玩家没有投票资格");
  if (pending.votes[voterIndex] != null) throw new Error("该玩家已经投票");
  if (!pending.drawn.some((card) => card.id === cardId)) throw new Error("风险牌不存在");
  pending.votes[voterIndex] = cardId;

  if (Object.keys(pending.votes).length === pending.voterIndexes.length) {
    const counts = {};
    for (const vote of Object.values(pending.votes)) counts[vote] = (counts[vote] ?? 0) + 1;
    const highest = Math.max(...Object.values(counts));
    pending.winningCardIds = Object.keys(counts).filter((id) => counts[id] === highest);
  }
  return pending.winningCardIds;
}

export function chooseRiskCard(game, cardId) {
  const pending = game.pendingRisk;
  if (!pending || !pending.winningCardIds.length) throw new Error("投票尚未完成");
  if (!pending.winningCardIds.includes(cardId)) throw new Error("只能选择最高票风险牌");
  const card = pending.drawn.find((candidate) => candidate.id === cardId);
  const player = game.players[pending.activePlayerIndex];
  applyEffect(player, card.effect);
  game.riskDiscard.push(...pending.drawn);
  game.pendingRisk = null;
  game.log.unshift(`${player.name} 在最高票风险牌中选择「${card.title}」：${card.text}`);
  return card;
}

export function buyCard(game, type, index) {
  if (game.finished) throw new Error("游戏已经结束");
  if (game.pendingRisk) throw new Error("请先完成风险投票");
  if (game.turnPhase !== "action") throw new Error("当前不是购买阶段");
  const card = game.market[type]?.[index];
  const player = getActivePlayer(game);
  if (!card) throw new Error("卡牌不存在");
  if (player.energy < card.cost) throw new Error("精力不足");

  player.energy -= card.cost;
  applyEffect(player, card);
  if (card.type === "growth") player.growthCounts[card.growthType] += 1;
  player.cards.push(card);
  game.market[type].splice(index, 1);
  refillLane(game, type);
  game.turnPhase = "discard";
  game.log.unshift(`${player.name} 购买「${card.title}」：${card.text}。`);

  let risk = null;
  if (card.type === "fish") {
    for (const affected of game.players) {
      affected.performance = Math.max(0, affected.performance - 1);
    }
    game.log.unshift(`${player.name} 带动全员摸鱼：所有玩家业绩 -1。`);
    risk = beginRiskVote(game);
  }
  return { card, risk };
}

export function passAction(game) {
  if (game.finished) throw new Error("游戏已经结束");
  if (game.pendingRisk) throw new Error("请先完成风险投票");
  if (game.turnPhase !== "action") throw new Error("当前不是购买阶段");
  game.turnPhase = "discard";
  game.log.unshift(`${getActivePlayer(game).name} 放弃购买，进入市场弃牌阶段。`);
}

function advanceTurn(game) {
  if (game.finished) return scoreGame(game);
  if (game.pendingRisk) throw new Error("请先完成风险投票");

  if (!game.actedPlayerIndexes.includes(game.activePlayerIndex)) {
    game.actedPlayerIndexes.push(game.activePlayerIndex);
  }
  if (game.actedPlayerIndexes.length < game.players.length) {
    do {
      game.activePlayerIndex = (game.activePlayerIndex + 1) % game.players.length;
    } while (game.actedPlayerIndexes.includes(game.activePlayerIndex));
    game.turnId += 1;
    game.turnPhase = "action";
    game.log.unshift(`轮到 ${getActivePlayer(game).name} 行动。`);
    return null;
  }

  if (game.round >= CONFIG.totalRounds) {
    game.finished = true;
    return scoreGame(game);
  }

  game.round += 1;
  game.startingPlayerIndex = (game.startingPlayerIndex + 1) % game.players.length;
  game.activePlayerIndex = game.startingPlayerIndex;
  game.actedPlayerIndexes = [];
  game.turnId += 1;
  game.turnPhase = "action";
  for (const player of game.players) {
    player.energy = Math.min(CONFIG.energyCap, player.energy + CONFIG.energyPerRound);
  }
  game.log.unshift(`第 ${game.round} 回合开始：所有玩家领取 ${CONFIG.energyPerRound} 精力，${getActivePlayer(game).name} 先行动。`);
  return null;
}

export function discardMarketCard(game, type, index) {
  if (game.finished) throw new Error("游戏已经结束");
  if (game.pendingRisk) throw new Error("请先完成风险投票");
  if (game.turnPhase !== "discard") throw new Error("购买或放弃购买后才能弃牌");
  const card = game.market[type]?.[index];
  if (!card) throw new Error("卡牌不存在");
  game.market[type].splice(index, 1);
  game.marketDiscard[type].push(card);
  game.log.unshift(`${getActivePlayer(game).name} 将市场中的「${card.title}」弃掉。`);
  refillLane(game, type);
  return advanceTurn(game);
}

// Kept for engine-level simulations. Normal online play advances only by discarding.
export function endTurn(game) {
  if (game.turnPhase === "action") passAction(game);
  const firstLane = Object.entries(game.market).find(([, cards]) => cards.length);
  if (!firstLane) throw new Error("市场没有可弃掉的卡牌");
  return discardMarketCard(game, firstLane[0], 0);
}

export function workScore(performance) {
  if (performance < CONFIG.performanceTarget) {
    return { score: -2 * (CONFIG.performanceTarget - performance), label: `未达标，差 ${CONFIG.performanceTarget - performance} 业绩` };
  }
  const excess = performance - CONFIG.performanceTarget;
  return { score: 9 + Math.floor(excess / 2), label: `达标，超额 ${excess} 业绩` };
}

export function growthScore(player) {
  return Object.values(player.growthCounts).reduce((total, count) => total + count ** 2, 0);
}

export function scorePlayer(player) {
  const work = workScore(player.performance);
  const growth = growthScore(player);
  return {
    name: player.name,
    total: player.points + work.score + growth,
    cardPoints: player.points,
    workScore: work.score,
    workLabel: work.label,
    growthScore: growth,
    growthCounts: player.growthCounts,
    performance: player.performance,
    suspicion: player.suspicion,
    energy: player.energy,
  };
}

export function scoreGame(game) {
  const results = game.players.map(scorePlayer).sort((a, b) =>
    b.total - a.total || b.performance - a.performance || a.suspicion - b.suspicion || b.energy - a.energy,
  );
  return { results, winner: results[0] };
}
