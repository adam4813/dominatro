# Dominatro Development Guide

## Architecture Overview

Dominatro follows a component-based architecture with clear separation of concerns. The codebase uses several Gang of Four design patterns to maintain clean, maintainable code.

### Design Patterns Used

#### Flyweight Pattern (`Domino.ts`)

The `Domino` class uses static shared geometries and materials to minimize memory usage when rendering multiple domino tiles. All domino instances share the same Three.js geometry and material objects.

```typescript
// Shared resources
static bodyGeometry = new THREE.BoxGeometry(1, 0.2, 2);
static bodyMaterial = new THREE.MeshStandardMaterial({...});
```

#### Facade Pattern (`Scene.ts`)

The `Scene` class acts as a simplified interface to the complex Three.js subsystem, hiding the complexity of renderer setup, camera configuration, lighting, and controls.

#### Mediator Pattern (`Board.ts`)

The `Board` class mediates between the visual dominoes, game state, and HUD, coordinating their interactions without them needing direct references to each other.

#### Observer Pattern (Callbacks)

The scene uses callback functions to notify the game controller of user interactions (domino selection, placement) without tight coupling.

### Project Structure

```
src/
├── types/
│   └── index.ts        # TypeScript interfaces and types
├── game/
│   ├── Board.ts        # Board management and game logic
│   ├── Domino.ts       # 3D domino rendering
│   ├── GameState.ts    # Game state management
│   ├── HUD.ts          # Heads-up display
│   └── Scene.ts        # Three.js scene management
├── main.ts             # Application entry point
└── style.css           # Global styles
```

## Key Components

### GameState

Manages all game data:

- Bone pile (shuffled domino set)
- Player rack (hand)
- Score tracking
- Pull/round progression

### Scene

Handles all Three.js rendering:

- Camera and controls
- Lighting setup
- Raycasting for mouse interaction
- Placement zone visualization

### Board

Connects game logic with visualization:

- Domino chain management
- Placement validation
- Visual board rendering
- HUD updates

### HUD

Canvas-based overlay rendering:

- Score display
- Progression tracking
- Bone pile count
- Player hand visualization

## Type System

All game types are centralized in `src/types/index.ts`:

- `DominoData` - Domino tile data structure
- `PlacementSide` - Valid placement positions
- `RackDomino` - Rack domino with visual/data binding
- `PlacementZone` - Board placement indicator
- Callback types for scene interactions

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Type-check and build for production
npm run typecheck  # Run TypeScript type checking
npm run format     # Format code with Prettier
```

## Extending the Game

### Adding New Domino Types

1. Extend `DominoType` in `types/index.ts`
2. Add generation logic in `GameState.initializeBonePile()`
3. Update `Domino.ts` if visual changes are needed

### Adding Scoring Rules

1. Create scoring logic in a new `Scoring.ts` module
2. Call from `Board.placeDomino()` after successful placement
3. Update HUD via `Board.addScore()`

### Adding New HUD Elements

1. Add canvas creation in `HUD.createHUD()`
2. Add draw method (e.g., `drawNewPanel()`)
3. Add update method for dynamic updates
4. Position sprite in `calculatePositions()`
