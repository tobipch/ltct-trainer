import {defineStore} from 'pinia'
import {ref, shallowRef} from 'vue'
import {invertMove} from '@/helpers/scramble_utils'

let kpuzzlePromise = null
async function getKPuzzle() {
    if (!kpuzzlePromise) {
        kpuzzlePromise = import('cubing/puzzles').then(m => m.puzzles['3x3x3'].kpuzzle())
    }
    return kpuzzlePromise
}

export const useBluetoothCubeStore = defineStore('bluetoothCube', () => {
    const connected = ref(false)
    const deviceName = ref(null)
    const battery = ref(null)

    // Scramble tracking
    const phase = ref('idle') // 'idle' | 'scrambling' | 'solving'
    const scrambleMoves = ref([])
    const position = ref(0)
    const correctionMoves = ref([])

    // Internal (not exposed)
    let cube = null
    let moveSubscription = null
    let infoSubscription = null
    let cubePattern = null
    let solvedPattern = null

    const connect = async () => {
        try {
            const {connectSmartCube} = await import('btcube-web')
            cube = await connectSmartCube()
            connected.value = true
            deviceName.value = cube.device?.name || 'Smart Cube'

            // Listen for moves
            moveSubscription = cube.events.moves.subscribe(event => {
                onMove(event.move)
            })

            // Listen for battery/info
            infoSubscription = cube.events.info.subscribe(event => {
                if ('battery' in event) {
                    battery.value = event.battery
                }
            })

            // Handle disconnect
            cube.device?.addEventListener('gattserverdisconnected', () => {
                cleanupConnection()
            })
        } catch (e) {
            console.error('Bluetooth connect failed:', e)
            cleanupConnection()
        }
    }

    const disconnect = () => {
        if (cube) {
            try { cube.commands.disconnect() } catch (_) {}
        }
        cleanupConnection()
    }

    const cleanupConnection = () => {
        if (moveSubscription) { moveSubscription.unsubscribe(); moveSubscription = null }
        if (infoSubscription) { infoSubscription.unsubscribe(); infoSubscription = null }
        cube = null
        connected.value = false
        deviceName.value = null
        battery.value = null
        resetTracking()
    }

    const startTracking = async (scrambleString) => {
        if (!scrambleString) return
        scrambleMoves.value = scrambleString.split(' ').filter(m => m.length > 0)
        position.value = 0
        correctionMoves.value = []
        phase.value = 'scrambling'

        // Prepare solved pattern for later solved detection
        const kpuzzle = await getKPuzzle()
        solvedPattern = kpuzzle.defaultPattern()
        cubePattern = solvedPattern.applyAlg(scrambleString)
    }

    const resetTracking = () => {
        phase.value = 'idle'
        scrambleMoves.value = []
        position.value = 0
        correctionMoves.value = []
        cubePattern = null
        solvedPattern = null
    }

    const onMove = (move) => {
        if (phase.value === 'scrambling') {
            if (correctionMoves.value.length > 0) {
                const expected = correctionMoves.value[correctionMoves.value.length - 1]
                if (move === expected) {
                    correctionMoves.value.pop()
                } else {
                    correctionMoves.value.push(invertMove(move))
                }
            } else {
                if (position.value < scrambleMoves.value.length && move === scrambleMoves.value[position.value]) {
                    position.value++
                    if (position.value >= scrambleMoves.value.length) {
                        phase.value = 'solving'
                    }
                } else {
                    correctionMoves.value.push(invertMove(move))
                }
            }
        } else if (phase.value === 'solving') {
            // Apply move to track cube state
            if (cubePattern && solvedPattern) {
                try {
                    cubePattern = cubePattern.applyMove(move)
                    if (cubePattern.isIdentical(solvedPattern)) {
                        phase.value = 'idle'
                    }
                } catch (e) {
                    console.warn('Move apply error:', e)
                }
            }
        }
    }

    return {
        connected, deviceName, battery,
        phase, scrambleMoves, position, correctionMoves,
        connect, disconnect, startTracking, resetTracking
    }
})
