import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    roomId: null, phase: 'WAITING', seq: 0, round: 0, issuerId: null, grabs: [], multiplier: 1,
    deadline: null, config: null, myId: '', players: [], lastSettle: null, finalStats: [], hostId: null,
    lobbyRooms: [], errorMsg: ''
  }),
  getters: {
    myBalance: (state) => {
      const me = state.players.find(p => p.id === state.myId)
      return me ? me.balance : 0
    }
  },
  actions: {
    applySnapshot(s) {
      Object.assign(this, {
        roomId: s.roomId, phase: s.phase, seq: s.seq, round: s.round, issuerId: s.issuerId, grabs: s.grabs,
        multiplier: s.multiplier, deadline: s.deadline, config: s.config, players: s.players || [], hostId: s.hostId
      })
    },
    applyMessage(msg) {
      if (msg.type === 'LOBBY_UPDATE') { this.lobbyRooms = msg.rooms; return }
      if (msg.type === 'ERROR') { alert(msg.msg); return }
      if (msg.type === 'ROOM_CREATED') { this.roomId = msg.roomId; this.config = msg.config; return }
      
      if (msg.type === 'SNAPSHOT') { this.applySnapshot(msg.snapshot); return }
      if (msg.seq && msg.seq <= this.seq) return
      
      if (msg.phase) this.phase = msg.phase
      if (msg.players) this.players = msg.players
      if (msg.hostId) this.hostId = msg.hostId
      
      if (msg.type === 'PHASE') {
        this.issuerId = msg.issuerId; this.deadline = msg.deadline; this.grabs = []; this.lastSettle = null;
      }
      if (msg.type === 'PACKET_ISSUED') {
        this.issuerId = msg.issuerId; this.multiplier = msg.multiplier; this.deadline = msg.deadline;
      }
      if (msg.type === 'GRABBED') {
        this.grabs.push({ userId: msg.userId, amount: msg.amount })
      }
      if (msg.type === 'SETTLED') {
        this.grabs = msg.grabs; this.multiplier = msg.multiplier; this.round++; this.lastSettle = { ...msg, myId: this.myId };
      }
      if (msg.type === 'FINISHED') { this.finalStats = msg.finalStats }
      if (msg.seq) this.seq = msg.seq
    }
  }
})