<script setup>
import { ref, onMounted } from 'vue'
import LobbyView from './components/LobbyView.vue'
import RoomView from './components/RoomView.vue'
import { connect } from './socket'
import { useGameStore } from './stores/game'

const store = useGameStore()
const currentView = ref('lobby')
const isConnected = ref(false)
const showConfig = ref(false)
const serverUrl = ref('')

// 🌟 终极暴力清洗地址
function normalizeUrl(url) {
  if (!url) return 'wss://localhost:10000/ws'
  
  // 1. 暴力剥离所有可能填错的协议头，只保留纯域名和路径
  let domain = url.trim()
    .replace(/^(ws|wss|http|https):\/\//gi, '') // 正常带冒号的
    .replace(/^(ws|wss|http|https)\/\//gi, '')  // 畸形的（没冒号的）
    .replace(/\/$/, '') // 去掉末尾斜杠

  if (!domain) return 'wss://localhost:10000/ws'

  // 2. 如果是本地开发环境，使用 ws://
  if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
     return `ws://${domain.includes('/ws') ? domain : domain + '/ws'}`
  }

  // 3. 如果是 Render 线上环境，强制使用 wss://
  if (!domain.endsWith('/ws')) domain += '/ws'
  return `wss://${domain}`
}

function startConnection(url) {
  isConnected.value = false
  // 清洗后存入
  const finalUrl = normalizeUrl(url)
  serverUrl.value = finalUrl
  localStorage.setItem('rp_serverUrl', finalUrl)
  console.log('最终尝试连接地址:', finalUrl)

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
    isConnected.value = false
  })
}

onMounted(() => {
  // 如果本地存的地址包含 https 或拼写错误，直接清空，使用默认值
  let cached = localStorage.getItem('rp_serverUrl')
  if (cached && (cached.includes('https//') || cached.includes('ws://https'))) {
    localStorage.removeItem('rp_serverUrl')
    cached = null
  }
  
  const defaultUrl = import.meta.env.VITE_WS_URL || 'wss://localhost:10000/ws'
  serverUrl.value = cached || defaultUrl
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
    
    <div class="absolute bottom-10 flex flex-col items-center gap-4 z-50">
      <button @click="showConfig = !showConfig" class="px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 rounded-lg text-sm transition shadow-lg">
        ⚙️ 无法连接？手动设置服务器地址
      </button>
      
      <div v-if="showConfig" class="bg-[#133024] p-6 rounded-2xl border border-emerald-700 shadow-2xl w-80">
        <p class="text-xs text-emerald-400 mb-2">请填入后端的域名即可（无需写 wss:// 或 https://，系统会自动处理）</p>
        <input v-model="serverUrl" placeholder="red-packet-server-xxx.onrender.com" class="w-full bg-black/50 border border-emerald-600 rounded-lg px-3 py-2 text-white outline-none mb-4 text-sm font-mono" />
        <button @click="handleManualConnect" class="w-full py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">重新连接</button>
      </div>
    </div>
  </div>
  
  <LobbyView v-else-if="currentView === 'lobby'" @enter-room="currentView = 'room'" />
  <RoomView v-else-if="currentView === 'room'" @leave="currentView = 'lobby'" />
</template>
