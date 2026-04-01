import {reactive, watch} from 'vue'
import {defineStore} from 'pinia'

const defaultScheme = {
    UBL: "A", UBR: "B", UFR: "C", UFL: "D",
    LUB: "E", LUF: "F", LDF: "G", LDB: "H",
    FUL: "I", FUR: "J", FDR: "K", FDL: "L",
    RUF: "M", RUB: "N", RDB: "O", RDF: "P",
    BUR: "Q", BUL: "R", BDL: "S", BDR: "T",
    DFL: "U", DFR: "V", DBR: "W", DBL: "X",
}

const localStorageKey = "ltctLetterScheme"

export const useLetterSchemeStore = defineStore('letterScheme', () => {
    const scheme = reactive(
        JSON.parse(localStorage.getItem(localStorageKey)) || {...defaultScheme}
    )

    const toLetter = (piece) => scheme[piece] || piece

    const resetDefaults = () => {
        for (let key in defaultScheme) {
            scheme[key] = defaultScheme[key]
        }
    }

    watch(() => scheme, () => {
        localStorage.setItem(localStorageKey, JSON.stringify(scheme))
    }, {deep: true})

    return { scheme, toLetter, resetDefaults }
})
