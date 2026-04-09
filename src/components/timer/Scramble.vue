<script setup>

import {useSessionStore} from "@/stores/SessionStore";
import {useBluetoothCubeStore} from "@/stores/BluetoothCubeStore";
import {computed} from "vue";
import {useSettingsStore} from "@/stores/SettingsStore";
import {moveFace, moveAmount} from "@/helpers/scramble_utils";
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const session = useSessionStore()
const settings = useSettingsStore()
const bt = useBluetoothCubeStore()
const scramble = computed(() => session.currentScramble ?? t("timer.no_scramble"))

const isTracking = computed(() => bt.connected && bt.phase !== 'idle')
function amountToMove(face, amount) {
  const a = ((amount % 4) + 4) % 4
  if (a === 0) return null
  if (a === 1) return face
  if (a === 2) return face + '2'
  return face + "'"
}

// Simplify a list of {text, type} by merging adjacent same-face moves
function simplifyMoves(items) {
  const result = []
  for (const item of items) {
    if (result.length > 0) {
      const prev = result[result.length - 1]
      if (prev.type === item.type && moveFace(prev.text) === moveFace(item.text)) {
        const total = moveAmount(prev.text) + moveAmount(item.text)
        const merged = amountToMove(moveFace(prev.text), total)
        if (merged) {
          // Keep the more "urgent" type: correction > current > remaining
          prev.text = merged
          if (item.type === 'correction') prev.type = 'correction'
        } else {
          result.pop() // moves cancel out
        }
        continue
      }
    }
    result.push({...item})
  }
  return result
}

// Build the display sequence with simplification
const displayMoves = computed(() => {
  if (!isTracking.value) return []

  const items = []

  // Completed moves (green)
  for (let i = 0; i < bt.position; i++) {
    items.push({ text: bt.scrambleMoves[i], type: 'done' })
  }

  // Correction moves (red) + current scramble move + remaining — simplify these together
  const pending = []
  for (const cm of bt.correctionMoves) {
    pending.push({ text: cm, type: 'correction' })
  }
  for (let i = bt.position; i < bt.scrambleMoves.length; i++) {
    const type = i === bt.position
        ? (bt.pendingFaceTurn ? 'pending' : 'current')
        : 'remaining'
    pending.push({ text: bt.scrambleMoves[i], type })
  }

  const simplified = simplifyMoves(pending)
  items.push(...simplified)

  return items
})
</script>

<template>
  <h3 class="border-bottom scramble-bar">
    <span class="opacity-50 d-none d-sm-inline-block">{{$t("timer.scramble") + '&nbsp;'}} </span>
    <span :style="{ fontSize: settings.store.scrambleFontSize + 'px' }">
      <template v-if="isTracking">
        <span v-for="(m, i) in displayMoves" :key="i"
              class="bt-move"
              :class="{
                'text-success': m.type === 'done',
                'text-danger fw-bold': m.type === 'correction',
                'text-warning fw-bold': m.type === 'pending',
                'fw-bold': m.type === 'current',
              }">{{ m.text }}</span>
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
.bt-move {
  margin-right: 0.35em;
}
</style>
