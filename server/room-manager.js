import { randomBytes } from "node:crypto";
import {
  buyCard,
  castRiskVote,
  chooseRiskCard,
  createGame,
  discardMarketCard,
  getActivePlayer,
  passAction,
  scoreGame,
} from "../src/engine.js";
import { CONFIG } from "../src/data.js";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function cleanName(name) {
  return String(name ?? "").trim().slice(0, 12);
}

function createCode(rooms) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const bytes = randomBytes(4);
    const code = [...bytes].map((byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join("");
    if (!rooms.has(code)) return code;
  }
  throw new Error("暂时无法创建房间，请稍后重试");
}

function createToken() {
  return randomBytes(18).toString("base64url");
}

function publicPlayer(member, index, gamePlayer) {
  return {
    index,
    name: member.name,
    connected: member.connected,
    energy: gamePlayer?.energy ?? null,
    performance: gamePlayer?.performance ?? null,
    points: gamePlayer?.points ?? null,
    suspicion: gamePlayer?.suspicion ?? null,
    growthCounts: gamePlayer?.growthCounts ?? null,
  };
}

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(name, socketId) {
    const playerName = cleanName(name);
    if (!playerName) throw new Error("请输入玩家名字");
    const code = createCode(this.rooms);
    const token = createToken();
    const room = {
      code,
      phase: "lobby",
      ownerToken: token,
      members: [{ token, name: playerName, socketId, connected: true }],
      game: null,
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return { room, token };
  }

  joinRoom(code, name, socketId) {
    const room = this.getRoom(code);
    const playerName = cleanName(name);
    if (room.phase !== "lobby") throw new Error("游戏已经开始，请使用原来的身份重连");
    if (room.members.length >= CONFIG.maxPlayers) throw new Error("房间已满");
    if (!playerName) throw new Error("请输入玩家名字");
    if (room.members.some((member) => member.name === playerName)) throw new Error("房间内已有同名玩家");
    const token = createToken();
    room.members.push({ token, name: playerName, socketId, connected: true });
    return { room, token };
  }

  resumeRoom(code, token, socketId) {
    const room = this.getRoom(code);
    const member = this.getMember(room, token);
    member.socketId = socketId;
    member.connected = true;
    return room;
  }

  disconnect(socketId) {
    for (const room of this.rooms.values()) {
      const member = room.members.find((candidate) => candidate.socketId === socketId);
      if (member) {
        member.connected = false;
        member.socketId = null;
        return room;
      }
    }
    return null;
  }

  startGame(room, token) {
    this.requireOwner(room, token);
    if (room.phase !== "lobby") throw new Error("游戏已经开始");
    if (room.members.length < CONFIG.minPlayers) throw new Error("至少需要 2 名玩家");
    room.game = createGame(room.members.map((member) => member.name));
    room.phase = "playing";
    return room;
  }

  buy(room, token, type, index) {
    this.requireActivePlayer(room, token);
    buyCard(room.game, type, Number(index));
    return room;
  }

  pass(room, token) {
    this.requireActivePlayer(room, token);
    passAction(room.game);
    return room;
  }

  discard(room, token, type, index) {
    this.requireActivePlayer(room, token);
    const result = discardMarketCard(room.game, type, Number(index));
    if (result) room.phase = "finished";
    return room;
  }

  vote(room, token, cardId) {
    this.requirePlaying(room);
    const memberIndex = this.memberIndex(room, token);
    const pending = room.game.pendingRisk;
    if (!pending) throw new Error("当前没有风险投票");
    const nextVoter = pending.voterIndexes.find((index) => pending.votes[index] == null);
    if (memberIndex !== nextVoter) throw new Error("还没有轮到你投票");
    castRiskVote(room.game, memberIndex, cardId);
    return room;
  }

  chooseRisk(room, token, cardId) {
    this.requireActivePlayer(room, token);
    chooseRiskCard(room.game, cardId);
    return room;
  }

  getRoom(code) {
    const room = this.rooms.get(String(code ?? "").trim().toUpperCase());
    if (!room) throw new Error("找不到这个房间，请检查房间码");
    return room;
  }

  getMember(room, token) {
    const member = room.members.find((candidate) => candidate.token === token);
    if (!member) throw new Error("玩家身份已失效，请重新加入");
    return member;
  }

  memberIndex(room, token) {
    const index = room.members.findIndex((member) => member.token === token);
    if (index < 0) throw new Error("玩家身份已失效，请重新加入");
    return index;
  }

  requireOwner(room, token) {
    if (room.ownerToken !== token) throw new Error("只有房主可以开始游戏");
  }

  requirePlaying(room) {
    if (room.phase !== "playing" || !room.game) throw new Error("游戏尚未开始或已经结束");
  }

  requireActivePlayer(room, token) {
    this.requirePlaying(room);
    const index = this.memberIndex(room, token);
    if (index !== room.game.activePlayerIndex) throw new Error(`现在轮到 ${getActivePlayer(room.game).name}`);
  }

  requireCurrentTurn(room, expectedTurnId) {
    if (Number(expectedTurnId) !== room.game.turnId) {
      throw new Error("这个操作来自旧回合，页面将自动同步最新状态");
    }
  }

  publicState(room, token) {
    const viewerIndex = room.members.findIndex((member) => member.token === token);
    const game = room.game;
    const pending = game?.pendingRisk;
    const nextVoterIndex = pending?.voterIndexes.find((index) => pending.votes[index] == null) ?? null;
    return {
      code: room.code,
      phase: room.phase,
      viewerIndex,
      isOwner: room.ownerToken === token,
      config: CONFIG,
      players: room.members.map((member, index) => publicPlayer(member, index, game?.players[index])),
      game: game ? {
        round: game.round,
        turnId: game.turnId,
        activePlayerIndex: game.activePlayerIndex,
        startingPlayerIndex: game.startingPlayerIndex,
        actedPlayerIndexes: game.actedPlayerIndexes,
        turnPhase: game.turnPhase,
        market: game.market,
        log: game.log,
        pendingRisk: pending ? {
          activePlayerIndex: pending.activePlayerIndex,
          drawn: pending.drawn,
          votesCast: Object.keys(pending.votes).length,
          totalVoters: pending.voterIndexes.length,
          nextVoterIndex,
          winningCardIds: pending.winningCardIds,
          votingComplete: nextVoterIndex == null,
        } : null,
      } : null,
      results: room.phase === "finished" ? scoreGame(game) : null,
    };
  }
}
