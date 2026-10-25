<script setup>
import { ref, onMounted } from 'vue'
import { connect, send } from '../socket'
import { useGameStore } from '../stores/game'

const emit = defineEmits(['join'])
const store = useGameStore()

const nickname = ref(localStorage.getItem('rp_nickname') || '玩家' + Math.floor(Math.random() * 1000))
const roomId = ref(localStorage.getItem('rp_roomId') || 'room-888')
const mode = ref('worst')
const maxRounds = ref(10)
const serverUrl = ref(localStorage.getItem('rp_serverUrl') || 'ws://localhost:10000/ws')
const showSettings = ref(false)

// 检查是否有上次没打完的记录
const hasLastGame = ref(!!localStorage.getItem('rp_roomId'))

function handleJoin() {
  if (!serverUrl.value) return alert('请填写服务器地址')
  localStorage.setItem('rp_serverUrl', serverUrl.value)
  localStorage.setItem('rp_nickname', nickname.value)
  localStorage.setItem('rp_roomId', roomId.value)
  
  store.myId = nickname.value
  store.roomId = roomId.value
  
  // 清空旧状态
  store.players = []
  store.finalStats = []
  store.phase = 'WAITING'
  
  connect(serverUrl.value, (msg) => {
    store.applyMessage(msg)
    if (msg.type === 'SNAPSHOT') {
      emit('join')
    }
  })
  
  send({ type: 'JOIN', roomId: store.roomId, userId: store.myId, mode: mode.value, maxRounds: maxRounds.value })
}
</script>

<template>
  <div class="min-h-screen bg-[#0a1f14] flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
    <!-- 背景光效 -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 blur-[120px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>

    <h1 class="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">🧧 欢乐红包桌</h1>
    
    <div class="flex gap-6 items-start w-full max-w-4xl justify-center z-10">
      
      <div class="bg-[#133024]/90 backdrop-blur-xl p-8 rounded-3xl w-full max-w-sm flex flex-col gap-5 border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        <button @click="showSettings = !showSettings" class="absolute top-4 right-4 text-emerald-500 hover:text-emerald-300 text-sm transition">⚙️ 设置</button>
        
        <div>
          <label class="block text-sm mb-2 text-emerald-400 font-bold tracking-wider">你的昵称</label>
          <input v-model="nickname" class="w-full p-3 rounded-xl bg-black/40 border border-emerald-700/50 outline-none focus:border-yellow-500 transition-colors text-lg font-bold" />
        </div>
        <div>
          <label class="block text-sm mb-2 text-emerald-400 font-bold tracking-wider">房间号</label>
          <input v-model="roomId" class="w-full p-3 rounded-xl bg-black/40 border border-emerald-700/50 outline-none focus:border-yellow-500 transition-colors font-mono" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-sm mb-2 text-emerald-400 font-bold tracking-wider">玩法</label>
            <select v-model="mode" class="w-full p-3 rounded-xl bg-black/40 border border-emerald-700/50 outline-none focus:border-yellow-500 transition-colors">
              <option value="worst">最差接龙</option>
              <option value="mine">扫雷模式</option>
              <option value="multiplier">倍数接龙</option>
            </select>
          </div>
          <div class="w-24">
            <label class="block text-sm mb-2 text-emerald-400 font-bold tracking-wider">局数</label>
            <select v-model="maxRounds" class="w-full p-3 rounded-xl bg-black/40 border border-emerald-700/50 outline-none">
              <option :value="5">5局</option>
              <option :value="10">10局</option>
              <option :value="20">20局</option>
            </select>
          </div>
        </div>
        
        <div v-if="showSettings" class="p-3 bg-black/40 rounded-xl border border-emerald-800">
          <label class="block text-xs mb-1 text-emerald-500">服务器 WebSocket 地址</label>
          <input v-model="serverUrl" class="w-full p-2 rounded-lg bg-black/60 text-xs border border-emerald-700 outline-none text-emerald-300" />
        </div>

        <button @click="handleJoin" class="mt-4 bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-950 font-black text-xl py-4 rounded-xl shadow-[0_10px_20px_rgba(234,179,8,0.3)] transition-all active:scale-95 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1">
          {{ hasLastGame ? '继续游戏' : '进入牌桌' }}
        </button>
      </div>

    </div>
  </div>
</template>