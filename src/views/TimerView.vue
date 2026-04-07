<script setup>
import Scramble from "@/components/timer/Scramble.vue";
import Timer from "@/components/timer/Timer.vue";
import ResultCard from "@/components/timer/ResultCard.vue";
import StatsCard from "@/components/timer/StatsCard.vue";
import {useI18n} from 'vue-i18n'

const {t} = useI18n()

import {TimerState, useSessionStore} from "@/stores/SessionStore";
import {useRouter} from "vue-router";
import Settings from "@/components/Settings.vue";
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useSelectedStore} from "@/stores/SelectedStore";
import {useSettingsStore} from "@/stores/SettingsStore"
import {usePresetsStore, starredName} from "@/stores/PresetStore";
import {useDisplayStore} from "@/stores/DisplayStore";

const router = useRouter();
const sessionStore = useSessionStore()
const settings = useSettingsStore()
const timerNotRunning = computed(() => sessionStore.timerState === TimerState.NOT_RUNNING)
const didntKnowConfirmed = ref(false)

const showDidntKnow = computed(() =>
    timerNotRunning.value
    && sessionStore.stats().length > 0
    && settings.store.smartSelection
)

const currentResultKey = computed(() => {
    const s = sessionStore.stats()
    return sessionStore.observingResult < s.length ? s[sessionStore.observingResult].key : null
})

const onDidntKnowClick = () => {
    if (currentResultKey.value) {
        sessionStore.flagDidntKnow(currentResultKey.value)
        didntKnowConfirmed.value = true
        setTimeout(() => { didntKnowConfirmed.value = false }, 1000)
    }
}
const timerWrapClass = computed(() => timerNotRunning.value
        ? "timer_col align-self-start"
        : "w-100")
const rightColumnClass = computed(() => timerNotRunning.value ? "result_col" : "d-none")
const selectStore = useSelectedStore()
const presets = usePresetsStore()
const displayStore = useDisplayStore()

// global key events listener
const onGlobalKeyDown = event => {
  const confirmClearSession = () => {
    if (confirm(t("stats_card.are_you_sure_to_clean"))) {
      sessionStore.clearSession()
    }
  }
  const deleteSingleResult = () => {
    if (sessionStore.stats().length > sessionStore.observingResult
        && confirm(t("result_card.are_you_sure_to_delete"))) {
      sessionStore.deleteResult(sessionStore.observingResult)
    }
  }

  if (sessionStore.timerState === TimerState.RUNNING) {
    event.preventDefault()
    sessionStore.stopTimer()
    return
  } else if (sessionStore.timerState !== TimerState.NOT_RUNNING) {
    return // don't allow actions like "delete time", "list times" etc. when timer's running
  }
  // preventDefault() is done at the end
  if (event.key === "ArrowLeft") {
    sessionStore.observingResult = Math.max(0, sessionStore.observingResult - 1)
  } else if (event.key === "ArrowRight") {
    sessionStore.observingResult = Math.min(sessionStore.stats().length - 1, sessionStore.observingResult + 1)
  } else if (event.key === "Home") {
    sessionStore.observingResult = 0
  } else if (event.key === "End") {
    sessionStore.observingResult = sessionStore.stats().length - 1
  } else if (event.key === " ") {
    if (sessionStore.timerState === TimerState.NOT_RUNNING && sessionStore.currentScramble) {
      sessionStore.getTimerReady(settings.store.timerStartDelayMs)
    }
  } else if (event.key === "Delete") {
    if (event.shiftKey) {
      confirmClearSession();
    } else { // no shift key -  delete single result
      deleteSingleResult()
    }
  } else if (event.key === "t" && event.altKey) {
    router.push('select')
  } else if (event.key === "r" && event.altKey) {
    sessionStore.startRecap()
  } else if (event.key === "d" && event.altKey) {
    confirmClearSession();
  } else if (event.key === "z" && (event.altKey || event.ctrlKey)) {
    deleteSingleResult()
  } else if (event.key === "s" && event.altKey && sessionStore.observingResult < sessionStore.stats().length) {
    selectStore.toggleSelected(sessionStore.stats()[sessionStore.observingResult])
  } else if (event.key === "a" && event.altKey && sessionStore.observingResult < sessionStore.stats().length) {
    presets.toggleAddRemove(starredName, sessionStore.stats()[sessionStore.observingResult].key)
  } else if (event.key === "f" && event.altKey && sessionStore.observingResult < sessionStore.stats().length) {
    onDidntKnowClick()
  } else {
    return // do NOT prevent default
  }
  event.preventDefault()
}
const onGlobalKeyUp = (event) => {
  if (sessionStore.timerState === TimerState.STOPPING) {
    sessionStore.timerState = TimerState.NOT_RUNNING
  } else if (event.key === " ") {
    if (sessionStore.timerState === TimerState.READY) {
      sessionStore.startTimer()
    } else if (sessionStore.timerState === TimerState.AWAITING_READY) {
      sessionStore.timerState = TimerState.NOT_RUNNING // reset
    }
  } else {
    return
  }
  event.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeyDown);
  window.addEventListener('keyup', onGlobalKeyUp);
  document.addEventListener('touchstart', onPageTouchStart);
  document.addEventListener('touchend', onPageTouchEnd);
  sessionStore.timerState = TimerState.NOT_RUNNING
  sessionStore.observingResult = Math.max(sessionStore.stats().length - 1, 0)
});

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown);
  window.removeEventListener('keyup', onGlobalKeyUp);
  document.removeEventListener('touchstart', onPageTouchStart);
  document.removeEventListener('touchend', onPageTouchEnd);
  sessionStore.timerState = TimerState.NOT_RUNNING
});

const onTimerTouchStart = event => {
  if (sessionStore.timerState === TimerState.RUNNING) {
    sessionStore.stopTimer()
  } else if (sessionStore.timerState === TimerState.NOT_RUNNING && sessionStore.currentScramble) {
    sessionStore.getTimerReady(settings.store.timerStartDelayMs)
  }
  event.preventDefault()
}

const onTimerTouchEnd = event => {
  if (sessionStore.timerState === TimerState.STOPPING) {
    sessionStore.timerState = TimerState.NOT_RUNNING
  } else if (sessionStore.timerState === TimerState.READY) {
    sessionStore.startTimer()
  } else if (sessionStore.timerState === TimerState.AWAITING_READY) {
    sessionStore.timerState = TimerState.NOT_RUNNING // reset
  }
  event.preventDefault()
}

// Stop timer from anywhere on screen
const onPageTouchStart = event => {
  if (sessionStore.timerState === TimerState.RUNNING) {
    sessionStore.stopTimer()
    event.preventDefault()
  }
}
const onPageTouchEnd = event => {
  if (sessionStore.timerState === TimerState.STOPPING) {
    sessionStore.timerState = TimerState.NOT_RUNNING
    event.preventDefault()
  }
}

</script>

<template>
  <div>
    <Scramble/>

    <div class="d-flex flex-wrap">
      <div
          class="d-flex flex-column timer_wrap"
          :class="timerWrapClass">
        <div
            class="d-flex align-items-center justify-content-center timer_touch_area position-relative"
            @touchstart="onTimerTouchStart"
            @touchend="onTimerTouchEnd"
        >
          <div v-if="showDidntKnow" class="didnt-know-wrap">
            <button
                class="btn btn-sm"
                :class="didntKnowConfirmed ? 'btn-success' : 'btn-outline-secondary'"
                tabindex="-1"
                @click.stop="onDidntKnowClick"
                @mousedown.stop=""
                @touchstart.stop="onDidntKnowClick"
                @keydown.space.prevent="">
              <template v-if="didntKnowConfirmed"><i class="bi bi-check-lg"></i></template>
              <template v-else>{{ $t("timer.didnt_know") }}</template>
            </button>
            <i class="bi bi-question-circle ms-1 text-muted didnt-know-help"
               :title="$t('timer.didnt_know_tooltip')"
               @click.stop=""
               @mousedown.stop=""
               @touchstart.stop=""></i>
          </div>
          <Timer/>
        </div>
        <div v-if="displayStore.showSettings" class="mt-2">
          <Settings/>
        </div>
        <div v-if="displayStore.showStatistics" class="d-sm-none d-block">
          <StatsCard/>
        </div>
      </div>

      <div :class="rightColumnClass">
        <div class="my-2">
          <ResultCard v-if="sessionStore.stats().length > sessionStore.observingResult"/>
        </div>
        <div class="my-2 d-sm-block d-none">
          <StatsCard/>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer_wrap {
  transition: width 0.1s ease-in-out;
}
.timer_touch_area {
  padding: 80px 0;
}
.timer_col {
  flex: 0 0 40%;
}
.result_col {
  flex: 1 1 0%;
  min-width: 0;
}
@media (min-width: 992px) {
  .timer_col {
    flex: 0 0 66.67%;
  }
  .result_col {
    flex: 0 0 33.33%;
  }
}
@media (max-width: 767.98px) {
  .timer_col {
    flex: 0 0 100%;
  }
  .result_col {
    flex: 0 0 100%;
  }
  .timer_touch_area {
    padding: 70px 0;
  }
}
.didnt-know-wrap {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}
.didnt-know-help {
  cursor: pointer;
  font-size: 0.85rem;
}
</style>