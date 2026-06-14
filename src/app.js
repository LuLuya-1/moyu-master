import { GROWTH_TYPES } from "./data.js";

const socket = window.io();
const typeNames = { work: "工作", fish: "摸鱼", growth: "自我提升" };
const identityKey = "moyu-master-identity";
let state = null;
let identity = JSON.parse(localStorage.getItem(identityKey) || "null");

const elements = Object.fromEntries([
  "home-screen", "lobby-screen", "game-screen", "result-screen", "leave-room", "create-form", "join-form",
  "copy-code", "lobby-players", "start-game", "owner-hint", "players", "room-chip", "round-label",
  "active-player", "turn-hint", "end-turn", "risk-panel", "market", "log", "result", "notice",
].map((id) => [id, document.getElementById(id)]));

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function setIdentity(code, token) {
  identity = { code, token };
  localStorage.setItem(identityKey, JSON.stringify(identity));
}

function clearIdentity() {
  identity = null;
  state = null;
  localStorage.removeItem(identityKey);
}

function showNotice(message, isError = false) {
  elements.notice.textContent = message;
  elements.notice.classList.toggle("error", isError);
  elements.notice.classList.remove("hidden");
  window.setTimeout(() => elements.notice.classList.add("hidden"), 3200);
}

function request(event, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.timeout(6000).emit(event, payload, (error, response) => {
      if (error) return reject(new Error("服务器没有响应，请检查网络"));
      if (!response.ok) return reject(new Error(response.error));
      resolve(response);
    });
  });
}

async function roomRequest(event, payload = {}) {
  if (!identity) throw new Error("尚未加入房间");
  const turnPayload = event.startsWith("game:") || event.startsWith("risk:")
    ? { turnId: state?.game?.turnId }
    : {};
  return request(event, { ...payload, ...turnPayload, ...identity });
}

function showScreen(id) {
  for (const screen of ["home-screen", "lobby-screen", "game-screen", "result-screen"]) {
    elements[screen].classList.toggle("hidden", screen !== id);
  }
  elements["leave-room"].classList.toggle("hidden", id === "home-screen");
}

function growthSummary(player) {
  return GROWTH_TYPES
    .filter(([type]) => player.growthCounts?.[type] > 0)
    .map(([type, label]) => `${label} ${player.growthCounts[type]}`)
    .join(" · ") || "尚未提升";
}

function renderLobby() {
  showScreen("lobby-screen");
  elements["copy-code"].textContent = state.code;
  elements["lobby-players"].innerHTML = state.players.map((player, index) => `
    <div><span class="connection ${player.connected ? "online" : ""}"></span><b>${escapeHtml(player.name)}</b>${index === 0 ? "（房主）" : ""}</div>
  `).join("");
  elements["start-game"].classList.toggle("hidden", !state.isOwner);
  elements["start-game"].disabled = state.players.length < 2;
  elements["owner-hint"].textContent = state.isOwner
    ? state.players.length < 2 ? "至少还需要 1 位朋友加入。" : "大家到齐后就可以开始。"
    : "等待房主开始游戏。";
}

function renderPlayers() {
  elements.players.innerHTML = state.players.map((player, index) => {
    const hasActed = state.game.actedPlayerIndexes.includes(index);
    const turnStatus = !player.connected ? "离线等待"
      : index === state.game.activePlayerIndex ? "行动中"
        : hasActed ? "本轮完成" : "等待行动";
    return `
    <article class="player-board ${index === state.game.activePlayerIndex ? "active" : ""} ${index === state.viewerIndex ? "self" : ""}">
      <div class="player-title">
        <h3>${escapeHtml(player.name)}${index === state.viewerIndex ? "（你）" : ""}</h3>
        <span class="player-turn-status">${turnStatus}</span>
      </div>
      <div class="player-stats">
        <span>精力 <b>${player.energy}/${state.config.energyCap}</b></span>
        <span>业绩 <b>${player.performance}/${state.config.performanceTarget}</b></span>
        <span>即时分 <b>${player.points}</b></span>
        <span>风险 <b>${player.suspicion}</b></span>
      </div>
      <p class="growth-line">${growthSummary(player)}</p>
    </article>
  `;
  }).join("");
}

function renderRisk() {
  const pending = state.game.pendingRisk;
  if (!pending) {
    elements["risk-panel"].classList.add("hidden");
    return;
  }
  const isVoter = pending.nextVoterIndex === state.viewerIndex;
  const isChooser = pending.votingComplete && pending.activePlayerIndex === state.viewerIndex;
  const actor = state.players[pending.activePlayerIndex];
  let instruction = `等待 ${escapeHtml(state.players[pending.nextVoterIndex]?.name || actor.name)} 操作。`;
  if (isVoter) instruction = `轮到你投票：选择希望 ${escapeHtml(actor.name)} 执行的风险牌。`;
  if (isChooser) instruction = "投票完成：请从最高票风险牌中选择一张执行。";
  elements["risk-panel"].classList.remove("hidden");
  elements["risk-panel"].innerHTML = `
    <div><p class="eyebrow">办公室陪审团 · 已投 ${pending.votesCast}/${pending.totalVoters} 票</p><h2>${instruction}</h2></div>
    <div class="risk-grid">
      ${pending.drawn.map((card) => {
        const selectable = isVoter || (isChooser && pending.winningCardIds.includes(card.id));
        return `<button class="risk-card" data-risk-id="${card.id}" ${selectable ? "" : "disabled"}>
          <b>${escapeHtml(card.title)}</b><span>${escapeHtml(card.text)}</span>
        </button>`;
      }).join("")}
    </div>`;
}

function renderMarket() {
  const isActive = state.viewerIndex === state.game.activePlayerIndex;
  const player = state.players[state.viewerIndex];
  const isAction = state.game.turnPhase === "action";
  const isDiscard = state.game.turnPhase === "discard" && !state.game.pendingRisk;
  elements.market.innerHTML = Object.entries(state.game.market).map(([type, cards]) => `
    <div class="lane"><h3 class="lane-title ${type}">${typeNames[type]}</h3>
      ${cards.map((card, index) => `
        <article class="card ${type}">
          <div class="card-top"><h3>${escapeHtml(card.title)}</h3><span class="cost">${card.cost} 精力</span></div>
          ${card.growthLabel ? `<span class="growth-tag">${escapeHtml(card.growthLabel)}</span>` : ""}
          <p class="flavor">${escapeHtml(card.flavor)}</p><p class="effect">${escapeHtml(card.text)}</p>
          ${isDiscard ? `
            <button class="discard-button" data-discard-type="${type}" data-discard-index="${index}" ${!isActive ? "disabled" : ""}>弃掉并结束回合</button>
          ` : `
            <button data-buy-type="${type}" data-buy-index="${index}" ${!isActive || !isAction || state.game.pendingRisk || player.energy < card.cost ? "disabled" : ""}>购买</button>
          `}
        </article>`).join("")}
    </div>`).join("");
}

function renderGame() {
  showScreen("game-screen");
  const active = state.players[state.game.activePlayerIndex];
  const myTurn = state.viewerIndex === state.game.activePlayerIndex;
  elements["room-chip"].textContent = `房间 ${state.code}`;
  elements["round-label"].textContent = `${state.game.round} / ${state.config.totalRounds}`;
  elements["active-player"].textContent = active.name;
  const activeOffline = !active.connected;
  elements["turn-hint"].textContent = state.game.pendingRisk ? "先完成风险投票。"
    : activeOffline ? `${active.name} 已掉线，回合会保留，等待其重连。`
      : myTurn ? state.game.turnPhase === "discard" ? "必须弃掉市场上一张牌，弃牌后自动轮到下一人。" : "轮到你了：购买一张牌，或放弃购买。"
        : `等待 ${active.name} 完成${state.game.turnPhase === "discard" ? "弃牌" : "行动"}。`;
  elements["end-turn"].disabled = !myTurn || Boolean(state.game.pendingRisk) || state.game.turnPhase !== "action";
  elements["end-turn"].classList.toggle("hidden", state.game.turnPhase !== "action");
  elements["end-turn"].textContent = "不买牌，进入弃牌";
  renderPlayers();
  renderRisk();
  renderMarket();
  elements.log.innerHTML = state.game.log.slice(0, 18).map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
}

function renderResult() {
  showScreen("result-screen");
  elements.result.innerHTML = `
    <p class="eyebrow">下班结算</p><h2>${escapeHtml(state.results.winner.name)} 获胜</h2>
    <div class="score-total">${state.results.winner.total} 分</div>
    <div class="ranking">${state.results.results.map((entry, index) => `
      <article><strong>${index + 1}. ${escapeHtml(entry.name)}</strong><b>${entry.total} 分</b>
      <span>即时 ${entry.cardPoints} + 工作 ${entry.workScore} + 提升 ${entry.growthScore}</span><small>${escapeHtml(entry.workLabel)}</small></article>
    `).join("")}</div>`;
}

function render() {
  if (!state) return showScreen("home-screen");
  if (state.phase === "lobby") return renderLobby();
  if (state.phase === "finished") return renderResult();
  renderGame();
}

socket.on("room:state", (nextState) => {
  state = nextState;
  render();
});

socket.on("connect", async () => {
  if (!identity) return;
  try {
    await request("room:resume", identity);
  } catch (error) {
    clearIdentity();
    render();
    showNotice(error.message, true);
  }
});

elements["create-form"].addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await request("room:create", { name: new FormData(event.currentTarget).get("name") });
    setIdentity(response.code, response.token);
  } catch (error) { showNotice(error.message, true); }
});

elements["join-form"].addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  try {
    const response = await request("room:join", { code: data.get("code"), name: data.get("name") });
    setIdentity(response.code, response.token);
  } catch (error) { showNotice(error.message, true); }
});

elements["start-game"].addEventListener("click", () => roomRequest("room:start").catch((error) => showNotice(error.message, true)));
elements["end-turn"].addEventListener("click", () => roomRequest("game:pass").catch((error) => showNotice(error.message, true)));
elements.market.addEventListener("click", (event) => {
  const button = event.target.closest("[data-buy-type]");
  if (button) roomRequest("game:buy", { type: button.dataset.buyType, index: Number(button.dataset.buyIndex) }).catch((error) => showNotice(error.message, true));
  const discardButton = event.target.closest("[data-discard-type]");
  if (discardButton) roomRequest("game:discard", { type: discardButton.dataset.discardType, index: Number(discardButton.dataset.discardIndex) }).catch((error) => showNotice(error.message, true));
});
elements["risk-panel"].addEventListener("click", (event) => {
  const button = event.target.closest("[data-risk-id]");
  if (!button) return;
  const pending = state.game.pendingRisk;
  const eventName = pending.votingComplete ? "risk:choose" : "risk:vote";
  roomRequest(eventName, { cardId: button.dataset.riskId }).catch((error) => showNotice(error.message, true));
});
elements["copy-code"].addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.code);
  showNotice("房间码已复制");
});
elements["leave-room"].addEventListener("click", () => {
  clearIdentity();
  render();
});

render();
