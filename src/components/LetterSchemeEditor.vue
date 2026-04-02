<script setup>
import { computed } from "vue";
import { useLetterSchemeStore } from "@/stores/LetterSchemeStore";
import { useSettingsStore } from "@/stores/SettingsStore";

const ls = useLetterSchemeStore();
const settings = useSettingsStore();

// Each face: 3x3 grid. null = edge, string = sticker key for corner input, "label" = center
const faces = {
  U: { grid: ["UBL", null, "UBR", null, "label", null, "UFL", null, "UFR"] },
  L: { grid: ["LUB", null, "LUF", null, "label", null, "LDB", null, "LDF"] },
  F: { grid: ["FUL", null, "FUR", null, "label", null, "FDL", null, "FDR"] },
  R: { grid: ["RUF", null, "RUB", null, "label", null, "RDF", null, "RDB"] },
  B: { grid: ["BUR", null, "BUL", null, "label", null, "BDR", null, "BDL"] },
  D: { grid: ["DFL", null, "DFR", null, "label", null, "DBL", null, "DBR"] },
};

// Standard face colors (default orientation: U=white, F=green)
const BASE_COLORS = { U: "#ffffff", D: "#ffdd00", F: "#00aa44", B: "#0055bb", L: "#ff8800", R: "#cc0000" };

// How each rotation remaps faces: rotation -> { newFace: originalFace }
const ROTATION_MAP = {
  "":    { U:"U", D:"D", F:"F", B:"B", L:"L", R:"R" },
  "y":   { U:"U", D:"D", F:"R", B:"L", L:"F", R:"B" },
  "y'":  { U:"U", D:"D", F:"L", B:"R", L:"B", R:"F" },
  "y2":  { U:"U", D:"D", F:"B", B:"F", L:"R", R:"L" },
  "x":   { U:"F", D:"B", F:"D", B:"U", L:"L", R:"R" },
  "x'":  { U:"B", D:"F", F:"U", B:"D", L:"L", R:"R" },
  "x2":  { U:"D", D:"U", F:"B", B:"F", L:"L", R:"R" },
  "z":   { U:"L", D:"R", F:"F", B:"B", L:"D", R:"U" },
  "z'":  { U:"R", D:"L", F:"F", B:"B", L:"U", R:"D" },
  "z2":  { U:"D", D:"U", F:"F", B:"B", L:"R", R:"L" },
};

function applyRotation(map, rot) {
  // Apply a single rotation to a face mapping
  const rmap = ROTATION_MAP[rot];
  if (!rmap) return map;
  const result = {};
  for (const face of Object.keys(rmap)) {
    result[face] = map[rmap[face]];
  }
  return result;
}

const faceColors = computed(() => {
  const orient = (settings.store.cubeOrientation || "").trim();
  if (!orient) return BASE_COLORS;

  // Parse orientation into individual rotations (e.g., "x y" -> ["x", "y"])
  const rotations = orient.split(/\s+/).filter(Boolean);
  let mapping = { U:"U", D:"D", F:"F", B:"B", L:"L", R:"R" };
  for (const rot of rotations) {
    mapping = applyRotation(mapping, rot);
  }
  // mapping[face] = which original face is now at position 'face'
  const result = {};
  for (const face of Object.keys(BASE_COLORS)) {
    result[face] = BASE_COLORS[mapping[face]] || BASE_COLORS[face];
  }
  return result;
});

const faceStyle = (face) => ({
  borderColor: faceColors.value[face],
  borderWidth: '2px',
  borderStyle: 'solid',
  borderRadius: '4px',
  padding: '2px',
});

const centerStyle = (face) => ({
  backgroundColor: faceColors.value[face],
  borderRadius: '3px',
  color: face === 'D' || face === 'U' ? '#333' : '#fff',
});

const onReset = () => {
  ls.resetDefaults();
};
</script>

<template>
  <div class="letter-scheme-editor">
    <div class="cube-net">
      <!-- Top row: U face centered -->
      <div class="net-row">
        <div class="face-spacer"></div>
        <div class="face-grid">
          <div class="grid-3x3" :style="faceStyle('U')">
            <template v-for="(cell, idx) in faces.U.grid" :key="'U-'+idx">
              <input
                v-if="cell && cell !== 'label'"
                class="scheme-input"
                maxlength="2"
                v-model="ls.scheme[cell]"
                :title="cell"
              />
              <div v-else-if="cell === 'label'" class="grid-center" :style="centerStyle('U')">U</div>
              <div v-else class="grid-edge"></div>
            </template>
          </div>
        </div>
        <div class="face-spacer"></div>
        <div class="face-spacer"></div>
      </div>

      <!-- Middle row: L, F, R, B -->
      <div class="net-row">
        <div v-for="face in ['L', 'F', 'R', 'B']" :key="face" class="face-grid">
          <div class="grid-3x3" :style="faceStyle(face)">
            <template v-for="(cell, idx) in faces[face].grid" :key="face+'-'+idx">
              <input
                v-if="cell && cell !== 'label'"
                class="scheme-input"
                maxlength="2"
                v-model="ls.scheme[cell]"
                :title="cell"
              />
              <div v-else-if="cell === 'label'" class="grid-center" :style="centerStyle(face)">{{ face }}</div>
              <div v-else class="grid-edge"></div>
            </template>
          </div>
        </div>
      </div>

      <!-- Bottom row: D face centered -->
      <div class="net-row">
        <div class="face-spacer"></div>
        <div class="face-grid">
          <div class="grid-3x3" :style="faceStyle('D')">
            <template v-for="(cell, idx) in faces.D.grid" :key="'D-'+idx">
              <input
                v-if="cell && cell !== 'label'"
                class="scheme-input"
                maxlength="2"
                v-model="ls.scheme[cell]"
                :title="cell"
              />
              <div v-else-if="cell === 'label'" class="grid-center" :style="centerStyle('D')">D</div>
              <div v-else class="grid-edge"></div>
            </template>
          </div>
        </div>
        <div class="face-spacer"></div>
        <div class="face-spacer"></div>
      </div>
    </div>

    <button class="btn btn-sm btn-outline-secondary mt-2" @click="onReset">
      Reset to Speffz
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
  width: 92px;
  flex-shrink: 0;
}

.face-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
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
}

.grid-edge {
  background: var(--bs-secondary);
  opacity: 0.15;
  border-radius: 2px;
}
</style>
