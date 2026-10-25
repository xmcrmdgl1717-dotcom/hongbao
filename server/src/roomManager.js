import { GameRoom } from './gameRoom.js'
import { removePublicRoom } from './lobbyManager.js'

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
  removePublicRoom(id)
}

export function getAllRooms() {
  return Array.from(rooms.values())
}