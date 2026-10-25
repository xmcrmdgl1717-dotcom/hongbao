<script setup>
import { ref } from 'vue'
import Lobby from './components/Lobby.vue'
import Table from './components/Table.vue'
import { useGameStore } from './stores/game'

const store = useGameStore()
const isJoined = ref(!!(localStorage.getItem('rp_roomId') && localStorage.getItem('rp_myId')))

if (isJoined.value) {
  store.roomId = localStorage.getItem('rp_roomId')
  store.myId = localStorage.getItem('rp_myId')
}

function handleLeave() {
  isJoined.value = false
}
</script>

<template>
  <Lobby v-if="!isJoined" @join="isJoined = true" />
  <Table v-else @leave="handleLeave" />
</template>