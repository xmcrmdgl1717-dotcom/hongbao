<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { send } from '../socket'
import PlayerSeat from './PlayerSeat.vue'
import RedPacketStage from './RedPacketStage.vue'
import ActionBar from './ActionBar.vue'
import GameOver from './GameOver.vue'
import IssueModal from './IssueModal.vue'

const store = useGameStore()
const emit = defineEmits(['leave'])
const showIssueModal = ref(false)

const isHost = computed(() => store.hostId === store.myId)
const isMyIssue = computed(() => store.phase === 'ISSUING' && store.issuerId === store.myId)
const canGrab = computed(() => store.phase === 'GRABBING' && !store.grabs.some(g => g.userId === store.myId))
const myPlayer = computed(() => store.players.find(p => p.id === store.myId))

// 根据人数将玩家分布到桌子周围的固定位置
const seatPositions = computed(() => {
  const p = store.players
  const positions = []
  // 最多显示4个真实玩家座位的2.5D布局
  const layouts = {
    1: ['bottom'],
    2: ['bottom', 'top'],
    3: ['bottom', 'right', 'top'],
    4: ['bottom', 'right', 'top', 'left']
  }
  const layout = layouts[p.length] || layouts[4]
  
  return p.map((player, i) => ({
    ...player,
    posClass: layout[i] // 用来绑CSS类
  }))
})

function handleIssueClick() { showIssueModal.value = true }
function confirmIssue({ amount, count }) {
  send({ type: 'ISSUE', roomId: store.roomId, userId: store.myId, amount, count })
  showIssueModal.value = false
}

function onGrab() { send({ type: 'GRAB', roomId: store.roomId, userId: store.myId }) }
function addBot() { send({ type: 'ADD_BOT', roomId: store.roomId }) }
function kickBot(botId) { send({ type: 'KICK_BOT', roomId: store.roomId, botId }) }
function leaveRoom() { send({ type: 'LEAVE_ROOM', roomId: store.roomId, userId: store.myId }); emit('leave') }
</script>

<template>
  <!-- 3D透视背景 -->
  <div class="min-h-screen bg-[#051008] flex flex-col relative overflow-hidden perspective-container">
    <!-- 模拟桌布的渐变和网格 -->
    <div class="absolute inset-0 table-background pointer-events-none"></div>

    <!-- 顶部 HUD -->
    <header class="p-3 flex justify-between items-center z-30 bg-black/40 border-b border-white/5 backdrop-blur-md absolute top-0 w-full">
      <div class="flex items-center gap-3">
        <button @click="leaveRoom" class="px-3 py-1 bg-red-600/80 text-white text-xs font-bold rounded hover:bg-red-500 transition border border-red-400">退出</button>
        <span class="text-emerald-200 text-sm font-bold">房间: {{ store.roomId }} <span v-if="!store.config?.isPublic" class="text-red-400 ml-1">🔒</span></span>
      </div>
      <div class="text-yellow-400 font-black text-lg text-center">
        {{ store.config?.mode === 'mine' ? '扫雷' : (store.config?.mode === 'multiplier' ? '倍数' : '最差') }} 
        <span class="text-xs text-emerald-300 ml-2">第{{ store.round || 1 }}/{{ store.config?.maxRounds }}局</span>
      </div>
      <div class="flex items-center gap-2 bg-black/50 px-4 py-1 rounded border border-yellow-500/30">
        <span class="text-yellow-300 text-xs">余额</span>
        <span class="text-yellow-400 font-mono font-bold">{{ myPlayer ? (myPlayer.balance / 100).toFixed(2) : '0.00' }}</span>
      </div>
    </header>
    
    <!-- 3D 桌面区域 -->
    <main class="flex-1 relative w-full max-w-5xl mx-auto mt-16">
      
      <!-- 中心舞台 (正中央) -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <RedPacketStage :phase="store.phase" :grabs="store.grabs" :deadline="store.deadline" :last-settle="store.lastSettle" />
      </div>

      <!-- 环绕座位 -->
      <div v-for="p in seatPositions" :key="p.id" class="absolute z-30 seat-wrapper" :class="'seat-' + p.posClass">
        <PlayerSeat 
          :player-id="p.id" 
          :label="p.id === store.myId ? '我' : p.id"
          :is-issuer="p.id === store.issuerId"
          :is-mine-hit="store.lastSettle?.mineHitters?.includes(p.id)"
          :balance="p.balance"
          :offline="p.offline"
          :is-host="p.id === store.hostId"
          @kick="kickBot(p.id)"
        />
      </div>

      <!-- 房主控制台 (仅在有空位且是房主时显示) -->
      <div v-if="isHost && store.players.length < 4" class="absolute bottom-4 left-4 z-30">
        <button @click="addBot" class="px-4 py-2 bg-emerald-800/80 text-emerald-300 border border-emerald-600 rounded shadow-lg text-sm hover:bg-emerald-700 transition flex items-center gap-2">
          <span>🤖</span> 添加机器人
        </button>
      </div>

      <!-- 底部操作栏 -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full flex justify-center">
        <ActionBar
          :phase="store.phase"
          :is-my-issue="isMyIssue"
          :can-grab="canGrab"
          @issue="handleIssueClick"
          @grab="onGrab"
        />
      </div>

    </main>

    <IssueModal v-if="showIssueModal" @close="showIssueModal = false" @confirm="confirmIssue" />
    <GameOver v-if="store.phase === 'FINISHED'" @leave="leaveRoom" />
  </div>
</template>

<style>
/* 模拟 3D 桌布 */
.perspective-container {
  perspective: 1000px;
}
.table-background {
  background: radial-gradient(circle at 50% 50%, #0c3b27 0%, #03120b 80%);
  transform: rotateX(15deg) scale(1.1);
  border-radius: 40%;
  box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
  border: 2px solid rgba(16, 185, 129, 0.1);
}

/* 座位绝对定位（2.5D 环绕） */
.seat-wrapper {
  transition: all 0.3s ease;
}
.seat-bottom { bottom: 10%; left: 50%; transform: translateX(-50%) scale(1.1); }
.seat-top { top: 10%; left: 50%; transform: translateX(-50%) scale(0.9); }
.seat-left { left: 5%; top: 50%; transform: translateY(-50%) scale(0.95); }
.seat-right { right: 5%; top: 50%; transform: translateY(-50%) scale(0.95); }
</style>