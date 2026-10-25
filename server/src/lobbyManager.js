// 大厅管理：仅保存公开房间，用于大厅广播
export const publicRooms = new Map()

export function addPublicRoom(roomId, info) {
  publicRooms.set(roomId, info)
}

export function removePublicRoom(roomId) {
  publicRooms.delete(roomId)
}

export function updatePublicRoom(roomId, info) {
  if (publicRooms.has(roomId)) {
    Object.assign(publicRooms.get(roomId), info)
  }
}

export function getPublicRoomsList() {
  return Array.from(publicRooms.values())
}