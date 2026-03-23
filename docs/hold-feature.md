# Hold Feature Implementation

## Overview

The hold feature allows players to strategically keep high-scoring dominoes in their rack while discarding the rest. Players can use this at any time during gameplay, subject to pull availability and hold limits. This adds a risk-reward element to the game.

## How It Works

### Restrictions

- **Pull requirement**: Hold & Discard consumes one pull from your pull counter
- **No pulls remaining**: Button becomes disabled (grayed out, 50% opacity) when pulls are exhausted
- **Max hold limit**: Players can hold a maximum of 2 tiles by default (configurable)
- **Visual feedback**: Button shows "No pulls remaining" tooltip when disabled
- **Hold counter**: Shows "Holding: X/Y" during hold mode (e.g., "Holding: 1/2")

### Hold Mode

1. **Activation**: Click the "Hold & Discard" button (appears at bottom center)
2. **Selection**: Click on dominoes in your rack to toggle their held status
   - Held dominoes visually move upward by 0.5 units
   - Click again to un-hold a domino
   - **Maximum 2 tiles can be held** (by default)
   - Counter displays "Holding: X/2" above the button
   - Counter turns red when at maximum capacity
   - Cannot select more tiles once at the limit
3. **Confirmation**: Click "Confirm Discard" to execute the action
   - Held tiles remain in the rack
   - All unheld tiles are discarded
   - New tiles are drawn from the bone pile to fill the rack up to the limit (7 tiles)
   - Pull counter decrements by 1
   - Bone pile count updates
   - Button returns to normal state

### Visual Feedback

- **Hold & Discard button**: Red background (#ff6b6b) when entering hold mode
- **Confirm Discard button**: Teal background (#4ecdc4) when confirming
- **Held tiles**: Raised vertically by 0.5 units above normal rack position
- **Button position**: Bottom center of screen, always visible
- **Hold counter**: Shows "Holding: X/Y" in white text, turns red when at max capacity
- **Counter position**: Just above the button (70px from bottom)

## Implementation Details

### Files Modified

#### `src/types/index.ts`

- Added `isHeld?: boolean` property to `RackDomino` interface

#### `src/game/GameState.ts`

- Added `rackLimit: number = 7` property to track maximum rack size
- Added `maxHoldCount: number = 2` property to track maximum tiles that can be held
- Added `getRackLimit()` getter method
- Added `getMaxHoldCount()` getter method
- Added `increaseMaxHoldCount(amount: number)` method to increase hold limit
- Added `discardUnheldTiles(heldTiles: DominoData[]): number` method
  - Filters the player rack to keep only held tiles
  - Returns the count of discarded tiles
  - Logs the operation for debugging

#### `src/main.ts`

- Added `RACK_HELD_Y_OFFSET = 0.5` constant for visual feedback
- Added `holdModeActive: boolean` flag to track hold mode state
- Added `holdButton: HTMLButtonElement` for UI control
- Added `holdCountDisplay: HTMLDivElement` for showing hold count
- Added methods:
  - `createHoldButton()`: Creates and styles the button, sets up initial state
  - `createHoldCountDisplay()`: Creates the hold counter display
  - `updateHoldCountDisplay()`: Updates counter text and color based on current/max hold
  - `updateHoldButtonState()`: Disables button when no pulls remain
  - `toggleHoldMode()`: Checks pull availability, shows/hides counter, switches between hold mode and confirm mode
  - `executeHoldAndDiscard()`: Performs the discard operation and pulls new tiles, hides counter
  - `pullTilesToRack()`: Draws tiles from bone pile to fill rack, decrements pull counter
  - `toggleDominoHeld()`: Enforces max hold limit, toggles held status and raises/lowers tiles, updates counter
- Modified `handleDominoSelected()`: Routes to hold toggle when in hold mode
- Modified `executeHoldAndDiscard()`: Updates button state and hides counter after completing pull
- Added `testIncreaseMaxHold(amount)`: Test helper to increase max hold count

## Game Flow

### Complete Hold & Discard Sequence

1. Player clicks "Hold & Discard" button
2. Button changes to "Confirm Discard" (teal color)
3. Player clicks tiles to mark as held (they rise up)
4. Player clicks "Confirm Discard" button
5. Unheld tiles are removed from rack and game state
6. New tiles are automatically drawn from bone pile to fill rack (up to 7 tiles)
7. Pull counter decrements by 1
8. Bone pile count updates in HUD
9. Button returns to "Hold & Discard" (red color)
10. Normal gameplay resumes

### Edge Cases Handled

- **Bone pile empty**: No new tiles drawn, but pull counter STILL decrements (you've used your pull)
- **Rack already full**: No pull used, function returns early (shouldn't happen in normal flow)
- **No tiles held**: Entire rack discarded, new tiles drawn to fill rack, pull decrements
- **All tiles held**: No discard, no new draw, pull counter NOT decremented, hold mode exits, counter hides
- **No pulls remaining**: Button disabled, cannot enter hold mode, tooltip shows "No pulls remaining"
- **At max hold limit**: Cannot select additional tiles, console logs warning
- **Try to hold more than max**: Click is ignored, existing held tiles remain

### Risk vs Reward

- **Holding tiles**: Keep high-scoring dominoes for future plays
- **Risk**: The bone pile is finite - you might never be able to play held tiles
- **Larger bone pile**: More opportunities to draw tiles that work with held dominoes
- **Pull limit**: Limited number of pulls per game adds tension

### When to Use Hold & Discard

- **Stuck with no plays**: When no tiles can be placed, hold your best tiles
- **Strategic refresh**: Discard low-value tiles to draw fresh ones
- **Waiting for matches**: Hold tiles that need specific partners
- **High pip count tiles**: Keep 5-5, 6-6, etc. for maximum points
- **Special tiles**: Keep wild, crusher, etc. for versatility

### Strategy Tips

- Don't hold too many tiles - you need room to draw new ones
- Consider the bone pile size - can you still draw what you need?
- Balance holding high-value tiles vs. playability
- Use early in the game when the bone pile is large
- Risky late game when few tiles remain to draw

## Testing

To test the hold feature:

1. Start the dev server: `npm run dev`
2. The "Hold & Discard" button is visible at the bottom center
3. Click it to enter hold mode (button changes to "Confirm Discard")
4. Counter appears showing "Holding: 0/2"
5. Click tiles in your rack to mark them as held (they rise up)
6. Try to hold more than 2 tiles (should be blocked with console message)
7. Counter shows current count and turns red at limit
8. Click "Confirm Discard" to discard unheld tiles
9. Button returns to normal state, counter disappears

### Testing Max Hold Increase

Open browser console and use the debug object:

```javascript
// Increase max hold count by 1
window.__GAME_DEBUG__.gameInstance.testIncreaseMaxHold(1);

// Now you can hold 3 tiles
// Increase by 2 more
window.__GAME_DEBUG__.gameInstance.testIncreaseMaxHold(2);

// Now you can hold 5 tiles
```

## Future Enhancements

### Special Tile: Hold Expander

A passive/consumable tile that increases the max hold count:

- **Name**: "Hold Expander" or "Rack Extension"
- **Effect**: Increases max hold count by 1 (or 2)
- **Usage**: Purchased from passive pool or earned through gameplay
- **Implementation**: Call `gameState.increaseMaxHoldCount(1)` when tile is used
- **Visual**: Update hold counter to reflect new limit
- **Strategy**: Allows players to hold more high-value tiles for longer

### Other Potential Improvements:

- Visual indicator showing which tiles can be played (highlight valid tiles)
- Tooltip explaining the hold feature on first encounter
- Animation when discarding tiles (fade out, scatter effect)
- Statistics tracking hold success rate
- Sound effects for hold/discard actions
- Persistent max hold count across game sessions
- Achievement for holding specific tile combinations
