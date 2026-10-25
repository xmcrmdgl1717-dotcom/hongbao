<script setup>
import { ref, onMounted } from 'vue'
import { send } from '../socket'
import { useGameStore } from '../stores/game'

const emit = defineEmits(['enter-room'])
const store = useGameStore()

const showCreate = ref(false)
const showJoinPrivate = ref(false)
const joinRoomId = ref('')
const joinPassword = ref('')

const newRoom = ref({ id: 'room-' + Math.floor(Math.random()*1000), mode: 'worst', isPublic: true, password: '', maxRounds: 10 })
const nickname = ref(localStorage.getItem('rp_nickname') || '玩家' + Math.floor(Math.random() * 1000))

onMounted(() => { send({ type: 'JOIN_LOBBY' }) })

function createRoom() {
  if (!nickname.value) return alert('请填昵称')
  localStorage.setItem('rp_nickname', nickname.value)
  store.myId = nickname.value
  send({ type: 'CREATE_ROOM', roomId: newRoom.value.id, mode: newRoom.value.mode, isPublic: newRoom.value.isPublic, password: newRoom.value.password, maxRounds: newRoom.value.maxRounds })
  send({ type: 'JOIN_ROOM', roomId: newRoom.value.id, userId: nickname.value, password: newRoom.value.password })
  emit('enter-room')
}

function joinRoom(room) {
  if (!nickname.value) return alert('请填昵称')
  if (!room.isPublic) { showJoinPrivate.value = true; joinRoomId.value = room.id; return }
  enterRoom(room.id, '')
}

function enterRoom(roomId, pwd) {
  localStorage.setItem('rp_nickname', nickname.value)
  store.myId = nickname.value; store.roomId = roomId
  send({ type: 'JOIN_ROOM', roomId, userId: nickname.value, password: pwd })
  emit('enter-room')
}
function confirmPrivateJoin() { enterRoom(joinRoomId.value, joinPassword.value); showJoinPrivate.value = false }
</script>

<template>
  <div class="min-h-screen bg-[#0a1f14] text-white flex flex-col relative overflow-hidden">
    <header class="p-6 flex justify-between items-center border-b border-emerald-900/50 z-10">
      <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">🧧 欢乐红包大厅</h1>
      <div class="flex gap-4 items-center">
        <input v-model="nickname" placeholder="昵称" class="bg-black/40 border border-emerald-700/50 rounded-lg px-4 py-2 outline-none w-32 text-sm" />
        <button @click="showJoinPrivate = true" class="px-4 py-2 bg-emerald-800 text-emerald-200 font-bold rounded-lg text-sm">🔑 私密房</button>
        <button @click="showCreate = true" class="px-6 py-2 bg-gradient-to-b from-yellow-400 to-yellow-600 text-yellow-950 font-bold rounded-lg shadow-lg hover:scale-105 transition">+ 创建房间</button>
      </div>
    </header>

    <main class="flex-1 p-8 z-10 max-w-6xl mx-auto w-full">
      <h2 class="text-xl font-bold mb-6 text-emerald-300">公开房间 ({{ store.lobbyRooms.length }})</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="room in store.lobbyRooms" :key="room.id" class="bg-[#133024]/80 border border-emerald-700/30 rounded-2xl p-5 hover:border-yellow-500/50 transition group">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="text-lg font-bold">{{ room.id }}</div>
              <div class="text-xs text-emerald-400 mt-1">{{ room.mode === 'mine' ? '扫雷' : (room.mode === 'multiplier' ? '倍数' : '最差') }} · {{ room.maxRounds }}局</div>
            </div>
            <div class="text-xs px-2 py-1 rounded-full bg-emerald-900 text-emerald-300">{{ room.status }}</div>
          </div>
          <div class="flex justify-between items-center mt-6">
            <div class="text-sm text-emerald-500 font-mono">👥 {{ room.playerCount }} 人</div>
            <button @click="joinRoom(room)" class="px-4 py-2 bg-emerald-800 group-hover:bg-emerald-700 text-white text-sm rounded-lg transition">进入</button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showCreate" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="bg-[#133024] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-2xl font-bold text-yellow-400 mb-6">创建房间</h3>
        <div class="flex flex-col gap-4">
          <input v-model="newRoom.id" class="w-full bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none" />
          <div class="flex gap-4">
            <select v-model="newRoom.mode" class="flex-1 bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none">
              <option value="worst">最差接龙</option><option value="mine">扫雷</option><option value="multiplier">倍数</option>
            </select>
            <select v-model="newRoom.maxRounds" class="w-24 bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none">
              <option :value="5">5局</option><option :value="10">10局</option>
            </select>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" v-model="newRoom.isPublic" id="isPub" class="w-4 h-4 accent-yellow-500" />
            <label for="isPub" class="text-sm text-emerald-200">公开房间</label>
          </div>
          <input v-if="!newRoom.isPublic" v-model="newRoom.password" type="password" placeholder="设置密码" class="w-full bg-black/40 border border-red-700 rounded-lg p-3 outline-none" />
        </div>
        <div class="flex gap-4 mt-8">
          <button @click="showCreate = false" class="flex-1 py-3 bg-emerald-900 text-emerald-300 rounded-xl font-bold">取消</button>
          <button @click="createRoom" class="flex-1 py-3 bg-yellow-500 text-black rounded-xl font-bold">创建</button>
        </div>
      </div>
    </div>

    <div v-if="showJoinPrivate" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="bg-[#133024] border border-red-500/30 rounded-3xl p-6 w-full max-w-sm text-center">
        <h3 class="text-xl font-bold text-white mb-4">加入私密房</h3>
        <input v-model="joinRoomId" placeholder="房间号" class="w-full bg-black/40 border border-emerald-700 rounded-lg p-3 mb-3 text-center" />
        <input v-model="joinPassword" type="password" placeholder="密码" class="w-full bg-black/40 border border-red-700 rounded-lg p-3 mb-6 text-center" />
        <div class="flex gap-4">
          <button @click="showJoinPrivate = false" class="flex-1 py-3 bg-emerald-900 rounded-xl">取消</button>
          <button @click="confirmPrivateJoin" class="flex-1 py-3 bg-red-600 rounded-xl">加入</button>
        </div>
      </div>
    </div>
  </div>
</template>
