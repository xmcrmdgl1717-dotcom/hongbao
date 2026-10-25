import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createRoom, getRoom } from './roomManager.js'

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

app.get('/', (_req, res) => res.send('red-packet-server ok'))

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
          issueWindowSec: 12,
          grabWindowSec: 10,
          maxRounds: 10,
          multiplierCap: 4,
          tailDigit: 3
        }, (m) => broadcastToRoom(roomId, m))
        room.start(msg.userId)
      }
      ws.send(JSON.stringify({ type: 'SNAPSHOT', snapshot: room.snapshot() }))
      return
    }

    const room = getRoom(roomId)
    if (!room) return
    if (type === 'ISSUE') room.issue(msg.userId)
    if (type === 'GRAB') room.grab(msg.userId)
  })

  ws.on('close', () => {
    if (ws.roomId) clients.get(ws.roomId)?.delete(ws)
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