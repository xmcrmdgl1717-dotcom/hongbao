import { GameRoom } from './gameRoom.js'

const rooms = new Map()

export function createRoom(id, config, broadcast) {
  const room = new GameRoom(id, config, broadcast)
  rooms.set(id, room)
  return room
}

export function getRoom(id) {
  return rooms.get(id)
}

export function removeRoom(id) {
  rooms.delete(id)
}

export function getRoomCount() {
  return rooms.size
}

// 定期清理死房间（无人在线且长时间未活动）
export function cleanupRooms() {
  const now = Date.now()
  for (const [id, room] of rooms.entries()) {
    const hasOnline = room.players.some(p => !p.offline)
    // 如果没人在线，且距离最后一次操作超过 5 分钟，清理掉
    if (!hasOnline && (now - room.lastActive > 5 * 60 * 1000)) {
      console.log('清理死房间:', id)
      rooms.delete(id)
    }
  }
}