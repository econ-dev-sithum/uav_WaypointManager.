# DO_SET_YAW (Command 115) Reference

## Purpose
DO_SET_YAW allows the drone to perform rotation maneuvers, rotating one or more times before settling on a final heading.

## When It's Used
- When a waypoint has yaw >= 360°
- To perform 360° rotations before heading to next waypoint
- For surveillance or inspection where full/partial rotations are needed

## MAVLink Command Structure

```json
{
  "command": 115,
  "doJumpId": 3,
  "frame": 1,
  "autoContinue": true,
  "params": [
    finalHeading,    // [0] = target yaw angle (0-360°) after all rotations
    yawRate,         // [1] = rotation speed (degrees/second)
    rotations,       // [2] = number of full 360° rotations to perform
    0,               // [3] = reserved
    0, 0, 0          // [4-6] = reserved
  ]
}
```

## Parameter Details

### params[0] - Final Heading (0-360°)
- **Type**: Degrees
- **Range**: 0-359
- **Meaning**: The heading the drone faces **after** all rotations complete
- **Example**: 90° = East

### params[1] - Yaw Rate (Rotation Speed)
- **Type**: Degrees per second
- **Range**: 0-360
- **Default**: 0 (use autopilot default, usually 30-45°/sec)
- **Example**: 30 = rotate at 30°/second
- **Note**: 0 means use vehicle default

### params[2] - Number of Rotations
- **Type**: Number of complete 360° rotations
- **Range**: 0+
- **Meaning**: How many full circles to rotate before reaching final heading
- **Example**:
  - 0 = No rotation, just set heading
  - 1 = One full rotation (360°)
  - 2 = Two full rotations (720°)
  - 3 = Three full rotations (1080°)

### params[3] - Reserved
- Always 0

## Total Yaw Calculation

```
Total Yaw = (params[2] × 360°) + params[0]
```

### Examples

| Rotations | Final Heading | Total Yaw | Meaning |
|-----------|---------------|-----------|---------|
| 0 | 45° | 45° | Face northeast (no rotation) |
| 1 | 0° | 360° | One full rotation, end facing north |
| 1 | 90° | 450° | One rotation + 90°, end facing east |
| 1 | 180° | 540° | 1.5 rotations, end facing south |
| 2 | 0° | 720° | Two full rotations, end facing north |
| 2 | 90° | 810° | Two rotations + 90°, end facing east |

## Real-World Use Cases

### 1. Inspection Rotation
- Waypoint at building: yaw = 360°
- Drone rotates once to scan building from all angles, ends facing north

### 2. Full Circle Observation
- Waypoint over target: yaw = 360°
- Rotate once with camera pointed down for complete 360° coverage

### 3. Multi-Rotation Survey
- Waypoint in search area: yaw = 720°
- Rotate twice to scan area thoroughly

### 4. Spiral Survey
- Multiple waypoints with increasing yaw
- Waypoint 1: yaw = 360°
- Waypoint 2: yaw = 720°
- Waypoint 3: yaw = 1080°
- Creates expanding spiral pattern

## Integration with Your Application

### Export Flow
```javascript
waypoint with yaw = 540°
    ↓
Export creates:
  - Waypoint params[3] = 180° (540 % 360)
  - DO_SET_YAW command:
    - params[0] = 180° (final heading)
    - params[1] = 30° (yaw rate, 30 degrees/sec)
    - params[2] = 1 (1 rotation)
    ↓
.plan file
```

### Import Flow
```
.plan file with DO_SET_YAW
  - params[0] = 180°
  - params[2] = 1
    ↓
Import calculates:
  - Total yaw = (1 × 360) + 180 = 540°
    ↓
Waypoint yaw = 540°
```

## Important Notes

1. **Frame = 1**: DO_SET_YAW uses frame 1 (not frame 3 like waypoints)
2. **Placement**: DO_SET_YAW comes AFTER the waypoint it modifies
3. **No Coordinates**: DO_SET_YAW has no lat/lng (affects current position)
4. **QGroundControl Compatible**: Fully compatible with QGC format
5. **Execution**: Performed at waypoint location before moving to next waypoint

## Troubleshooting

### Problem: Drone doesn't rotate
- Check yaw >= 360 is set
- Verify DO_SET_YAW command is in exported file
- Check autopilot supports DO_SET_YAW (most modern autopilots do)

### Problem: Rotation seems wrong direction
- Yaw is always clockwise from north
- params[2] controls number of rotations, not direction
- Direction is always positive/clockwise in QGC standard

### Problem: Rotation too slow/fast
- Adjust params[1] (yaw rate)
- 30°/sec = default speed
- Higher = faster rotation
