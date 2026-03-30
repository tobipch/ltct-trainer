<script setup>

import {useSelectedStore} from "@/stores/SelectedStore";
import {computed, ref} from "vue";
import ZbllsModal from "@/components/select_view/ZbllsModal.vue";

const props = defineProps(['oll', 'coll'])
const {oll, coll}  = props;
const selected = useSelectedStore();

const num_cases_selected = computed(() => selected.numZbllsInCollSelected(oll, coll));
const total_zblls_in_coll = selected.allZbllKeysArray.filter(key => key.startsWith(`${oll} ${coll}`)).length

const onCardClicked = () => {
  const action = num_cases_selected.value === 0 ? selected.addColl : selected.removeColl
  action(oll, coll)
}

const modalCloseCallback = () => { modalShown.value=false }

const card_bg_class = computed(() => {
  return (num_cases_selected.value === 0) ? "no_cases_selected" :
      (total_zblls_in_coll === num_cases_selected.value)
          ? "all_cases_selected"
          : "some_cases_selected";
})

const modalShown = ref(false);
</script>

<template>
  <div class="border border-dark" :class="card_bg_class">
    <div
        class="header p-1 clickable border-bottom border-secondary"
        @click="modalShown=true"
    >
      <strong class="text-center">
        {{props.coll}}
      </strong>
      <span>
        ({{num_cases_selected}}/{{total_zblls_in_coll}})
      </span>
    </div>
    <div class="clickable m-1 text-center py-2" @click="onCardClicked">
      <span class="fs-4 fw-bold">{{ coll }}</span>
    </div>
  </div>
  <ZbllsModal v-if="modalShown" :oll="oll" :coll="coll" :closeCallback="modalCloseCallback"/>
</template>

<style scoped>
</style>