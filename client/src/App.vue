<script setup>
import { ref } from 'vue'
import Lobby from './components/Lobby.vue'
import Table from './components/Table.vue'
import { useGameStore } from './stores/game'

const store = useGameStore()
// 强制回到大厅，由大厅去处理连接
const isJoined = ref(false)

function handleLeave() {
  isJoined.value = false
}
</script>

<template>
  <Lobby v-if="!isJoined" @join="isJoined = true" />
  <Table v-else @leave="handleLeave" />
</template>