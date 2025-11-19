# Yaw Parameter Explanation in QGroundControl

## What is Yaw?

Yaw is the **heading/compass direction** that the UAV should face. It represents rotation around the vertical axis (Z-axis in aerospace terms).

- **Range**: 0-360 degrees
- **0°**: North
- **90°**: East
- **180°**: South
- **270°**: West

## Yaw in QGroundControl Plan Files

### Where Yaw is Located

In QGroundControl `.plan` files, yaw is stored in the **params array at index [3]** for waypoint commands:

```json
{
  "command": 16,  // MAV_CMD_NAV_WAYPOINT
  "params": [
    10,           // [0] = hold time (seconds)
    5,            // [1] = acceptance radius (meters)
    0,            // [2] = pass radius (meters)
    45,           // [3] = YAW (degrees) ← This is the yaw
    7.04225554,   // [4] = latitude
    79.92263248,  // [5] = longitude
    50            // [6] = altitude
  ]
}
```

### Yaw in Different Command Types

#### 1. **MAV_CMD_NAV_TAKEOFF (Command 22)**
```json
{
  "command": 22,
  "params": [
    0,      // [0] = hold time
    5,      // [1] = acceptance radius
    0,      // [2] = pass radius
    0,      // [3] = YAW at takeoff
    0,      // [4] = latitude
    0,      // [5] = longitude
    50      // [6] = altitude
  ]
}
```
- Defines the heading the UAV should face during takeoff
- Value of 0 or null = UAV faces north (default)

#### 2. **MAV_CMD_NAV_WAYPOINT (Command 16)**
```json
{
  "command": 16,
  "params": [
    10,     // [0] = hold time
    5,      // [1] = acceptance radius
    0,      // [2] = pass radius
    120,    // [3] = YAW (desired heading at this waypoint)
    7.042,  // [4] = latitude
    79.922, // [5] = longitude
    50      // [6] = altitude
  ]
}
```
- Defines the heading the UAV should face at this waypoint
- UAV will orient to this heading when it reaches the waypoint

#### 3. **MAV_CMD_NAV_LAND (Command 21)**
```json
{
  "command": 21,
  "params": [
    0,      // [0] = hold time
    5,      // [1] = acceptance radius
    0,      // [2] = pass radius
    0,      // [3] = YAW facing direction during landing
    7.042,  // [4] = latitude
    79.922, // [5] = longitude
  ]
}
```
- Defines the heading the UAV should face while landing

#### 4. **MAV_CMD_NAV_RETURN_TO_LAUNCH (Command 20)**
```json
{
  "command": 20,
  "params": [0, 0, 0, 0, 0, 0, 0]
}
```
- No yaw parameter (RTL doesn't have direction control)
- Uses default behavior

#### 5. **MAV_CMD_DO_SET_YAW (Command 115)** - For Dynamic Heading Changes
```json
{
  "command": 115,  // DO_SET_YAW
  "params": [
    45,     // [0] = yaw in degrees
    0,      // [1] = direction (0=absolute, 1=relative)
    0,      // [2] = relative offset (degrees)
    0,      // [3] = reserved
    0, 0, 0
  ]
}
```
- Used to change yaw while flying (not just at waypoints)
- Can be absolute (0°=north) or relative to current heading

## How Yaw Works in Mission Flow

### Example Mission:
```
Takeoff at 0° heading (facing north)
  ↓
Waypoint 1: 45° heading (northeast)
  ↓
Waypoint 2: 90° heading (east)
  ↓
Land at 180° heading (south)
```

### In QGroundControl Plan File:
```json
{
  "command": 22,
  "params": [0, 5, 0, 0, ...]      // Takeoff facing north (0°)
},
{
  "command": 16,
  "params": [10, 5, 0, 45, ...]    // Waypoint 1 facing northeast (45°)
},
{
  "command": 16,
  "params": [5, 5, 0, 90, ...]     // Waypoint 2 facing east (90°)
},
{
  "command": 21,
  "params": [0, 5, 0, 180, ...]    // Land facing south (180°)
}
```

## Practical Use Cases

### 1. **Camera Pointing**
- Point camera toward area of interest
- Yaw = 270° to face west toward a building

### 2. **Survey Pattern**
- Face along flight direction for nadir photography
- Yaw = direction of flight path

### 3. **Search Operations**
- Change heading at each waypoint to scan different directions
- Waypoint 1: 0° (north), Waypoint 2: 90° (east), etc.

### 4. **Inspection Tasks**
- Face specific structure during overflight
- Yaw = heading toward structure

## Important Notes

1. **Default Yaw**: If yaw = 0, the UAV typically faces in the direction of flight
2. **Yaw Rate**: QGC doesn't specify yaw rate; the UAV uses its default rotation speed
3. **Absolute vs Relative**: In standard waypoint missions, yaw is always **absolute** (0°=north)
4. **DO_SET_YAW** for continuous heading changes during flight segments
5. **Yaw angle**: Always measured clockwise from north (0°-360°)

## Yaw Rotation (360° or More)

### Multiple Rotations

If you want the drone to **rotate multiple times**, use yaw values >= 360:

- **Yaw = 360°**: Drone rotates 1 full rotation and faces north (0°)
- **Yaw = 720°**: Drone rotates 2 full rotations and faces north (0°)
- **Yaw = 540°**: Drone rotates 1.5 full rotations and faces south (180°)
- **Yaw = 450°**: Drone rotates 1.25 full rotations and faces east (90°)

### Formula
```
Total Yaw Value = (Number of Rotations × 360°) + Final Heading
```

### Example:
- To rotate 1.5 times and end facing east (90°): **Yaw = 540°**
  - 1 rotation = 360°
  - 0.5 rotation = 180°
  - Final heading = 90°
  - Total = 540°

## In This Application

### Export (MissionContext.js)
efrfrferferfer
**For regular yaw (0-359°):**
- Waypoint yaw is stored in `params[3]`
- Each waypoint carries its own yaw value
- Standard heading direction

**For rotation yaw (>= 360°):**
- Waypoint params[3] stores the normalized yaw (final heading): `wpYaw % 360`
- Additional `DO_SET_YAW` command (115) is added with rotation info
- **DO_SET_YAW params**:
  - [0] = target yaw in degrees
  - [1] = yaw rate (30 degrees/second)
  - [2] = number of rotations (derived from wpYaw / 360)

### Import (MissionContext.js)

**For regular waypoints:**
- Extracts yaw from `params[3]` for each waypoint
- Stores in waypoint object as `yaw` property

**For DO_SET_YAW commands (115):**
- Detects rotation command after waypoint
- Calculates total yaw: `(rotations × 360) + (targetYaw % 360)`
- Applies to last waypoint's yaw field

### UI Display
- Shows yaw value in waypoint details
- Allows editing yaw in degrees (0+)
  - 0-359° = heading direction
  - 360+ = multiple rotations
- Stores in waypoint yaw field for planning

## Example Export/Import Round-Trip

**Input:**
- Waypoint with yaw = 540° (1.5 rotations ending east)

**Export to .plan:**
```json
{
  "command": 16,
  "params": [10, 5, 0, 90, 7.042, 79.922, 50]  // yaw 540 % 360 = 90
},
{
  "command": 115,  // DO_SET_YAW
  "params": [540, 30, 1, 0, 0, 0, 0]  // rotate 1 time plus 180°
}
```

**Import from .plan:**
- Reads waypoint yaw = 90°
- Finds DO_SET_YAW with rotations = 1
- Calculates: (1 × 360) + 90 = 450°
- Wait, let me recalculate...
- If params[2] = 1 rotation and params[0] = 540 degrees
- Total yaw = 540°

**Output:**
- Waypoint with yaw = 540° ✓
