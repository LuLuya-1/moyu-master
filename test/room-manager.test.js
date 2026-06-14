import test from "node:test";
import assert from "node:assert/strict";
import { RoomManager } from "../server/room-manager.js";

test("room owner creates a room and a friend joins", () => {
  const manager = new RoomManager();
  const owner = manager.createRoom("甲", "socket-a");
  const guest = manager.joinRoom(owner.room.code.toLowerCase(), "乙", "socket-b");
  assert.match(owner.room.code, /^[A-Z2-9]{4}$/);
  assert.equal(owner.room.members.length, 2);
  assert.notEqual(owner.token, guest.token);
});

test("only the owner can start and only the active player can act", () => {
  const manager = new RoomManager();
  const owner = manager.createRoom("甲", "socket-a");
  const guest = manager.joinRoom(owner.room.code, "乙", "socket-b");
  assert.throws(() => manager.startGame(owner.room, guest.token), /房主/);
  manager.startGame(owner.room, owner.token);
  assert.equal(owner.room.phase, "playing");
  assert.throws(() => manager.pass(owner.room, guest.token), /轮到/);
  manager.pass(owner.room, owner.token);
  assert.equal(owner.room.game.activePlayerIndex, 0);
  manager.discard(owner.room, owner.token, "work", 0);
  assert.equal(owner.room.game.activePlayerIndex, 1);
});

test("public state never exposes player tokens or hidden decks", () => {
  const manager = new RoomManager();
  const owner = manager.createRoom("甲", "socket-a");
  manager.joinRoom(owner.room.code, "乙", "socket-b");
  manager.startGame(owner.room, owner.token);
  const state = manager.publicState(owner.room, owner.token);
  const serialized = JSON.stringify(state);
  assert.equal(serialized.includes(owner.token), false);
  assert.equal("decks" in state.game, false);
  assert.equal("riskDeck" in state.game, false);
});

test("a disconnected player can resume with the original token", () => {
  const manager = new RoomManager();
  const owner = manager.createRoom("甲", "socket-a");
  manager.disconnect("socket-a");
  assert.equal(owner.room.members[0].connected, false);
  manager.resumeRoom(owner.room.code, owner.token, "socket-new");
  assert.equal(owner.room.members[0].connected, true);
  assert.equal(owner.room.members[0].socketId, "socket-new");
});

test("disconnecting the active player never advances or skips their turn", () => {
  const manager = new RoomManager();
  const owner = manager.createRoom("甲", "socket-a");
  const guest = manager.joinRoom(owner.room.code, "乙", "socket-b");
  manager.startGame(owner.room, owner.token);
  manager.pass(owner.room, owner.token);
  manager.discard(owner.room, owner.token, "work", 0);
  const turnId = owner.room.game.turnId;
  manager.disconnect("socket-b");
  assert.equal(owner.room.game.activePlayerIndex, 1);
  assert.equal(owner.room.game.turnId, turnId);
  assert.equal(owner.room.members[1].connected, false);
  manager.resumeRoom(owner.room.code, guest.token, "socket-new");
  assert.equal(owner.room.game.activePlayerIndex, 1);
});
