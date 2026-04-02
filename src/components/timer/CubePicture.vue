<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useSettingsStore} from "@/stores/SettingsStore";
import { TwistyPlayer } from "cubing/twisty";

const props = defineProps(['scramble'])
const settings = useSettingsStore()
const containerDiv = ref(null)
let player = null

const windowWidth = ref(window.innerWidth || document.documentElement.clientWidth)
const windowHeight = ref(window.innerHeight || document.documentElement.clientHeight)

function updateDimensions() {
  windowWidth.value = window.innerWidth || document.documentElement.clientWidth;
  windowHeight.value = window.innerHeight || document.documentElement.clientHeight
}

const cubePictureSize = computed(() => {
  const breakpoints = [
    { breakpoint: 416, pictureSize: 80 },
    { breakpoint: 576, pictureSize: 100 },
    { breakpoint: 768, pictureSize: 150 },
    { breakpoint: 960, pictureSize: 200 },
  ];

  for (let { breakpoint, pictureSize } of breakpoints) {
    if (windowWidth.value < breakpoint || windowHeight.value < breakpoint) {
      return pictureSize;
    }
  }

  return 250;
})

const createPlayer = () => {
  if (player) {
    player.remove()
    player = null
  }

  if (!props.scramble || !containerDiv.value) return

  const orient = (settings.store.cubeOrientation || "").trim()
  const alg = orient ? orient + " " + props.scramble : props.scramble

  player = new TwistyPlayer({
    puzzle: "3x3x3",
    alg: alg,
    visualization: "3D",
    hintFacelets: "none",
    backView: "none",
    background: "none",
    controlPanel: "none",
    experimentalDragInput: "auto",
  })

  player.style.width = `${cubePictureSize.value}px`
  player.style.height = `${cubePictureSize.value}px`
  containerDiv.value.appendChild(player)
}

watch(() => props.scramble, createPlayer)
watch(() => cubePictureSize.value, () => {
  if (player) {
    player.style.width = `${cubePictureSize.value}px`
    player.style.height = `${cubePictureSize.value}px`
  }
})

onMounted(() => {
  window.addEventListener('resize', updateDimensions)
  createPlayer()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDimensions)
  if (player) {
    player.remove()
    player = null
  }
})
</script>

<template>
  <div ref="containerDiv"></div>
</template>

<style scoped>
</style>
