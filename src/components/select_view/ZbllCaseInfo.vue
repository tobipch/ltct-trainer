<script setup>
import SetupAndAlgs from "@/components/timer/SetupAndAlgs.vue";
import ZbllNote from "@/components/ZbllNote.vue";

const props = defineProps(['zbllKey']);

</script>

<template>
  <hr class="mt-0">
  <div class="row mx-1">
    <div class="col col-auto leftCol">
      <h5>{{ props.zbllKey }}</h5>
      <span class="fs-4 fw-bold">{{ props.zbllKey }}</span>
    </div>
    <div class="col text-start">
      <ZbllNote :zbllKey="props.zbllKey"/>
      <SetupAndAlgs :zbllKey="props.zbllKey" :maxAmount="8"/>
    </div>
  </div>
</template>

<style scoped>
.leftCol {
  border-right: 1px solid var(--bs-secondary);
}
</style>