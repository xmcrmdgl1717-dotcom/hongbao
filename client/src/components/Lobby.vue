<script setup>
import { ref } from 'vue'
import { connect, send } from '../socket'
import { useGameStore } from '../stores/game'

const emit = defineEmits(['join'])
const store = useGameStore()

const nickname = ref('玩家' + Math.floor(Math.random() * 1000))
const roomId = ref('room-888')
const mode = ref('worst')

function handleJoin() {
  store.myId = nickname.value
  store.roomId = roomId.value
  
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:10000/ws'
  connect(wsUrl, (msg) => {
    store.applyMessage(msg)
    if (msg.type === 'SNAPSHOT') {
      emit('join')
    }
  })
  
  send({ type: 'JOIN', roomId: store.roomId, userId: store.myId, mode: mode.value })
}
</script>

<template>
  <div class="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-4">
    <h1 class="text-4xl font-bold mb-8 text-red-400">🧧 红包牌桌</h1>
    <div class="bg-emerald-900 p-6 rounded-xl w-full max-w-sm flex flex-col gap-4 border border-emerald-700 shadow-xl">
      <div>
        <label class="block text-sm mb-1 text-emerald-300">昵称</label>
        <input v-model="nickname" class="w-full p-2 rounded bg-emerald-800 border border-emerald-600 outline-none focus:border-red-400" />
      </div>
      <div>
        <label class="block text-sm mb-1 text-emerald-300">房间号</label>
        <input v-model="roomId" class="w-full p-2 rounded bg-emerald-800 border border-emerald-600 outline-none focus:border-red-400" />
      </div>
      <div>
        <label class="block text-sm mb-1 text-emerald-300">玩法</label>
        <select v-model="mode" class="w-full p-2 rounded bg-emerald-800 border border-emerald-600 outline-none">
          <option value="worst">手气最差接龙</option>
          <option value="tail">尾数接龙 (尾数3)</option>
          <option value="multiplier">倍数接龙 (最大翻倍)</option>
        </select>
      </div>
      <button @click="handleJoin" class="mt-4 bg-red-500 hover:bg-red-400 text-white font-bold py-2 rounded-full transition">
        进入房间
      </button>
    </div>
    <p class="mt-6 text-xs text-emerald-500">提示：开两个浏览器标签页，使用不同的昵称即可测试多人交互</p>
  </div>
</template>