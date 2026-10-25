import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    roomId: null,
    phase: 'WAITING',
    seq: 0,
    round: 0,
    issuerId: null,
    grabs: [],
    multiplier: 1,
    deadline: null,
    config: null,
    myId: 'p1'
  }),
  actions: {
    applySnapshot(s) {
      this.roomId = s.roomId
      this.phase = s.phase
      this.seq = s.seq
      this.round = s.round
      this.issuerId = s.issuerId
      this.grabs = s.grabs
      this.multiplier = s.multiplier
      this.deadline = s.deadline
      this.config = s.config
    },
    applyMessage(msg) {
      if (msg.type === 'SNAPSHOT') { this.applySnapshot(msg.snapshot); return }
      if (msg.seq && msg.seq <= this.seq) return
      if (msg.phase) this.phase = msg.phase
      if (msg.type === 'PHASE') {
        this.issuerId = msg.issuerId
        this.deadline = msg.deadline
      }
      if (msg.type === 'PACKET_ISSUED') {
        this.issuerId = msg.issuerId
        this.multiplier = msg.multiplier
        this.deadline = msg.deadline
      }
      if (msg.type === 'GRABBED') {
        this.grabs.push({ userId: msg.userId, amount: msg.amount })
      }
      if (msg.type === 'SETTLED') {
        this.grabs = msg.grabs
        this.multiplier = msg.multiplier
        this.round++
      }
      if (msg.seq) this.seq = msg.seq
    }
  }
})