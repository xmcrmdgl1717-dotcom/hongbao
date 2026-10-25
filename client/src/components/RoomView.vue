<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { send } from '../socket'
import PlayerSeat from './PlayerSeat.vue'
import RedPacketStage from './RedPacketStage.vue'
import GameOver from './GameOver.vue'

const store = useGameStore()
const emit = defineEmits(['leave'])

const isHost = computed(() => store.hostId === store.myId)
const isMyIssue = computed(() => store.phase === 'ISSUING' && store.issuerId === store.myId)
const hasGrabbed = computed(() => store.grabs.some(g => g.userId === store.myId))
const canGrab = computed(() => store.phase === 'GRABBING' && !hasGrabbed.value)
const myPlayer = computed(() => store.players.find(p => p.id === store.myId))

const seatPositions = computed(() => {
  const p = store.players
  const layouts = { 1: ['bottom'], 2: ['bottom', 'top'], 3: ['bottom', 'right', 'top'], 4: ['bottom', 'right', 'top', 'left'] }
  const layout = layouts[p.length] || layouts[4]
  return p.map((player, i) => ({ ...player, posClass: layout[i] }))
})

function startGame() { send({ type: 'START_GAME', roomId: store.roomId, userId: store.myId }) }
function addBot() { send({ type: 'ADD_BOT', roomId: store.roomId }) }
function kickBot(botId) { send({ type: 'KICK_BOT', roomId: store.roomId, botId }) }
function handleIssue() { send({ type: 'ISSUE', roomId: store.roomId, userId: store.myId }) }
function onGrab() { send({ type: 'GRAB', roomId: store.roomId, userId: store.myId }) }
function leaveRoom() { send({ type: 'LEAVE_ROOM', roomId: store.roomId, userId: store.myId }); emit('leave') }
</script>

<template>
  <div class="min-h-screen bg-[#051008] flex flex-col relative overflow-hidden perspective-container">
    <div class="absolute inset-0 table-background pointer-events-none"></div>

    <header class="p-3 flex justify-between items-center z-30 bg-black/40 border-b border-white/5 backdrop-blur-md absolute top-0 w-full">
      <div class="flex items-center gap-3">
        <button @click="leaveRoom" class="px-3 py-1 bg-red-600/80 text-white text-xs font-bold rounded hover:bg-red-500 transition">退出</button>
        <span class="text-emerald-200 text-sm font-bold">房间: {{ store.roomId }} <span v-if="!store.config?.isPublic" class="text-red-400">🔒</span></span>
      </div>
      <div class="text-yellow-400 font-black text-lg text-center">
        {{ store.config?.mode === 'mine' ? '扫雷' : (store.config?.mode === 'multiplier' ? '倍数' : '最差') }} 
        <span class="text-xs text-emerald-300 ml-2">{{ store.round || 0 }}/{{ store.config?.maxRounds }}局</span>
      </div>
      <div class="flex items-center gap-2 bg-black/50 px-4 py-1 rounded border border-yellow-500/30">
        <span class="text-yellow-300 text-xs">余额</span>
        <span class="text-yellow-400 font-mono font-bold">{{ myPlayer ? (myPlayer.balance / 100).toFixed(2) : '0.00' }}</span>
      </div>
    </header>
    
    <main class="flex-1 relative w-full max-w-5xl mx-auto mt-16 pb-32">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <RedPacketStage :phase="store.phase" :grabs="store.grabs" :deadline="store.deadline" :last-settle="store.lastSettle" />
      </div>

      <div v-for="p in seatPositions" :key="p.id" class="absolute z-30 seat-wrapper" :class="'seat-' + p.posClass">
        <PlayerSeat 
          :player-id="p.id" :label="p.id === store.myId ? '我' : p.id" :is-issuer="p.id === store.issuerId"
          :is-mine-hit="store.lastSettle?.mineHitters?.includes(p.id)" :balance="p.balance" :offline="p.offline"
          :is-host="p.id === store.hostId" @kick="kickBot(p.id)"
        />
      </div>

      <div v-if="isHost && store.players.length < 4 && store.phase === 'WAITING'" class="absolute top-20 right-4 z-30">
        <button @click="addBot" class="px-4 py-2 bg-emerald-800/80 text-emerald-300 border border-emerald-600 rounded shadow-lg text-sm flex items-center gap-2">
          <span>🤖</span> 添加机器人
        </button>
      </div>
    </main>

    <!-- 🌟 底部操作栏：根据阶段和身份，直接显示，绝不卡死 -->
    <div class="fixed bottom-0 left-0 w-full bg-[#0a1f14]/90 backdrop-blur-md border-t border-emerald-900/50 p-4 z-40 flex justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      
      <!-- 状态 1：等待开局 (WAITING) -->
      <div v-if="store.phase === 'WAITING'" class="flex items-center gap-4">
        <div v-if="isHost" class="flex flex-col items-center gap-2">
          <div class="text-xs text-emerald-400">你是房主，配置已就绪（底金20元/5份）</div>
          <button @click="startGame" class="px-16 py-3 rounded-full bg-gradient-to-b from-green-400 to-green-600 shadow-lg text-xl font-black hover:scale-105 active:scale-95 transition">开始游戏</button>
        </div>
        <div v-else class="text-emerald-400 font-bold animate-pulse text-lg">等待房主开始游戏...</div>
      </div>

      <!-- 状态 2：发包阶段 (ISSUING) -->
      <div v-else-if="store.phase === 'ISSUING'" class="flex items-center gap-4 w-full max-w-md justify-center">
        <div v-if="isMyIssue" class="flex items-center gap-4">
          <div class="text-red-400 font-bold animate-pulse text-lg">轮到你发包了！(扣款 {{(store.config?.baseAmountCents * store.multiplier / 100).toFixed(2)}}元)</div>
          <button @click="handleIssue" class="px-12 py-3 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-lg text-xl font-black hover:scale-105 active:scale-95 transition">发红包</button>
        </div>
        <div v-else class="text-yellow-400 font-bold text-lg">等待 <span class="text-white">{{ store.issuerId }}</span> 发红包...</div>
      </div>

      <!-- 状态 3：抢包阶段 (GRABBING) -->
      <div v-else-if="store.phase === 'GRABBING'" class="flex items-center justify-center w-full">
        <button v-if="canGrab" @click="onGrab" class="px-20 py-3 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 text-black shadow-lg text-2xl font-black animate-bounce hover:scale-105 transition">抢红包</button>
        <div v-else class="text-emerald-500 font-bold text-lg">已抢，等待开奖...</div>
      </div>

      <!-- 状态 4：结算阶段 (SETTLING) -->
      <div v-else-if="store.phase === 'SETTLING'" class="text-emerald-300 font-bold text-lg animate-pulse">
        开奖中，下一棒：{{ store.lastSettle?.nextIssuerId }}
      </div>

    </div>

    <GameOver v-if="store.phase === 'FINISHED'" @leave="leaveRoom" />
  </div>
</template>

<style>
.perspective-container { perspective: 1000px; }
.table-background {
  background: radial-gradient(circle at 50% 50%, #0c3b27 0%, #03120b 80%);
  transform: rotateX(15deg) scale(1.1);
  border-radius: 40%;
  box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
  border: 2px solid rgba(16, 185, 129, 0.1);
}
.seat-wrapper { transition: all 0.3s ease; }
.seat-bottom { bottom: 10%; left: 50%; transform: translateX(-50%) scale(1.1); }
.seat-top { top: 10%; left: 50%; transform: translateX(-50%) scale(0.9); }
.seat-left { left: 5%; top: 50%; transform: translateY(-50%) scale(0.95); }
.seat-right { right: 5%; top: 50%; transform: translateY(-50%) scale(0.95); }
</style>
