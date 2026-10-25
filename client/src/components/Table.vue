<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { send } from '../socket'
import PlayerSeat from './PlayerSeat.vue'
import RedPacketStage from './RedPacketStage.vue'
import ActionBar from './ActionBar.vue'

const store = useGameStore()

// 判定是否轮到自己发包
const isMyIssue = computed(() => store.phase === 'ISSUING' && store.issuerId === store.myId)
// 判定是否可以抢包
const canGrab = computed(() => store.phase === 'GRABBING' && !store.grabs.some(g => g.userId === store.myId))
// 整理座位列表（把发包者排第一位，其他人排后面）
const sortedPlayers = computed(() => {
  if (!store.players.length) return []
  return [...store.players].sort((a, b) => {
    if (a.id === store.issuerId) return -1
    if (b.id === store.issuerId) return 1
    return 0
  })
})

function onIssue() { send({ type: 'ISSUE', roomId: store.roomId, userId: store.myId }) }
function onGrab() { send({ type: 'GRAB', roomId: store.roomId, userId: store.myId }) }
</script>

<template>
  <div class="min-h-screen bg-emerald-950 text-white flex flex-col">
    <header class="p-3 text-center text-sm text-emerald-300 flex justify-between items-center px-6">
      <span>房间 {{ store.roomId }} · 第 {{ store.round }} 局</span>
      <span v-if="store.config" class="text-xs bg-emerald-800 px-2 py-1 rounded">模式: {{ store.config.mode }}</span>
      <span>倍数 x{{ store.multiplier }}</span>
    </header>
    
    <main class="flex-1 flex flex-col items-center justify-center gap-6 p-4 relative">
      
      <!-- 顶部玩家列表 -->
      <div class="flex gap-4 flex-wrap justify-center mb-4">
        <PlayerSeat 
          v-for="p in sortedPlayers" 
          :key="p.id"
          :player-id="p.id" 
          :label="p.id === store.issuerId ? '发包者' : (p.id === store.myId ? '我' : '玩家')"
          :is-issuer="p.id === store.issuerId"
        />
      </div>

      <!-- 中央舞台 -->
      <RedPacketStage :phase="store.phase" :grabs="store.grabs" :deadline="store.deadline" />

      <!-- 底部操作栏 -->
      <ActionBar
        :phase="store.phase"
        :is-my-issue="isMyIssue"
        :can-grab="canGrab"
        @issue="onIssue"
        @grab="onGrab"
      />
      
      <!-- 历史流水 / 结算面板 -->
      <div class="w-full max-w-sm text-sm bg-emerald-900/50 rounded-lg p-4 mt-2">
        <div class="text-emerald-400 mb-2 border-b border-emerald-800 pb-1 text-xs">本轮抢包记录</div>
        <div v-if="store.grabs.length === 0" class="text-emerald-600 text-xs py-2">暂无记录</div>
        <div v-for="g in store.grabs" :key="g.userId" class="flex justify-between py-1 border-b border-emerald-800/50 last:border-0">
          <span :class="{'text-yellow-400 font-bold': g.userId === store.myId}">{{ g.userId }}</span>
          <span class="font-mono text-yellow-200">{{ (g.amount / 100).toFixed(2) }} 元</span>
        </div>
      </div>

    </main>
  </div>
</template>