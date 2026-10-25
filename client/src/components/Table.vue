<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { send } from '../socket'
import PlayerSeat from './PlayerSeat.vue'
import RedPacketStage from './RedPacketStage.vue'
import ActionBar from './ActionBar.vue'

const store = useGameStore()
const isMyIssue = computed(() => store.phase === 'ISSUING' && store.issuerId === store.myId)
const canGrab = computed(() => store.phase === 'GRABBING' && !store.grabs.some(g => g.userId === store.myId))

function onIssue() { send({ type: 'ISSUE', roomId: store.roomId, userId: store.myId }) }
function onGrab() { send({ type: 'GRAB', roomId: store.roomId, userId: store.myId }) }
</script>

<template>
  <div class="min-h-screen bg-emerald-950 text-white flex flex-col">
    <header class="p-3 text-center text-sm text-emerald-300">
      房间 {{ store.roomId }} · 第 {{ store.round }} 局 · 倍数 x{{ store.multiplier }}
    </header>
    <main class="flex-1 flex flex-col items-center justify-center gap-6 p-4">
      <PlayerSeat :player-id="store.issuerId" label="发包者" />
      <RedPacketStage :phase="store.phase" :grabs="store.grabs" :deadline="store.deadline" />
      <ActionBar
        :phase="store.phase"
        :is-my-issue="isMyIssue"
        :can-grab="canGrab"
        @issue="onIssue"
        @grab="onGrab"
      />
      <div class="w-full max-w-sm text-xs text-emerald-400">
        <div v-for="g in store.grabs" :key="g.userId" class="flex justify-between border-b border-emerald-800 py-1">
          <span>{{ g.userId }}</span>
          <span>{{ (g.amount / 100).toFixed(2) }} 元</span>
        </div>
      </div>
    </main>
  </div>
</template>