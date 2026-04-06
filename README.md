# LTCT Trainer

Fork of [Roman Strakhov's ZBLL Trainer](https://github.com/Roman-/zbll), adapted for LTCT with permission from the original author. Algorithm data sourced from [blddb](https://github.com/nbwzx/blddb).

A timer-based tool for practicing **LTCT (Last Target Corner Twist)** algorithms — a subset of BLD (blindfolded) solving with 252 cases.

## Features

- 252 LTCT cases with pre-generated scrambles
- Interactive 3D cube visualization (touch/drag to rotate)
- Customizable letter scheme (Speffz default)
- Cube orientation setting
- Timer with stats tracking
- Presets for organizing practice sessions
- Multiple themes and languages

## Development

```bash
npm install
npm run dev
```

To regenerate scrambles:

```bash
node scripts/generate_scrambles.mjs
node scripts/verify_scrambles.mjs
```
