<script setup>
import { ref, onMounted } from 'vue'
import LobbyView from './components/LobbyView.vue'
import RoomView from './components/RoomView.vue'
import { connect } from './socket'
import { useGameStore } from './stores/game'

const store = useGameStore()
const currentView = ref('lobby') // 'lobby' | 'room'
const isConnected = ref(false)
const showConfig = ref(false)
const serverUrl = ref('')

// 智能规范化 URL
function normalizeUrl(url) {
  if (!url) return 'wss://localhost:10000/ws'
  let formatted = url.trim()
  
  // 移除 https:// 或 http://
  if (formatted.startsWith('https://')) formatted = formatted.replace('https://', 'wss://')
  if (formatted.startsWith('http://')) formatted = formatted.replace('http://', 'ws://')
  
  // 如果写成了 ws://https// 这种奇怪的格式（用户截图里的情况）
  if (formatted.includes('ws://https//')) formatted = formatted.replace('ws://https//', 'wss://')
  
  // 如果没有协议头，自动补全
  if (!formatted.startsWith('ws://') && !formatted.startsWith('wss://')) {
    formatted = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + formatted
  }
  
  // 如果没有 /ws 后缀，尝试加上
  if (!formatted.endsWith('/ws')) {
    formatted = formatted.replace(/\/$/, '') + '/ws'
  }
  return formatted
}

function startConnection(url) {
  isConnected.value = false
  const finalUrl = normalizeUrl(url)
  serverUrl.value = finalUrl
  localStorage.setItem('rp_serverUrl', finalUrl)

  connect(finalUrl, (msg) => {
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
  }, () => {
    // 连接失败时的回调（重连机制触发）
    isConnected.value = false
  })
}

onMounted(() => {
  // 默认读取本地或环境变量，或者尝试使用 Render 的默认域名
  const defaultUrl = import.meta.env.VITE_WS_URL || 'wss://localhost:10000/ws'
  serverUrl.value = localStorage.getItem('rp_serverUrl') || defaultUrl
  startConnection(serverUrl.value)
})

function handleManualConnect() {
  startConnection(serverUrl.value)
  showConfig.value = false
}
</script>

<template>
  <div v-if="!isConnected" class="h-screen w-screen bg-[#0a1f14] flex flex-col items-center justify-center text-emerald-400 font-bold text-xl relative">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      正在连接服务器...
      <span class="text-xs text-emerald-600 font-normal mt-2 max-w-xs text-center break-all">{{ serverUrl }}</span>
    </div>
    
    <div class="absolute bottom-10 flex flex-col items-center gap-4">
      <button @click="showConfig = !showConfig" class="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700 rounded-lg text-sm transition">
        ⚙️ 无法连接？手动设置服务器地址
      </button>
      
      <div v-if="showConfig" class="bg-[#133024] p-6 rounded-2xl border border-emerald-700 shadow-2xl w-80">
        <p class="text-xs text-emerald-400 mb-2">请填入 Render 后端分配的地址（需包含 wss:// 或 https://）</p>
        <input v-model="serverUrl" placeholder="wss://xxx.onrender.com/ws" class="w-full bg-black/50 border border-emerald-600 rounded-lg px-3 py-2 text-white outline-none mb-4 text-sm font-mono" />
        <button @click="handleManualConnect" class="w-full py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">重新连接</button>
      </div>
    </div>
  </div>
  
  <LobbyView v-else-if="currentView === 'lobby'" @enter-room="currentView = 'room'" />
  <RoomView v-else-if="currentView === 'room'" @leave="currentView = 'lobby'" />
</template>