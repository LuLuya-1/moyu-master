import test from "node:test";
import assert from "node:assert/strict";
import { io as createClient } from "socket.io-client";
import { createServer } from "../server.js";

function emit(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.timeout(2000).emit(event, payload, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
}

function nextState(socket, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("state timeout")), 2000);
    const listener = (state) => {
      if (!predicate(state)) return;
      clearTimeout(timeout);
      socket.off("room:state", listener);
      resolve(state);
    };
    socket.on("room:state", listener);
  });
}

test("two socket clients create, join, start, and share turns", async (context) => {
  const instance = createServer();
  await new Promise((resolve) => instance.server.listen(0, "127.0.0.1", resolve));
  const { port } = instance.server.address();
  const url = `http://127.0.0.1:${port}`;
  const owner = createClient(url);
  const guest = createClient(url);
  context.after(() => {
    owner.close();
    guest.close();
    instance.io.close();
    instance.server.close();
  });
  await Promise.all([
    new Promise((resolve) => owner.on("connect", resolve)),
    new Promise((resolve) => guest.on("connect", resolve)),
  ]);

  const created = await emit(owner, "room:create", { name: "甲" });
  assert.equal(created.ok, true);
  const joined = await emit(guest, "room:join", { code: created.code, name: "乙" });
  assert.equal(joined.ok, true);

  const ownerStarted = nextState(owner, (state) => state.phase === "playing");
  const guestStarted = nextState(guest, (state) => state.phase === "playing");
  assert.equal((await emit(owner, "room:start", { code: created.code, token: created.token })).ok, true);
  const [ownerState] = await Promise.all([ownerStarted, guestStarted]);
  const turnId = ownerState.game.turnId;

  const rejected = await emit(guest, "game:pass", { code: created.code, token: joined.token, turnId });
  assert.equal(rejected.ok, false);
  assert.match(rejected.error, /轮到/);

  assert.equal((await emit(owner, "game:pass", { code: created.code, token: created.token, turnId })).ok, true);
  const guestTurn = nextState(guest, (state) => state.game?.activePlayerIndex === 1);
  assert.equal((await emit(owner, "game:discard", { code: created.code, token: created.token, turnId, type: "work", index: 0 })).ok, true);
  const synced = await guestTurn;
  assert.equal(synced.players[1].name, "乙");
  assert.equal(synced.game.turnId, turnId + 1);

  const stale = await emit(owner, "game:pass", { code: created.code, token: created.token, turnId });
  assert.equal(stale.ok, false);
  assert.match(stale.error, /旧回合/);
});
