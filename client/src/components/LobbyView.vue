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
const errorMsg = ref('')

// 创建房间表单
const newRoom = ref({ id: 'room-' + Math.floor(Math.random()*1000), mode: 'worst', isPublic: true, password: '', maxRounds: 10 })
const nickname = ref(localStorage.getItem('rp_nickname') || '玩家' + Math.floor(Math.random() * 1000))

onMounted(() => {
  send({ type: 'JOIN_LOBBY' })
})

function createRoom() {
  if (!nickname.value) return alert('请填昵称')
  localStorage.setItem('rp_nickname', nickname.value)
  store.myId = nickname.value
  
  send({ 
    type: 'CREATE_ROOM', 
    roomId: newRoom.value.id, 
    mode: newRoom.value.mode, 
    isPublic: newRoom.value.isPublic, 
    password: newRoom.value.password, 
    maxRounds: newRoom.value.maxRounds 
  })
  
  // 创建后立刻进房
  send({ type: 'JOIN_ROOM', roomId: newRoom.value.id, userId: nickname.value, password: newRoom.value.password })
  emit('enter-room')
}

function joinRoom(room) {
  if (!nickname.value) return alert('请填昵称')
  if (!room.isPublic) {
    showJoinPrivate.value = true
    joinRoomId.value = room.id
    return
  }
  enterRoom(room.id, '')
}

function enterRoom(roomId, pwd) {
  localStorage.setItem('rp_nickname', nickname.value)
  store.myId = nickname.value
  store.roomId = roomId
  send({ type: 'JOIN_ROOM', roomId, userId: nickname.value, password: pwd })
  emit('enter-room')
}

function confirmPrivateJoin() {
  enterRoom(joinRoomId.value, joinPassword.value)
  showJoinPrivate.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#0a1f14] text-white flex flex-col relative overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none"></div>

    <!-- Header -->
    <header class="p-6 flex justify-between items-center border-b border-emerald-900/50 z-10">
      <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">🧧 欢乐红包大厅</h1>
      <div class="flex gap-4 items-center">
        <input v-model="nickname" placeholder="输入你的昵称" class="bg-black/40 border border-emerald-700/50 rounded-lg px-4 py-2 outline-none focus:border-yellow-500 w-48 text-sm" />
        <button @click="showCreate = true" class="px-6 py-2 bg-gradient-to-b from-yellow-400 to-yellow-600 text-yellow-950 font-bold rounded-lg shadow-lg hover:scale-105 transition">+ 创建房间</button>
      </div>
    </header>

    <!-- 房间列表 -->
    <main class="flex-1 p-8 z-10 max-w-6xl mx-auto w-full">
      <h2 class="text-xl font-bold mb-6 text-emerald-300 flex items-center gap-2">
        公开房间 <span class="text-xs bg-emerald-800 px-2 py-1 rounded">{{ store.lobbyRooms.length }}个</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="room in store.lobbyRooms" :key="room.id" class="bg-[#133024]/80 border border-emerald-700/30 rounded-2xl p-5 hover:border-yellow-500/50 transition-colors group">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="text-lg font-bold text-white">{{ room.id }}</div>
              <div class="text-xs text-emerald-400 mt-1">{{ room.mode === 'mine' ? '扫雷' : (room.mode === 'multiplier' ? '倍数' : '最差') }} · {{ room.maxRounds }}局</div>
            </div>
            <div class="text-xs px-2 py-1 rounded-full bg-emerald-900 text-emerald-300">{{ room.status }}</div>
          </div>
          <div class="flex justify-between items-center mt-6">
            <div class="text-sm text-emerald-500 font-mono">👥 {{ room.playerCount }} 人</div>
            <button @click="joinRoom(room)" class="px-4 py-2 bg-emerald-800 group-hover:bg-emerald-700 text-white text-sm rounded-lg transition">进入</button>
          </div>
        </div>
        <div v-if="store.lobbyRooms.length === 0" class="col-span-full text-center text-emerald-600 py-20">
          暂无公开房间，点击右上角创建一个吧！
        </div>
      </div>
    </main>

    <!-- 弹窗：创建房间 -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#133024] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
        <h3 class="text-2xl font-bold text-yellow-400 mb-6">创建房间</h3>
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-sm text-emerald-300 block mb-1">房间号</label>
            <input v-model="newRoom.id" class="w-full bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none focus:border-yellow-500" />
          </div>
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="text-sm text-emerald-300 block mb-1">玩法</label>
              <select v-model="newRoom.mode" class="w-full bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none">
                <option value="worst">最差接龙</option>
                <option value="mine">扫雷模式</option>
                <option value="multiplier">倍数接龙</option>
              </select>
            </div>
            <div class="w-24">
              <label class="text-sm text-emerald-300 block mb-1">局数</label>
              <select v-model="newRoom.maxRounds" class="w-full bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none">
                <option :value="5">5局</option>
                <option :value="10">10局</option>
                <option :value="20">20局</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" v-model="newRoom.isPublic" id="isPub" class="w-4 h-4 accent-yellow-500" />
            <label for="isPub" class="text-sm text-emerald-200">在大厅公开房间（取消勾选则为私密）</label>
          </div>
          <div v-if="!newRoom.isPublic">
            <label class="text-sm text-emerald-300 block mb-1">房间密码</label>
            <input v-model="newRoom.password" type="password" placeholder="请输入密码" class="w-full bg-black/40 border border-emerald-700 rounded-lg p-3 outline-none focus:border-red-500" />
          </div>
        </div>
        <div class="flex gap-4 mt-8">
          <button @click="showCreate = false" class="flex-1 py-3 bg-emerald-900 text-emerald-300 rounded-xl font-bold hover:bg-emerald-800 transition">取消</button>
          <button @click="createRoom" class="flex-1 py-3 bg-gradient-to-b from-yellow-400 to-yellow-600 text-yellow-950 rounded-xl font-bold shadow-lg hover:scale-105 transition">立即创建</button>
        </div>
      </div>
    </div>

    <!-- 弹窗：私密房间密码 -->
    <div v-if="showJoinPrivate" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div class="bg-[#133024] border border-red-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-up text-center">
        <div class="text-4xl mb-4">🔒</div>
        <h3 class="text-xl font-bold text-white mb-2">私密房间</h3>
        <p class="text-emerald-400 text-sm mb-6">请输入密码进入 {{ joinRoomId }}</p>
        <input v-model="joinPassword" type="password" placeholder="******" class="w-full bg-black/40 border border-red-700/50 rounded-lg p-3 outline-none focus:border-red-500 text-center text-xl tracking-widest mb-6" />
        <div class="flex gap-4">
          <button @click="showJoinPrivate = false" class="flex-1 py-3 bg-emerald-900 text-emerald-300 rounded-xl font-bold">取消</button>
          <button @click="confirmPrivateJoin" class="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500">进入</button>
        </div>
      </div>
    </div>
  </div>
</template>