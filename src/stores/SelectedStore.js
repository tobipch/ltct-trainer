import {computed, reactive, watch} from 'vue'
import { defineStore } from 'pinia'
import ltct_map from "@/assets/ltct_map.json"

const localStoreKey = "currentLtctArray";
const loadedArray = JSON.parse(localStorage.getItem(localStoreKey) || "[]")

// Speffz sticker order for sorting cases
const SPEFFZ_ORDER = [
  "UBL", "UBR", "UFR", "UFL",
  "LUB", "LUF", "LDF", "LDB",
  "FUL", "FUR", "FDR", "FDL",
  "RUF", "RUB", "RDB", "RDF",
  "BUR", "BUL", "BDL", "BDR",
  "DFL", "DFR", "DBR", "DBL",
]
const speffzIndex = Object.fromEntries(SPEFFZ_ORDER.map((s, i) => [s, i]))

function compareKeys(a, b) {
  const [gA, tA, wA] = a.split(' ')
  const [gB, tB, wB] = b.split(' ')
  if (gA !== gB) return gA < gB ? -1 : 1
  const ti = (speffzIndex[tA] ?? 99) - (speffzIndex[tB] ?? 99)
  if (ti !== 0) return ti
  return (speffzIndex[wA] ?? 99) - (speffzIndex[wB] ?? 99)
}

export const useSelectedStore = defineStore('selected', () => {
  const allZbllKeysArray = Object.keys(ltct_map).sort(compareKeys)

  const store = reactive({
    keys: loadedArray,
  });

  const commonScrambleLength = computed(() => {
    let result = 0
    store.keys.forEach(key => {
      const scrambleKeys = Object.keys(ltct_map[key].scrambles)
      if (scrambleKeys.length === 0) return
      const minLength = parseInt(scrambleKeys[0])
      result = Math.max(result, minLength)
    })
    return result
  })

  const applyFromPreset = presetKeysSet => store.keys = [...presetKeysSet]

  const removeOll = oll => {
    store.keys = store.keys.filter(key => !key.startsWith(`${oll} `))
  }

  // this may lead to duplicate store.keys, use with caution
  const addOll = oll => {
    store.keys = [...store.keys, ...allZbllKeysArray.filter(key => key.startsWith(`${oll} `))]
  }

  // this may lead to duplicate store.keys, use with caution
  const addColl = (oll, coll) => {
    store.keys = [...store.keys, ...allZbllKeysArray.filter(key => key.startsWith(`${oll} ${coll} `))]
  }

  const addZbll = key => {
    store.keys = [...store.keys, key] // if you just .push(), then freakin' VueJS won't track it
  }

  // remove all coll cases
  const removeColl = (oll, coll) => {
    store.keys = store.keys.filter(key => !key.startsWith(`${oll} ${coll} `))
  }

  const removeZbll = key => store.keys = store.keys.filter(k => k !== key)

  const isZbllSelected = key => store.keys.includes(key)

  const numZbllsInCollSelected = (oll, coll) => store.keys.filter(key => key.startsWith(`${oll} ${coll} `)).length

  const numZbllsInOllSelected = (oll) => store.keys.filter(key => key.startsWith(`${oll} `)).length

  const totalZbllsSelected = () => store.keys.length

  const toggleSelected = result => {
    if (!result) return
    const action = isZbllSelected(result.oll, result.coll, result.zbll) ? removeZbll : addZbll
    action(result.oll, result.coll, result.zbll)
  }

  watch(() => store.keys, () => {
    localStorage.setItem(localStoreKey, JSON.stringify(store.keys))
  })

  return {store, commonScrambleLength, allZbllKeysArray, addOll, addColl, addZbll,
    removeOll, removeColl, removeZbll, toggleSelected,
    isZbllSelected, numZbllsInCollSelected, numZbllsInOllSelected, totalZbllsSelected, applyFromPreset}
});