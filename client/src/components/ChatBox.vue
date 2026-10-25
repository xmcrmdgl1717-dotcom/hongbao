<script setup>
import { ref } from 'vue'
import { send } from '../socket'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const phrases = [
  '快点发红包！',
  '老板大气！',
  '这也太黑了吧...',
  '手气最佳，快发！',
  '稍等，卡了'
]

function sendChat(text) {
  send({ type: 'CHAT', roomId: store.roomId, userId: store.myId, content: text })
}

function sendCustom(e) {
  const text = e.target.value.trim()
  if (text) {
    sendChat(text)
    e.target.value = ''
  }
}
</script>

<template>
  <div class="w-full max-w-md bg-emerald-900/80 rounded-xl p-3 border border-emerald-800 flex flex-col gap-2 z-20">
    <!-- 聊天记录栏 -->
    <div class="h-20 overflow-y-auto text-xs flex flex-col gap-1 pr-2 scrollbar-thin scrollbar-thumb-emerald-700">
      <div v-for="(msg, i) in store.chatHistory" :key="i" class="leading-tight">
        <span class="text-emerald-400 font-bold" :class="{'text-yellow-400': msg.userId === store.myId}">{{ msg.userId }}:</span>
        <span class="text-emerald-100 ml-1">{{ msg.content }}</span>
      </div>
    </div>
    
    <!-- 快捷语 -->
    <div class="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      <button v-for="p in phrases" :key="p" @click="sendChat(p)" 
              class="whitespace-nowrap px-2 py-1 bg-emerald-800 text-emerald-200 text-[10px] rounded hover:bg-emerald-700 transition">
        {{ p }}
      </button>
    </div>
    
    <!-- 输入框 -->
    <input @keyup.enter="sendCustom" placeholder="输入聊天内容并回车..." 
           class="w-full bg-emerald-950 text-emerald-100 text-xs p-2 rounded border border-emerald-700 outline-none" />
  </div>
</template>