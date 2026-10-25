<script setup>
import { ref, onMounted } from 'vue'
import { connect, send } from '../socket'
import { useGameStore } from '../stores/game'

const emit = defineEmits(['join'])
const store = useGameStore()

const nickname = ref('玩家' + Math.floor(Math.random() * 1000))
const roomId = ref('room-888')
const mode = ref('worst')
const maxRounds = ref(10)
const serverUrl = ref(localStorage.getItem('rp_serverUrl') || 'ws://localhost:10000/ws')
const showSettings = ref(false)
const localHistory = ref([])

onMounted(() => {
  const h = localStorage.getItem('rp_history')
  if (h) localHistory.value = JSON.parse(h).slice(0, 5)
})

function handleJoin() {
  if (!serverUrl.value) return alert('请填写服务器地址')
  localStorage.setItem('rp_serverUrl', serverUrl.value)
  
  store.myId = nickname.value
  store.roomId = roomId.value
  localStorage.setItem('rp_roomId', store.roomId)
  localStorage.setItem('rp_myId', store.myId)
  
  store.finalStats = []
  store.phase = 'WAITING'
  
  connect(serverUrl.value, (msg) => {
    store.applyMessage(msg)
    if (msg.type === 'SNAPSHOT') {
      emit('join')
    }
    if (msg.type === 'FINISHED') {
      const h = JSON.parse(localStorage.getItem('rp_history') || '[]')
      h.unshift({ date: new Date().toLocaleString(), room: store.roomId, myNet: msg.finalStats.find(s => s.userId === store.myId)?.net })
      localStorage.setItem('rp_history', JSON.stringify(h.slice(0, 10)))
    }
  })
  
  send({ type: 'JOIN', roomId: store.roomId, userId: store.myId, mode: mode.value, maxRounds: maxRounds.value })
}
</script>

<template>
  <div class="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-4 relative">
    <h1 class="text-5xl font-black mb-8 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">🧧 红包牌桌</h1>
    
    <div class="flex gap-4 items-start w-full max-w-4xl justify-center">
      
      <div class="bg-emerald-900/80 backdrop-blur p-8 rounded-2xl w-full max-w-sm flex flex-col gap-5 border border-emerald-700 shadow-2xl relative">
        <button @click="showSettings = !showSettings" class="absolute top-4 right-4 text-emerald-500 hover:text-emerald-300 text-sm">
          ⚙️ 设置
        </button>
        
        <div>
          <label class="block text-sm mb-2 text-emerald-300 font-bold">你的昵称</label>
          <input v-model="nickname" class="w-full p-3 rounded-lg bg-emerald-950 border border-emerald-700 outline-none focus:border-red-500 transition-colors" />
        </div>
        <div>
          <label class="block text-sm mb-2 text-emerald-300 font-bold">房间号</label>
          <input v-model="roomId" class="w-full p-3 rounded-lg bg-emerald-950 border border-emerald-700 outline-none focus:border-red-500 transition-colors" />
        </div>
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="block text-sm mb-2 text-emerald-300 font-bold">选择玩法</label>
            <select v-model="mode" class="w-full p-3 rounded-lg bg-emerald-950 border border-emerald-700 outline-none focus:border-red-500 transition-colors">
              <option value="worst">最差接龙</option>
              <option value="mine">扫雷模式</option>
              <option value="multiplier">倍数接龙</option>
            </select>
          </div>
          <div class="w-24">
            <label class="block text-sm mb-2 text-emerald-300 font-bold">局数</label>
            <select v-model="maxRounds" class="w-full p-3 rounded-lg bg-emerald-950 border border-emerald-700 outline-none">
              <option :value="5">5局</option>
              <option :value="10">10局</option>
              <option :value="20">20局</option>
            </select>
          </div>
        </div>
        
        <div v-if="showSettings" class="p-3 bg-emerald-950 rounded-lg border border-emerald-800">
          <label class="block text-xs mb-1 text-emerald-400">服务器 WebSocket 地址</label>
          <input v-model="serverUrl" class="w-full p-2 rounded bg-emerald-900 text-xs border border-emerald-700 outline-none" />
        </div>

        <button @click="handleJoin" class="mt-2 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-black text-lg py-3 rounded-xl shadow-lg shadow-red-900/50 transition-all active:scale-95">
          进入牌桌
        </button>
      </div>

      <div v-if="localHistory.length > 0" class="bg-emerald-900/50 p-6 rounded-2xl w-full max-w-xs border border-emerald-800 hidden md:block">
        <h3 class="text-emerald-300 font-bold mb-4 border-b border-emerald-800 pb-2">最近战绩</h3>
        <div v-for="(h, i) in localHistory" :key="i" class="mb-3 text-sm">
          <div class="flex justify-between text-emerald-400 text-xs mb-1">
            <span>{{ h.room }}</span>
            <span>{{ h.date }}</span>
          </div>
          <div class="font-mono font-bold" :class="h.myNet >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ h.myNet >= 0 ? '+' : '' }}{{ (h.myNet / 100).toFixed(2) }} 元
          </div>
        </div>
      </div>

    </div>
  </div>
</template>