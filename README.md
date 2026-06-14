# 摸鱼大师

一款 2-4 人实时联机轻策略桌游。每位玩家使用自己的浏览器，通过房间码加入同一局游戏；服务器统一管理牌堆、回合、投票和分数。

## 前端和后端是什么

- **前端：**浏览器中看到的页面，包括玩家状态、卡牌和按钮，主要代码在 `index.html`、`style.css` 和 `src/app.js`。
- **后端：**运行在主机上的游戏服务器，统一保存房间和游戏状态，主要代码在 `server.js` 和 `server/room-manager.js`。
- **Socket.IO：**在前端和后端之间实时传递操作与最新状态。一个玩家买牌后，其他玩家的页面会立即更新。

## 启动游戏

在终端运行：

```bash
cd /home/zhishika/projects/moyu-master
bash start.sh
```

然后浏览器打开 <http://localhost:8765>。

停止服务器时，在运行它的终端按 `Ctrl+C`。

## 邀请朋友

### 在同一个 Wi-Fi

1. 启动服务器。
2. 在终端运行 `hostname -I`，找到类似 `192.168.1.23` 的局域网地址。
3. 朋友访问 `http://你的局域网地址:8765`。
4. 你创建房间并把四位房间码发给朋友。

Windows 防火墙可能会询问是否允许访问，应允许“专用网络”。

### 不在同一个网络

需要将仓库部署到一台公开服务器。项目已经提供 `Dockerfile`，可部署到支持 Node.js 或 Docker 的平台。平台需要：

- 启动命令：`npm start`
- Node.js 版本：22 或更高
- 开放平台提供的 `PORT` 环境变量
- 仅运行一个服务实例，因为当前房间状态保存在内存中

部署后，把平台提供的 HTTPS 网址发给朋友即可。服务器重启会清空正在进行的房间，这是首个联机版本的已知限制。

### 使用 Render 部署

仓库根目录提供了 `render.yaml`。将仓库推送到 GitHub 后，在 Render 中选择 **New > Blueprint**，连接该仓库并确认创建即可。也可以选择 **New > Web Service**，设置：

- Build Command：`npm ci`
- Start Command：`npm start`
- Health Check Path：`/health`
- Instance Type：`Free`（仅适合试玩）

## 联机流程

1. 房主输入名字并创建房间。
2. 房主把网址和四位房间码发给 1-3 位朋友。
3. 朋友输入名字和房间码加入。
4. 至少 2 人到齐后，房主点击“开始游戏”。
5. 每个人只在自己的浏览器操作；刷新页面会自动恢复原身份。

## 测试

```bash
npm test
```

测试覆盖规则计分、房间权限、断线重连，以及两个模拟浏览器的完整 Socket.IO 同步流程。

详细规则见 [docs/RULES.md](docs/RULES.md)。
