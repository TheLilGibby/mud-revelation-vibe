# Revelation World Map - React Edition

A modern React-based interactive world map viewer for the Revelation game.

## Features

- 🗺️ **Interactive SVG Map** - Smooth zoom and pan controls
- 🎮 **90s Retro Aesthetic** - Classic gaming UI with VT323 and Press Start 2P fonts
- 🔍 **Real-time Search** - Filter locations by name or type
- 📊 **Live Statistics** - Track regions, locations, and selection
- 🎨 **Color-coded Regions** - Each region has its own distinct color
- ⌨️ **Keyboard Shortcuts** - Quick navigation with +/- for zoom, 0 to reset, Esc to close
- 📍 **Location Details** - Click any location to view detailed information

## Project Structure

```
src/
├── components/
│   ├── Header.js          # Header component with title
│   ├── Sidebar.js         # Sidebar with search and region list
│   ├── WorldMap.js        # Main SVG map component
│   └── InfoPanel.js       # Location information panel
├── worldMapData.js        # Game world data (regions, locations)
├── App.js                 # Main application component
├── App.css                # Main stylesheet
├── index.js               # React entry point
└── index.css              # Global styles

public/
└── index.html             # HTML template
```

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

Create an optimized production build:
```bash
npm build
```

The build will be created in the `build/` directory.

## Usage

### Navigation
- **Zoom In**: Click "Zoom In +" button or press `+`
- **Zoom Out**: Click "Zoom Out -" button or press `-`
- **Reset View**: Click "Reset View" button or press `0`
- **Close Info**: Press `Esc`

### Features
- Click on any region title to expand/collapse location list
- Click on locations in sidebar or map to view details
- Use search box to filter locations by name or type
- Hover over markers for visual feedback

## Technical Details

- **React**: ^18.2.0
- **React Scripts**: 5.0.1
- **ES6 Modules**: Modern JavaScript
- **SVG Graphics**: Scalable vector graphics for map rendering
- **CSS3**: Modern styling with animations

## Location Types

- 🏙️ **Cities**: Large circular markers
- 🏰 **Dungeons/Lairs**: Square markers
- ✨ **Ethereal**: Star-shaped markers
- 🏞️ **Others**: Standard circular markers

## Color Scheme

The map uses a retro terminal color scheme:
- Primary: `#00ff00` (Matrix green)
- Secondary: `#ffff00` (Yellow highlights)
- Background: `#2a2a2a` (Dark gray)
- Borders: Various shades of green and gray

## Data Source

Location data is extracted from `GameData/Mobs.json` and includes:
- 14 distinct regions
- 80+ unique locations
- Mob counts per location
- Location types and coordinates

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Part of the Revelation Game Library project.

## Version

2.0.0 - React Edition

