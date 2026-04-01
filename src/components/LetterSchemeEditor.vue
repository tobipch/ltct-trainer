<script setup>
import { useLetterSchemeStore } from "@/stores/LetterSchemeStore";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const ls = useLetterSchemeStore();

// Each face: 3x3 grid. null = edge (empty), string = sticker key for corner input, "label" = center label
const faces = {
  U: { label: "U", grid: ["UBL", null, "UBR", null, "label", null, "UFL", null, "UFR"] },
  L: { label: "L", grid: ["LUB", null, "LUF", null, "label", null, "LDB", null, "LDF"] },
  F: { label: "F", grid: ["FUL", null, "FUR", null, "label", null, "FDL", null, "FDR"] },
  R: { label: "R", grid: ["RUF", null, "RUB", null, "label", null, "RDF", null, "RDB"] },
  B: { label: "B", grid: ["BUR", null, "BUL", null, "label", null, "BDR", null, "BDL"] },
  D: { label: "D", grid: ["DFL", null, "DFR", null, "label", null, "DBL", null, "DBR"] },
};

const faceOrder = ["U", "L", "F", "R", "B", "D"];

const onReset = () => {
  if (confirm(t("settings.reset_confirm"))) {
    ls.resetDefaults();
  }
};
</script>

<template>
  <div class="letter-scheme-editor">
    <div class="cube-net">
      <!-- Top row: U face centered -->
      <div class="net-row top-row">
        <div class="face-spacer"></div>
        <div class="face-grid">
          <div class="face-label-top">U</div>
          <div class="grid-3x3">
            <template v-for="(cell, idx) in faces.U.grid" :key="'U-'+idx">
              <input
                v-if="cell && cell !== 'label'"
                class="scheme-input"
                maxlength="2"
                v-model="ls.scheme[cell]"
                :title="cell"
              />
              <div v-else-if="cell === 'label'" class="grid-center">U</div>
              <div v-else class="grid-edge"></div>
            </template>
          </div>
        </div>
        <div class="face-spacer"></div>
        <div class="face-spacer"></div>
      </div>

      <!-- Middle row: L, F, R, B -->
      <div class="net-row middle-row">
        <div v-for="face in ['L', 'F', 'R', 'B']" :key="face" class="face-grid">
          <div class="face-label-top">{{ face }}</div>
          <div class="grid-3x3">
            <template v-for="(cell, idx) in faces[face].grid" :key="face+'-'+idx">
              <input
                v-if="cell && cell !== 'label'"
                class="scheme-input"
                maxlength="2"
                v-model="ls.scheme[cell]"
                :title="cell"
              />
              <div v-else-if="cell === 'label'" class="grid-center">{{ face }}</div>
              <div v-else class="grid-edge"></div>
            </template>
          </div>
        </div>
      </div>

      <!-- Bottom row: D face centered -->
      <div class="net-row bottom-row">
        <div class="face-spacer"></div>
        <div class="face-grid">
          <div class="face-label-top">D</div>
          <div class="grid-3x3">
            <template v-for="(cell, idx) in faces.D.grid" :key="'D-'+idx">
              <input
                v-if="cell && cell !== 'label'"
                class="scheme-input"
                maxlength="2"
                v-model="ls.scheme[cell]"
                :title="cell"
              />
              <div v-else-if="cell === 'label'" class="grid-center">D</div>
              <div v-else class="grid-edge"></div>
            </template>
          </div>
        </div>
        <div class="face-spacer"></div>
        <div class="face-spacer"></div>
      </div>
    </div>

    <button class="btn btn-sm btn-outline-secondary mt-2" @click="onReset">
      {{ $t("settings.reset") }} (Speffz)
    </button>
  </div>
</template>

<style scoped>
.cube-net {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.net-row {
  display: flex;
  gap: 2px;
}

.face-spacer {
  width: 90px;
  flex-shrink: 0;
}

.face-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.face-label-top {
  font-size: 0.7rem;
  opacity: 0.5;
  margin-bottom: 1px;
}

.grid-3x3 {
  display: grid;
  grid-template-columns: repeat(3, 28px);
  grid-template-rows: repeat(3, 28px);
  gap: 1px;
}

.scheme-input {
  width: 28px;
  height: 28px;
  text-align: center;
  font-weight: bold;
  font-size: 0.85rem;
  padding: 0;
  border: 1px solid var(--bs-secondary);
  border-radius: 3px;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.scheme-input:focus {
  outline: 2px solid var(--bs-primary);
  outline-offset: -1px;
}

.grid-center {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.75rem;
  opacity: 0.4;
}

.grid-edge {
  background: var(--bs-secondary);
  opacity: 0.15;
  border-radius: 2px;
}
</style>
