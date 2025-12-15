## applyTo: "\*\*"

# Dominatro - Copilot Instructions

## Project Context

Dominatro is a prototype game inspired by Balatro, using dominoes instead of playing cards. This is a fun-factor validation prototype - code quality matters but perfect polish is not required.

## Tech Stack

- **TypeScript** - Strict mode enabled
- **Three.js** - 3D rendering
- **Vite** - Build tool and dev server
- **No framework** - Vanilla TypeScript

## Code Guidelines

### Do

- Use TypeScript types from `src/types/index.ts`
- Follow existing patterns (Flyweight, Facade, Mediator, Observer)
- Split code into logical units in the `game/` directory
- Use descriptive variable and function names
- Add JSDoc comments for public methods

### Don't

- Add accessibility features (prototype phase)
- Over-engineer solutions
- Add external UI frameworks
- Create complex state management

## Architecture

```
Game (main.ts) - Orchestrator
├── Scene - Three.js facade
├── Board - Game logic mediator
│   ├── HUD - UI overlay
│   └── Domino[] - Visual tiles
└── GameState - Data management
```

## Key Patterns

- **Flyweight**: `Domino` shares static geometries/materials
- **Facade**: `Scene` simplifies Three.js
- **Mediator**: `Board` coordinates components
- **Observer**: Callbacks for scene interactions

## Type Locations

All types in `src/types/index.ts`:

- `DominoData` - Tile data
- `PlacementSide` - 'left' | 'right' | 'center'
- `RackDomino` - Visual + data binding
- `PlacementZone` - Placement indicators

## Common Tasks

### Add new game feature

1. Add types to `types/index.ts` if needed
2. Add logic to appropriate game class
3. Wire up in `main.ts` if UI interaction needed

### Modify domino appearance

Edit `Domino.ts` static materials/geometries

### Add HUD element

1. Create canvas in `HUD.createHUD()`
2. Add draw method
3. Add update method
4. Position in `calculatePositions()`

### Testing UI Changes

When testing visual changes with the dev server and Playwright:

1. Start dev server with `npm run dev`
2. Navigate to the page with Playwright
3. Take screenshots as needed
4. **Always stop the dev server** after taking screenshots to avoid getting stuck
5. Use `stop_bash` with the session ID or kill the process
