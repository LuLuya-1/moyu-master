import test from "node:test";
import assert from "node:assert/strict";
import { buildCards, buildRiskCards } from "../src/data.js";
import {
  buyCard,
  castRiskVote,
  chooseRiskCard,
  createGame,
  discardMarketCard,
  endTurn,
  growthScore,
  scoreGame,
  workScore,
} from "../src/engine.js";

test("game creates 2-4 players with a shared market", () => {
  const game = createGame(["甲", "乙", "丙"], 42);
  assert.equal(game.players.length, 3);
  assert.equal(game.players[0].energy, 3);
  assert.equal(game.activePlayerIndex, 0);
  assert.deepEqual(Object.values(game.market).map((lane) => lane.length), [2, 2, 2]);
  assert.throws(() => createGame(["孤独玩家"]), /2-4/);
});

test("card quantities scale with player count while each growth card has two copies", () => {
  for (const playerCount of [2, 3, 4]) {
    const cards = buildCards(playerCount);
    assert.equal(cards.filter((card) => card.type === "work").length, 12 * playerCount);
    assert.equal(cards.filter((card) => card.type === "fish").length, 12 * playerCount);
    assert.equal(cards.filter((card) => card.type === "growth").length, 24);
    const titleCounts = Object.groupBy(cards, (card) => card.title);
    assert.ok(Object.values(titleCounts).filter((group) => group[0].type === "growth").every((group) => group.length === 2));
  }
});

test("risk card quantities follow player-scaled and fixed counts", () => {
  const risks = buildRiskCards(3);
  const count = (title) => risks.filter((card) => card.title === title).length;
  assert.equal(count("老板没看见"), 12);
  assert.equal(count("同事帮忙打掩护"), 9);
  assert.equal(count("消息撤回及时"), 6);
  assert.equal(count("突然被 @"), 3);
  assert.equal(count("会议临时取消"), 5);
  assert.equal(count("屏幕共享事故"), 5);
  assert.equal(risks.length, 64);
});

test("turns advance through every player and rotate the next starting player", () => {
  const game = createGame(["甲", "乙", "丙"], 10);
  endTurn(game);
  assert.equal(game.activePlayerIndex, 1);
  endTurn(game);
  assert.equal(game.activePlayerIndex, 2);
  endTurn(game);
  assert.equal(game.round, 2);
  assert.equal(game.startingPlayerIndex, 1);
  assert.equal(game.activePlayerIndex, 1);
});

test("buying moves the active player into mandatory discard without advancing", () => {
  const game = createGame(["甲", "乙"], 12);
  const card = game.market.work[0];
  const before = game.players[0].energy;
  buyCard(game, "work", 0);
  assert.equal(game.players[0].energy, Math.min(5, before - card.cost + (card.energy ?? 0)));
  assert.equal(game.players[0].cards.length, 1);
  assert.equal(game.market.work.length, 2);
  assert.equal(game.turnPhase, "discard");
  assert.equal(game.activePlayerIndex, 0);
  assert.throws(() => buyCard(game, "work", 0), /购买阶段/);
  discardMarketCard(game, "work", 0);
  assert.equal(game.activePlayerIndex, 1);
  assert.equal(game.turnPhase, "action");
});

test("fishing reduces everyone's performance and starts one-card-per-risk voting", () => {
  const game = createGame(["甲", "乙", "丙"], 7);
  game.players.forEach((player) => { player.performance = 3; });
  game.market.fish[0] = {
    id: "test-fish", type: "fish", title: "测试摸鱼", cost: 1, points: 5, suspicion: 2, text: "测试",
  };
  buyCard(game, "fish", 0);
  assert.deepEqual(game.players.map((player) => player.performance), [2, 2, 2]);
  assert.equal(game.pendingRisk.drawn.length, 2);
  assert.deepEqual(game.pendingRisk.voterIndexes, [1, 2]);
});

test("other players vote and the active player chooses among tied winners", () => {
  const game = createGame(["甲", "乙", "丙"], 8);
  game.market.fish[0] = {
    id: "test-fish", type: "fish", title: "测试摸鱼", cost: 1, points: 5, suspicion: 2, text: "测试",
  };
  buyCard(game, "fish", 0);
  const [first, second] = game.pendingRisk.drawn;
  castRiskVote(game, 1, first.id);
  const winners = castRiskVote(game, 2, second.id);
  assert.deepEqual(new Set(winners), new Set([first.id, second.id]));
  assert.throws(() => chooseRiskCard(game, "not-a-winner"), /最高票/);
  assert.equal(chooseRiskCard(game, first.id).id, first.id);
  assert.equal(game.pendingRisk, null);
});

test("growth scores each category as n squared", () => {
  const game = createGame(["甲", "乙"], 9);
  game.players[0].growthCounts = { skill: 3, network: 2, health: 1, vision: 0 };
  assert.equal(growthScore(game.players[0]), 14);
});

test("discarded market cards are reshuffled when a category deck is empty", () => {
  const game = createGame(["甲", "乙"], 91);
  game.turnPhase = "discard";
  game.decks.work = [];
  game.marketDiscard.work = [{ id: "recycle", type: "work", title: "重洗卡", cost: 1, text: "测试" }];
  discardMarketCard(game, "work", 0);
  assert.equal(game.market.work.length, 2);
  assert.ok([...game.market.work, ...game.decks.work].some((card) => card.id === "recycle"));
});

test("work scoring follows the 12 target and one point per two surplus", () => {
  assert.equal(workScore(10).score, -4);
  assert.equal(workScore(12).score, 9);
  assert.equal(workScore(13).score, 9);
  assert.equal(workScore(14).score, 10);
  assert.equal(workScore(18).score, 12);
});

test("a two-player game ends after both players act in round 12", () => {
  const game = createGame(["甲", "乙"], 21);
  let result = null;
  for (let turn = 0; turn < 24; turn += 1) result = endTurn(game);
  assert.equal(game.finished, true);
  assert.deepEqual(result, scoreGame(game));
});
