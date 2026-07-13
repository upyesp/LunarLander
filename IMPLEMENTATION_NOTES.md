# Lunar Lander - Implementation Notes

## Engineering Decisions (Phase 1)

### Physics Model
- **Gravity**: 0.15–0.25 units/frame² (scales with level difficulty)
- **Thrust**: 0.35 units/frame in direction of rotation
- **Rotation**: ±2°/frame angular velocity with 0.95 damping factor
- **Wind**: Added in levels 7+ for lateral drift (±0.6 units/frame²)
- **Sub-stepping**: Applied when velocity > 5 units/frame to prevent terrain tunneling

### Touch Control Architecture
- Three-button layout: ROTATE LEFT | THRUST | ROTATE RIGHT
- `touch-action: none` on all touch targets prevents browser gestures
- `preventDefault()` on touch events blocks scrolling without blocking game input
- State-based input (no event queuing) ensures responsive controls

### Level Data Structure
```javascript
{
  terrain: [[x,y], ...],      // Polygon defining ground surface
  padStart: [x, y],           // Left edge of landing pad
  padWidth: number,           // Pad length in pixels
  startX/startY: number,      // Initial lander position
  velocityX/velocityY: number, // Initial drift velocity
  fuel: number,               // Starting fuel (0–100)
  gravity: number,            // Level-specific gravity multiplier
  wind?: number               // Optional lateral wind force
}
```

### Scoring Algorithm
- `TimeBonus = max(1000 - timeElapsed × 2, 100)` — rewards speed with floor of 100
- `FuelMultiplier = remainingFuel / startingFuel` — ratio of fuel left (0–1)
- `FinalScore = floor(TimeBonus × FuelMultiplier)`

### LocalStorage Schema
```javascript
{
  "lunarLander": {
    "unlockedLevel": <int>,     // Highest accessible level (1-indexed)
    "bestScores": {             // Per-level best scores
      "1": 5000,
      ...
    },
    "completedLevels": [        // Array of completed level numbers
      1, 2, ...
    ]
  }
}
```
All reads/writes wrapped in try/catch for quota errors and corrupted data.

### Difficulty Scaling
| Levels | Terrain   | Pad Width | Wind | Gravity |
|--------|-----------|-----------|------|---------|
| 1–3    | Gentle    | 70–100px  | None | 0.15–0.17 |
| 4–6    | Moderate  | 60–80px   | None | 0.18–0.20 |
| 7–9    | Complex   | 50–70px   | ±0.3–0.5 | 0.21–0.23 |
| 10     | Extreme   | 45px      | ±0.6 | 0.25    |

## How to Run

Just open `index.html` in any modern mobile browser (iOS Safari, Android Chrome). No build step or server required — it's a single self-contained HTML file.
