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
function handleLeave() {
  localStorage.removeItem('rp_roomId')
  localStorage.removeItem('rp_myId')
  emit('leave')
}
</script>

<template>
  <div class="min-h-screen bg-emerald-950 text-white flex flex-col relative overflow-hidden">
    <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 50% 50%, #059669 0%, transparent 60%);"></div>

    <header class="p-4 flex justify-between items-center z-10 bg-emerald-900/50 border-b border-emerald-800">
      <div class="text-sm flex items-center gap-4">
        <span class="text-emerald-400">房间:</span> {{ store.roomId }}
        <span class="text-emerald-400">{{ store.round }}/{{ store.config?.maxRounds }}局</span>
        <button @click="handleLeave" class="px-2 py-1 bg-red-900/50 text-red-300 text-xs rounded border border-red-800 hover:bg-red-800 transition">退出</button>
      </div>
      <div class="text-red-400 font-bold bg-red-900/30 px-3 py-1 rounded-full border border-red-800 text-xs">
        {{ store.config?.mode === 'mine' ? '扫雷' : (store.config?.mode === 'multiplier' ? '倍数' : '最差') }}
      </div>
      <div class="text-yellow-400 font-mono font-bold">
        我的余额: {{ myPlayer ? (myPlayer.balance / 100).toFixed(2) : '0.00' }}
      </div>
    </header>
    
    <main class="flex-1 flex flex-col items-center justify-center gap-6 p-4 z-10">
      
      <div class="flex gap-4 flex-wrap justify-center w-full max-w-2xl relative">
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
        <button @click="addBot" class="px-4 py-2 rounded-full border border-dashed border-emerald-600 text-emerald-500 text-xs hover:bg-emerald-900 transition-colors">
          + 添加机器人
        </button>
      </div>

      <div class="flex gap-6 items-center justify-center w-full max-w-2xl">
        <RedPacketStage :phase="store.phase" :grabs="store.grabs" :deadline="store.deadline" :last-settle="store.lastSettle" />
        
        <!-- 侧边聊天室 -->
        <ChatBox class="hidden md:flex w-72" />
      </div>

      <ActionBar
        :phase="store.phase"
        :is-my-issue="isMyIssue"
        :can-grab="canGrab"
        @issue="handleIssueClick"
        @grab="onGrab"
      />
      
      <div class="w-full max-w-md bg-emerald-900/60 rounded-xl p-4 mt-2 border border-emerald-800 shadow-inner">
        <div class="text-emerald-400 mb-2 border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider">本轮战况</div>
        <div v-if="store.grabs.length === 0" class="text-emerald-600 text-sm py-4 text-center">暂无记录</div>
        <div v-for="g in store.grabs" :key="g.userId" class="flex justify-between py-2 border-b border-emerald-800/50 last:border-0">
          <span :class="{'text-yellow-400 font-bold': g.userId === store.myId, 'text-emerald-300': g.userId !== store.myId}">
            {{ g.userId }} {{ g.userId === store.issuerId ? '(包)' : '' }}
          </span>
          <span class="font-mono" :class="{'text-red-400': store.lastSettle?.mineHitters?.includes(g.userId), 'text-yellow-200': !store.lastSettle?.mineHitters?.includes(g.userId)}">
            {{ (g.amount / 100).toFixed(2) }} 元
          </span>
        </div>
      </div>

    </main>

    <IssueModal v-if="showIssueModal" @close="showIssueModal = false" @confirm="confirmIssue" />
    <GameOver v-if="store.phase === 'FINISHED'" @leave="handleLeave" />
  </div>
</template>