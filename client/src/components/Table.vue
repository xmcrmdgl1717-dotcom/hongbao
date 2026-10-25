<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { send } from '../socket'
import PlayerSeat from './PlayerSeat.vue'
import RedPacketStage from './RedPacketStage.vue'
import ActionBar from './ActionBar.vue'
import GameOver from './GameOver.vue'
import IssueModal from './IssueModal.vue'
import ChatBox from './ChatBox.vue'

const store = useGameStore()
const emit = defineEmits(['leave'])
const showIssueModal = ref(false)

const isMyIssue = computed(() => store.phase === 'ISSUING' && store.issuerId === store.myId)
const canGrab = computed(() => store.phase === 'GRABBING' && !store.grabs.some(g => g.userId === store.myId))
const myPlayer = computed(() => store.players.find(p => p.id === store.myId))

function handleIssueClick() { showIssueModal.value = true }
function confirmIssue({ amount, count }) {
  send({ type: 'ISSUE', roomId: store.roomId, userId: store.myId, amount, count })
  showIssueModal.value = false
}

function onGrab() { send({ type: 'GRAB', roomId: store.roomId, userId: store.myId }) }
function addBot() { send({ type: 'ADD_BOT', roomId: store.roomId }) }
</script>

<template>
  <!-- 仿真毛毡桌布背景 -->
  <div class="min-h-screen bg-[#0d5c3f] text-white flex flex-col relative overflow-hidden" style="background-image: radial-gradient(circle at center, #148257 0%, #083422 100%);">
    <!-- 顶部 HUD -->
    <header class="p-3 flex justify-between items-center z-20 bg-black/30 border-b border-white/10 backdrop-blur-sm shadow-md">
      <div class="flex items-center gap-3">
        <button @click="emit('leave')" class="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold rounded-full transition border border-red-400">退出</button>
        <span class="text-emerald-200 text-sm font-bold bg-black/40 px-3 py-1 rounded-full border border-emerald-500/30">房间: {{ store.roomId }}</span>
      </div>
      
      <div class="flex flex-col items-center">
        <div class="text-yellow-400 font-black tracking-widest text-lg drop-shadow-md">
          {{ store.config?.mode === 'mine' ? '扫雷模式' : (store.config?.mode === 'multiplier' ? '倍数接龙' : '最差接龙') }}
        </div>
        <div class="text-xs text-emerald-200/60 font-mono">第 {{ store.round || 1 }} / {{ store.config?.maxRounds || 10 }} 局</div>
      </div>

      <div class="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-yellow-500/30">
        <span class="text-yellow-300 text-xs">余额</span>
        <span class="text-yellow-400 font-mono font-bold">{{ myPlayer ? (myPlayer.balance / 100).toFixed(2) : '0.00' }}</span>
      </div>
    </header>
    
    <main class="flex-1 flex flex-col items-center justify-center gap-4 p-2 z-10 relative">
      
      <!-- 玩家席位环绕 -->
      <div class="flex gap-4 flex-wrap justify-center w-full max-w-3xl relative mb-4">
        <PlayerSeat 
          v-for="p in store.players" 
          :key="p.id"
          :player-id="p.id" 
          :label="p.id === store.myId ? '我' : p.id"
          :is-issuer="p.id === store.issuerId"
          :is-mine-hit="store.lastSettle?.mineHitters?.includes(p.id)"
          :balance="p.balance"
          :offline="p.offline"
        />
        <button v-if="store.players.length < 4" @click="addBot" class="px-5 py-3 rounded-2xl border-2 border-dashed border-emerald-500/40 text-emerald-400 text-sm font-bold hover:bg-emerald-800/40 transition-all hover:border-emerald-400">
          + 添加机器人
        </button>
      </div>

      <!-- 中央核心区 -->
      <div class="flex gap-8 items-center justify-center w-full max-w-4xl">
        <!-- 左侧：历史流水 -->
        <div class="hidden lg:flex flex-col w-64 bg-black/30 backdrop-blur rounded-2xl p-4 border border-white/10 shadow-xl">
          <div class="text-emerald-300 font-bold text-xs mb-3 border-b border-white/10 pb-2">本轮抢包记录</div>
          <div v-if="store.grabs.length === 0" class="text-emerald-600 text-xs py-4 text-center">暂无记录</div>
          <div v-for="g in store.grabs" :key="g.userId" class="flex justify-between py-1.5 border-b border-white/5 last:border-0">
            <span class="text-xs font-bold" :class="{'text-yellow-400': g.userId === store.myId, 'text-emerald-200': g.userId !== store.myId}">
              {{ g.userId }}
            </span>
            <span class="font-mono text-xs" :class="{'text-red-400': store.lastSettle?.mineHitters?.includes(g.userId), 'text-yellow-200': !store.lastSettle?.mineHitters?.includes(g.userId)}">
              {{ (g.amount / 100).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- 中间：红包舞台 -->
        <RedPacketStage :phase="store.phase" :grabs="store.grabs" :deadline="store.deadline" :last-settle="store.lastSettle" />

        <!-- 右侧：聊天室 -->
        <ChatBox class="hidden md:flex w-64" />
      </div>

      <!-- 底部操作栏 -->
      <ActionBar
        :phase="store.phase"
        :is-my-issue="isMyIssue"
        :can-grab="canGrab"
        @issue="handleIssueClick"
        @grab="onGrab"
      />

    </main>

    <IssueModal v-if="showIssueModal" @close="showIssueModal = false" @confirm="confirmIssue" />
    <GameOver v-if="store.phase === 'FINISHED'" @leave="emit('leave')" />
  </div>
</template>