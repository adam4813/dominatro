# Dominatro

A Balatro-like point-building game using dominoes, built with Three.js, TypeScript, and Vite.

## Game Concept

Dominatro is inspired by the roguelike deck-builder Balatro, but uses dominoes instead of playing cards. Players build combinations of dominoes to score points and progress through increasingly challenging levels.

**Note:** This is a prototype to validate the fun factor. If successful, a full-featured rewrite will follow.

## Features

- 🎮 3D domino rendering with realistic tile appearance
- 🎲 Standard domino pip patterns (0-6 on each half)
- 🖱️ Top-down camera view with zoom and pan controls
- 📱 Responsive canvas that adapts to viewport size
- ✨ Realistic lighting and shadows
- 📝 Full TypeScript support with strict typing

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Three.js** - 3D graphics library
- **Vite** - Fast build tool and dev server
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit formatting

## Setup Instructions

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/adam4813/dominatro.git
   cd dominatro
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Available Scripts

- **`npm run dev`** - Start the Vite development server with hot module replacement
- **`npm run build`** - Type-check and build the project for production (output to `dist/`)
- **`npm run preview`** - Preview the production build locally
- **`npm run typecheck`** - Run TypeScript type checking
- **`npm run format`** - Format all files with Prettier

## Project Structure

```
dominatro/
├── .github/
│   ├── copilot/
│   │   └── instructions.md   # AI assistant instructions
│   └── workflows/
│       └── deploy.yml        # GitHub Actions deployment workflow
├── .husky/
│   └── pre-commit            # Pre-commit hook for code formatting
├── docs/
│   └── DEVELOPMENT.md        # Development guide and architecture
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── game/
│   │   ├── Board.ts          # Game board management
│   │   ├── Domino.ts         # Domino tile class with 3D rendering
│   │   ├── GameState.ts      # Game state management
│   │   ├── HUD.ts            # Heads-up display
│   │   └── Scene.ts          # Three.js scene setup and rendering
│   ├── main.ts               # Application entry point
│   └── style.css             # Global styles
├── index.html                # HTML entry point
├── tsconfig.json             # TypeScript configuration
├── vite.config.js            # Vite configuration
├── package.json              # Project dependencies and scripts
├── .prettierrc               # Prettier configuration
└── .prettierignore           # Prettier ignore patterns
```

## Architecture

The game uses several design patterns for maintainability:

- **Flyweight** - Shared geometries/materials in `Domino.ts`
- **Facade** - `Scene.ts` simplifies Three.js complexity
- **Mediator** - `Board.ts` coordinates components
- **Observer** - Callback-based event handling

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed architecture documentation.

## Development

### Code Formatting

This project uses Prettier for consistent code formatting. Code is automatically formatted on commit using Husky pre-commit hooks with pretty-quick.

To manually format all files:

```bash
npm run format
```

### Camera Controls

The game uses a top-down camera view positioned at `(0, 15, 0)` looking down at the game board. This camera position should be maintained as the default initial view.

**Desktop:**

- **Right click + drag** (or **Middle click + drag**) - Pan the camera
- **Mouse wheel** - Zoom in/out

**Mobile/Touch:**

- **One finger drag** - Pan the camera
- **Two finger pinch** - Zoom in/out
- **Two finger drag** - Pan the camera

## Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The GitHub Actions workflow builds the project and deploys it using the GitHub Pages deployment action.

Visit the live demo at: `https://adam4813.github.io/dominatro/`

## License

ISC
