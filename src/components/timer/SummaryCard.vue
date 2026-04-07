<script setup>
import {computed, ref} from "vue";
import {useSessionStore} from "@/stores/SessionStore";
import {useSettingsStore} from "@/stores/SettingsStore";
import {usePresetsStore} from "@/stores/PresetStore";
import {useSelectedStore} from "@/stores/SelectedStore";
import {useLetterSchemeStore} from "@/stores/LetterSchemeStore";
import {useRouter} from "vue-router";
import {useI18n} from 'vue-i18n'
import {msToHumanReadable} from "@/helpers/time_formatter";
import {parseLtctKey} from "@/helpers/helpers";
import {median, aoN} from "@/helpers/srs";

const {t} = useI18n()
const router = useRouter()
const sessionStore = useSessionStore()
const settings = useSettingsStore()
const presets = usePresetsStore()
const selected = useSelectedStore()
const ls = useLetterSchemeStore()

const isOpen = ref(false)
const p = computed(() => settings.store.timerPrecision)

const times = computed(() => sessionStore.stats().map(s => s.ms))
const solveCount = computed(() => times.value.length)
const totalTimeMs = computed(() => times.value.reduce((s, t) => s + t, 0))
const uniqueCases = computed(() => new Set(sessionStore.stats().map(s => s.key)).size)
const totalSelected = computed(() => sessionStore.store.keys.length)

const medianTime = computed(() => solveCount.value > 0 ? median(times.value) : 0)
const meanTime = computed(() => solveCount.value > 0 ? totalTimeMs.value / solveCount.value : 0)
const bestTime = computed(() => solveCount.value > 0 ? Math.min(...times.value) : 0)
const worstTime = computed(() => solveCount.value > 0 ? Math.max(...times.value) : 0)
const ao5 = computed(() => aoN(times.value, 5))
const ao12 = computed(() => aoN(times.value, 12))

const caseAverages = computed(() => {
  const map = {}
  for (const s of sessionStore.stats()) {
    if (!map[s.key]) map[s.key] = {total: 0, count: 0}
    map[s.key].total += s.ms
    map[s.key].count++
  }
  return Object.entries(map)
      .map(([key, {total, count}]) => ({key, avg: total / count}))
      .sort((a, b) => b.avg - a.avg)
})

const slowestForDisplay = computed(() => {
  const n = Math.max(1, Math.ceil(caseAverages.value.length * 0.1))
  return caseAverages.value.slice(0, Math.min(n, 10))
})

const slowestForPreset = computed(() => {
  const n = Math.max(10, Math.ceil(caseAverages.value.length * 0.1))
  return caseAverages.value.slice(0, n).map(c => c.key)
})

const sparklinePoints = computed(() => {
  if (times.value.length < 2) return ''
  const maxT = Math.max(...times.value)
  const minT = Math.min(...times.value)
  const range = maxT - minT || 1
  const w = 200
  const h = 50
  return times.value.map((t, i) => {
    const x = (i / (times.value.length - 1)) * w
    const y = h - ((t - minT) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
})

const caseLetters = (key) => parseLtctKey(key, ls.toLetter).letters

const practiceSlowCases = () => {
  const keys = slowestForPreset.value
  presets.setPreset("Slow cases", keys)
  selected.applyFromPreset(new Set(keys))
  router.push('select')
}
</script>

<template>
  <div class="card">
    <div class="card-body p-2 p-sm-3">
      <h5 class="mb-0 clickable d-flex align-items-center" @click="isOpen = !isOpen">
        <span class="flex-grow-1">{{ $t("summary.title") }}</span>
        <i class="bi" :class="isOpen ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
      </h5>
      <div v-show="isOpen">
        <hr class="my-1 my-sm-2">
        <div class="row small">
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.solves") }}:</span> {{ solveCount }}
          </div>
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.cases_covered") }}:</span> {{ uniqueCases }} / {{ totalSelected }}
          </div>
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.total_time") }}:</span> {{ msToHumanReadable(totalTimeMs, 0, false) }}
          </div>
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.median") }}:</span> {{ msToHumanReadable(medianTime, p) }}
          </div>
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.mean") }}:</span> {{ msToHumanReadable(meanTime, p) }}
          </div>
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.best") }}:</span> {{ msToHumanReadable(bestTime, p) }}
          </div>
          <div class="col-6 mb-1">
            <span class="text-muted">{{ $t("summary.worst") }}:</span> {{ msToHumanReadable(worstTime, p) }}
          </div>
          <div v-if="ao5 !== null" class="col-6 mb-1">
            <span class="text-muted">Ao5:</span> {{ msToHumanReadable(ao5, p) }}
          </div>
          <div v-if="ao12 !== null" class="col-6 mb-1">
            <span class="text-muted">Ao12:</span> {{ msToHumanReadable(ao12, p) }}
          </div>
        </div>

        <svg v-if="times.length >= 2" class="sparkline" viewBox="0 0 200 50" preserveAspectRatio="none">
          <polyline :points="sparklinePoints" fill="none" stroke="var(--bs-info)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
        </svg>

        <div v-if="slowestForDisplay.length > 0" class="mt-2">
          <small class="text-muted fw-bold">{{ $t("summary.slowest_cases") }}</small>
          <div v-for="c in slowestForDisplay" :key="c.key" class="d-flex justify-content-between small">
            <span>{{ caseLetters(c.key) }} <small class="text-muted">({{ c.key }})</small></span>
            <span>{{ msToHumanReadable(c.avg, p) }}</span>
          </div>
          <button
              class="btn btn-sm btn-outline-primary mt-2 w-100"
              tabindex="-1" @keydown.space.prevent=""
              @click="practiceSlowCases">
            {{ $t("summary.practice_slow") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sparkline {
  width: 100%;
  height: 50px;
  margin-top: 4px;
}
</style>
