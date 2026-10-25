<script setup>
import { ref, onMounted } from 'vue'
import LobbyView from './components/LobbyView.vue'
import RoomView from './components/RoomView.vue'
import { connect } from './socket'
import { useGameStore } from './stores/game'

const store = useGameStore()
const currentView = ref('lobby') // 'lobby' | 'room'
const isConnected = ref(false)

onMounted(() => {
  const serverUrl = localStorage.getItem('rp_serverUrl') || 'ws://localhost:10000/ws'
  connect(serverUrl, (msg) => {
    isConnected.value = true
    store.applyMessage(msg)
    
    if (msg.type === 'ROOM_CREATED' || msg.type === 'SNAPSHOT') {
      if (msg.type === 'SNAPSHOT' && currentView.value !== 'room') {
        currentView.value = 'room'
      }
    }
    if (msg.type === 'LEAVE_SUCCESS') {
      currentView.value = 'lobby'
    }
  })
})
</script>

<template>
  <div v-if="!isConnected" class="h-screen w-screen bg-[#0a1f14] flex items-center justify-center text-emerald-400 font-bold text-xl">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      正在连接服务器...
    </div>
  </div>
  
  <LobbyView v-else-if="currentView === 'lobby'" @enter-room="currentView = 'room'" />
  <RoomView v-else-if="currentView === 'room'" @leave="currentView = 'lobby'" />
</template>