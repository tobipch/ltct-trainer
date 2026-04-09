import {defineStore} from 'pinia'
import {ref} from 'vue'
import {invertMove, moveFace, moveAmount} from '@/helpers/scramble_utils'
import {useDisplayStore} from '@/stores/DisplayStore'

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

    // Pending face turn: reactive so Scramble.vue can show orange state
    // { face: string, accumulated: number (quarter turns mod 4), moves: string[] }
    const pendingFaceTurn = ref(null)

    // Internal (not exposed)
    let cube = null
    let moveSubscription = null
    let infoSubscription = null
    let cubePattern = null
    let solvedPattern = null

    const connect = async () => {
        const display = useDisplayStore()
        try {
            if (!navigator.bluetooth) {
                display.showToast('Bluetooth is not supported in this browser', 'danger')
                return
            }
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
                display.showToast('Smart cube disconnected', 'info')
            })

            display.showToast('Connected to ' + deviceName.value, 'success')
        } catch (e) {
            console.error('Bluetooth connect failed:', e)
            cleanupConnection()
            if (e?.name === 'NotFoundError') {
                display.showToast('No smart cube found. Make sure your cube is on and nearby.', 'danger')
            } else {
                display.showToast('Failed to connect: ' + (e?.message || 'Unknown error'), 'danger')
            }
        }
    }

    const disconnect = () => {
        const display = useDisplayStore()
        if (keyboardListener) {
            disconnectKeyboard()
            display.showToast('Keyboard simulator disconnected', 'info')
            return
        }
        if (cube) {
            try { cube.commands.disconnect() } catch (_) {}
        }
        cleanupConnection()
        display.showToast('Smart cube disconnected', 'info')
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
        pendingFaceTurn.value = null
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
        pendingFaceTurn.value = null
        cubePattern = null
        solvedPattern = null
    }

    const advancePosition = () => {
        position.value++
        if (position.value >= scrambleMoves.value.length) {
            phase.value = 'solving'
        }
    }

    const onMove = (move) => {
        if (phase.value === 'scrambling') {
            // Priority 1: Pending face turn (accumulating quarter turns)
            if (pendingFaceTurn.value) {
                const pending = pendingFaceTurn.value
                const isCorrection = pending.target === 'correction'
                const expectedMove = isCorrection
                    ? correctionMoves.value[correctionMoves.value.length - 1]
                    : scrambleMoves.value[position.value]

                if (moveFace(move) === pending.face) {
                    const newAcc = (pending.accumulated + moveAmount(move)) % 4
                    if (newAcc === moveAmount(expectedMove)) {
                        // Accumulated amount matches expected — done!
                        pendingFaceTurn.value = null
                        if (isCorrection) {
                            correctionMoves.value.pop()
                        } else {
                            advancePosition()
                        }
                    } else if (newAcc === 0) {
                        // Cancelled out — reset as if nothing happened
                        pendingFaceTurn.value = null
                    } else {
                        // Still accumulating
                        pendingFaceTurn.value = {
                            ...pending,
                            accumulated: newAcc,
                            moves: [...pending.moves, move]
                        }
                    }
                } else {
                    // Different face — all pending moves become corrections
                    const pendingMoves = pending.moves
                    pendingFaceTurn.value = null
                    for (const m of pendingMoves) {
                        correctionMoves.value.push(invertMove(m))
                    }
                    onMove(move) // re-process new move
                }
                return
            }

            // Priority 2: Corrections
            if (correctionMoves.value.length > 0) {
                const expected = correctionMoves.value[correctionMoves.value.length - 1]
                if (move === expected) {
                    correctionMoves.value.pop()
                } else if (moveFace(move) === moveFace(expected)) {
                    // Same face, wrong direction — start pending for correction
                    pendingFaceTurn.value = {
                        face: moveFace(move),
                        accumulated: moveAmount(move),
                        moves: [move],
                        target: 'correction'
                    }
                } else {
                    correctionMoves.value.push(invertMove(move))
                }
                return
            }

            // Priority 3: Normal matching
            if (position.value < scrambleMoves.value.length) {
                const expected = scrambleMoves.value[position.value]
                if (move === expected) {
                    advancePosition()
                } else if (moveFace(move) === moveFace(expected)) {
                    // Right face, wrong amount/direction — start pending
                    pendingFaceTurn.value = {
                        face: moveFace(move),
                        accumulated: moveAmount(move),
                        moves: [move],
                        target: 'scramble'
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

    // Keyboard simulator for testing without a real cube
    let keyboardListener = null

    const connectKeyboard = () => {
        if (keyboardListener) return
        connected.value = true
        deviceName.value = 'Keyboard Simulator'
        battery.value = 100

        const keyMap = {
            'r': 'R', 'l': 'L', 'u': 'U', 'd': 'D', 'f': 'F', 'b': 'B',
            'R': "R'", 'L': "L'", 'U': "U'", 'D': "D'", 'F': "F'", 'B': "B'",
        }

        keyboardListener = (e) => {
            let move = null
            const lower = e.key.toLowerCase()
            if (e.ctrlKey && 'rludfb'.includes(lower)) {
                move = lower.toUpperCase() + '2'
            } else {
                move = keyMap[e.key]
            }
            if (move && (phase.value === 'scrambling' || phase.value === 'solving')) {
                e.preventDefault()
                e.stopPropagation()
                onMove(move)
            }
        }
        window.addEventListener('keydown', keyboardListener, true) // capture phase
        console.log(
            '%cKeyboard cube simulator active!',
            'color: #0d6efd; font-weight: bold',
            '\n  r/l/u/d/f/b = clockwise',
            '\n  R/L/U/D/F/B (shift) = prime',
            '\n  Ctrl+r/l/u/d/f/b = double (R2, L2, ...)',
            '\n  Disconnect: window.btSim.disconnect()'
        )
    }

    const disconnectKeyboard = () => {
        if (keyboardListener) {
            window.removeEventListener('keydown', keyboardListener, true)
            keyboardListener = null
        }
        connected.value = false
        deviceName.value = null
        battery.value = null
        resetTracking()
    }

    // Expose internals for btSim (set up after store return)
    const _getInternals = () => ({ connectKeyboard, disconnectKeyboard, onMove })

    return {
        connected, deviceName, battery,
        phase, scrambleMoves, position, correctionMoves, pendingFaceTurn,
        connect, disconnect, startTracking, resetTracking, _getInternals
    }
})

// Expose keyboard simulator on window at module load time (no store instantiation needed)
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'btSim', {
        get() {
            const store = useBluetoothCubeStore()
            const { connectKeyboard, disconnectKeyboard, onMove } = store._getInternals()
            return {
                connect: connectKeyboard,
                disconnect: disconnectKeyboard,
                move: (m) => onMove(m),
            }
        },
        configurable: true
    })
}
