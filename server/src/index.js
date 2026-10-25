import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createRoom, getRoom, getRoomCount, cleanupRooms } from './roomManager.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Map()

function broadcastToRoom(roomId, message) {
  const set = clients.get(roomId)
  if (!set) return
  const data = JSON.stringify(message)
  for (const ws of set) {
    if (ws.readyState === 1) ws.send(data)
  }
}

app.get('/', (_req, res) => res.send('red-packet-server v6 ok'))
app.get('/status', (_req, res) => {
  res.json({ rooms: getRoomCount(), clients: wss.clients.size })
})

wss.on('connection', (ws) => {
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    const { type, roomId } = msg
    if (!roomId) return

    if (type === 'JOIN') {
      if (!clients.has(roomId)) clients.set(roomId, new Set())
      clients.get(roomId).add(ws)
      ws.roomId = roomId
      ws.userId = msg.userId

      let room = getRoom(roomId)
      if (!room) {
        room = createRoom(roomId, {
          mode: msg.mode ?? 'worst',
          baseAmountCents: 2000,
          packetCount: 5,
          issueWindowSec: 15,
          grabWindowSec: 10,
          maxRounds: msg.maxRounds ?? 10,
          multiplierCap: 4,
          tailDigit: 3
        }, (m) => broadcastToRoom(roomId, m))
      }
      
      room.addPlayer(msg.userId)
      if (room.phase === 'WAITING') room.start(msg.userId)
      
      ws.send(JSON.stringify({ type: 'SNAPSHOT', snapshot: room.snapshot() }))
      return
    }

    const room = getRoom(roomId)
    if (!room) return
    
    if (type === 'ADD_BOT') {
      const botId = 'AI_' + Math.floor(Math.random() * 1000)
      room.addPlayer(botId, true)
    }
    if (type === 'CHAT') room.chat(msg.userId, msg.content)
    if (type === 'ISSUE') room.issue(msg.userId, msg.amount, msg.count)
    if (type === 'GRAB') room.grab(msg.userId)
  })

  ws.on('close', () => {
    if (ws.roomId) {
      clients.get(ws.roomId)?.delete(ws)
      const room = getRoom(ws.roomId)
      if (room) room.playerOffline(ws.userId)
    }
  })
})

setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue }
    ws.isAlive = false
    ws.ping()
  }
  cleanupRooms()
}, 60000) // 每分钟清理一次死房间和死连接

const port = process.env.PORT || 10000
server.listen(port, () => console.log('listening ' + port))