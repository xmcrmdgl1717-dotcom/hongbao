import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createRoom, getRoom, removeRoom, getAllRooms } from './roomManager.js'
import { getPublicRoomsList, addPublicRoom } from './lobbyManager.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const roomClients = new Map() // roomId -> Set<ws>
const lobbyClients = new Set() // 在大厅的 ws

function broadcastToRoom(roomId, message) {
  const set = roomClients.get(roomId)
  if (!set) return
  const data = JSON.stringify(message)
  for (const ws of set) if (ws.readyState === 1) ws.send(data)
}

function broadcastLobby() {
  const rooms = getPublicRoomsList()
  const data = JSON.stringify({ type: 'LOBBY_UPDATE', rooms })
  for (const ws of lobbyClients) if (ws.readyState === 1) ws.send(data)
}

app.get('/', (_req, res) => res.send('red-packet-server v8 ok'))

wss.on('connection', (ws) => {
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    const { type, roomId } = msg

    // 1. 大厅相关
    if (type === 'JOIN_LOBBY') {
      lobbyClients.add(ws)
      ws.isLobby = true
      ws.send(JSON.stringify({ type: 'LOBBY_UPDATE', rooms: getPublicRoomsList() }))
      return
    }
    if (type === 'CREATE_ROOM') {
      let room = getRoom(roomId)
      if (!room) {
        room = createRoom(roomId, {
          mode: msg.mode, isPublic: msg.isPublic, password: msg.password,
          maxRounds: msg.maxRounds, baseAmountCents: 2000, issueWindowSec: 15, grabWindowSec: 10, multiplierCap: 4, tailDigit: 3
        }, (m) => broadcastToRoom(roomId, m))
        if (msg.isPublic) addPublicRoom(roomId, room.getLobbyInfo())
        broadcastLobby()
      }
      ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomId, config: room.config }))
      return
    }

    // 2. 房间相关
    if (!roomId) return

    if (type === 'JOIN_ROOM') {
      const room = getRoom(roomId)
      if (!room) {
        ws.send(JSON.stringify({ type: 'ERROR', msg: '房间不存在' }))
        return
      }
      // 密码校验
      if (!room.config.isPublic && room.config.password !== msg.password) {
        ws.send(JSON.stringify({ type: 'ERROR', msg: '密码错误' }))
        return
      }

      // 从大厅移至房间
      if (ws.isLobby) { lobbyClients.delete(ws); ws.isLobby = false; }
      if (!roomClients.has(roomId)) roomClients.set(roomId, new Set())
      roomClients.get(roomId).add(ws)
      ws.roomId = roomId
      ws.userId = msg.userId

      room.addPlayer(msg.userId)
      broadcastLobby() // 通知大厅人数变化
      
      ws.send(JSON.stringify({ type: 'SNAPSHOT', snapshot: room.snapshot() }))
      return
    }

    const room = getRoom(roomId)
    if (!room) return

    if (type === 'ADD_BOT') {
      const botId = 'AI_' + Math.floor(Math.random() * 1000)
      room.addPlayer(botId, true)
    }
    if (type === 'KICK_BOT') room.removeBot(msg.botId)
    if (type === 'ISSUE') room.issue(msg.userId, msg.amount, msg.count)
    if (type === 'GRAB') room.grab(msg.userId)
    if (type === 'LEAVE_ROOM') {
      ws.roomId = null; ws.userId = null; roomClients.get(roomId)?.delete(ws);
      room.playerOffline(msg.userId)
      broadcastLobby()
    }
  })

  ws.on('close', () => {
    if (ws.isLobby) lobbyClients.delete(ws)
    if (ws.roomId) {
      roomClients.get(ws.roomId)?.delete(ws)
      const room = getRoom(ws.roomId)
      if (room) { room.playerOffline(ws.userId); broadcastLobby() }
    }
  })
})

setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue }
    ws.isAlive = false
    ws.ping()
  }
}, 30000)

const port = process.env.PORT || 10000
server.listen(port, () => console.log('listening ' + port))