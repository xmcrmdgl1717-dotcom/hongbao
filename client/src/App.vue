<script setup>
import { onMounted } from 'vue'
import { connect, send } from './socket'
import { useGameStore } from './stores/game'
import Table from './components/Table.vue'

const store = useGameStore()

onMounted(() => {
  store.roomId = 'demo-room'
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:10000/ws'
  connect(wsUrl, (msg) => store.applyMessage(msg))
  send({ type: 'JOIN', roomId: store.roomId, userId: store.myId, mode: 'worst' })
})
</script>

<template>
  <Table />
</template>