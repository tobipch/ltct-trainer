<script setup>

import {useSelectedStore} from "@/stores/SelectedStore";
import {computed} from "vue";

const props = defineProps(['zbllKey']);
const key = props.zbllKey
const selected = useSelectedStore();

const is_selected = computed(() => selected.isZbllSelected(key));

const onCardClicked = () => {
  const action = is_selected.value ? selected.removeZbll : selected.addZbll
  action(key);
}

const cardBgClass = computed(() => {
  return is_selected.value ? "all_cases_selected" : "no_cases_selected";
})

</script>

<template>
  <div class="border border-secondary" :class="cardBgClass">
    <div class="header p-1 border-bottom border-secondary border-opacity-75 text-center">
        {{ key.split(' ')[2] }}
    </div>
    <div class="m-1 text-center clickable py-2" @click="onCardClicked">
      <span class="fs-5 fw-bold">{{ key.split(' ')[2] }}</span>
    </div>
  </div>
</template>

<style scoped>
.header {
  cursor: default;
}
</style>