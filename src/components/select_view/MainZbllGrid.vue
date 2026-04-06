<script setup>
import OllCard from "@/components/select_view/OllCard.vue";
import {useSelectedStore} from "@/stores/SelectedStore";

const select = useSelectedStore()

const olls = select.allZbllKeysArray
    .map(key => key.split(' ')[0])
    .filter((oll, i, arr) => arr.indexOf(oll) === i);

</script>

<template>
  <div class="oll-grid">
    <div v-for="oll in olls" :key="oll" class="oll-grid-item">
      <OllCard :oll="oll"/>
    </div>
  </div>
</template>

<style scoped>
.oll-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.oll-grid-item {
  flex: 1 0 0%;
  min-width: 0;
}

@media (max-width: 480px) {
  .oll-grid-item {
    flex: 0 0 calc(50% - 6px);
  }
}
</style>