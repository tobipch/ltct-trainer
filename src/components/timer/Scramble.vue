<script setup>

import {useSessionStore} from "@/stores/SessionStore";
import {useBluetoothCubeStore} from "@/stores/BluetoothCubeStore";
import {computed} from "vue";
import {useSettingsStore} from "@/stores/SettingsStore";
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const session = useSessionStore()
const settings = useSettingsStore()
const bt = useBluetoothCubeStore()
const scramble = computed(() => session.currentScramble ?? t("timer.no_scramble"))

const isTracking = computed(() => bt.connected && bt.phase !== 'idle')

</script>

<template>
  <h3 class="border-bottom scramble-bar">
    <span class="opacity-50 d-none d-sm-inline-block">{{$t("timer.scramble") + '&nbsp;'}} </span>
    <span :style="{ fontSize: settings.store.scrambleFontSize + 'px' }">
      <template v-if="isTracking">
        <template v-for="(move, i) in bt.scrambleMoves" :key="i">
          <span v-if="i < bt.position" class="text-success">{{ move }} </span>
          <template v-if="i === bt.position">
            <span v-for="(cm, j) in bt.correctionMoves" :key="'c'+j" class="text-danger fw-bold">{{ cm }} </span>
            <span class="fw-bold">{{ move }} </span>
          </template>
          <span v-if="i > bt.position">{{ move }} </span>
        </template>
      </template>
      <template v-else>{{ scramble }}</template>
    </span>
  </h3>
</template>

<style scoped>
.scramble-bar {
  padding: 10px 0;
  margin: 0;
}
</style>
