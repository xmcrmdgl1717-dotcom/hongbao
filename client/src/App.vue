<script setup>
import { ref } from 'vue'
import Lobby from './components/Lobby.vue'
import Table from './components/Table.vue'

const isJoined = ref(false)
</script>

<template>
  <Lobby v-if="!isJoined" @join="isJoined = true" />
  <Table v-else />
</template>