# Revelation Game Library

A modern React-based interactive game library and wiki for the Revelation MUD, featuring a comprehensive database of items, mobs, quests, guides, and an interactive world map.

## ✨ Features

- 🗺️ **Interactive World Map** - Explore zones with detailed room layouts and navigation
- ⚔️ **Items Database** - Browse and search thousands of game items
- 🐉 **Mobs Encyclopedia** - Complete mob database with pixel art sprites
- 📜 **Quests Guide** - Comprehensive quest information and requirements
- 📖 **Player Guides** - Community-contributed guides and strategies
- 🎮 **90s Retro Aesthetic** - Classic MUD-inspired UI with terminal styling
- 🔍 **Real-time Search** - Fast filtering across all data types
- ⌨️ **Keyboard Navigation** - Quick controls with keyboard shortcuts

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Installation & Setup

1. **Clone the repository** (or download the project)
```bash
cd RevelationGameLibrary_v1.1_Client
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

The app will automatically open at [http://localhost:3000](http://localhost:3000)

### 🎯 That's it! You're ready to explore Revelation!

**Note:** Game data files are already included in the `public/GameData/` folder, so no additional setup is required.

## 📁 Project Structure

```
RevelationGameLibrary_v1.1_Client/
├── src/
│   ├── components/         # React components
│   │   ├── Header.js       # Navigation header
│   │   ├── DetailedMapView.js  # Interactive map viewer
│   │   ├── WikiSidebar.js  # Data display sidebar
│   │   ├── MobSprite.js    # Mob sprite renderer
│   │   └── ...
│   ├── pages/              # Main page components
│   │   ├── MapPage.js      # World map page
│   │   ├── ItemsPage.js    # Items database
│   │   ├── MobsPage.js     # Mobs encyclopedia
│   │   ├── QuestsPage.js   # Quests guide
│   │   └── GuidesPage.js   # Community guides
│   ├── contexts/           # React contexts
│   │   └── DataContext.js  # Global data provider
│   ├── utils/              # Utility functions
│   ├── App.js              # Main app component
│   └── index.js            # App entry point
├── public/
│   ├── GameData/           # Game data JSON files
│   │   ├── WorldData.json  # World/zone data
│   │   ├── Items.json      # Items database
│   │   ├── Mobs.json       # Mobs database
│   │   ├── Quests.json     # Quests data
│   │   ├── Guides.json     # Community guides
│   │   └── ...
│   └── images/
│       └── mobs/           # Mob pixel art sprites
├── GameData/               # Source game data
└── package.json            # Project dependencies
```

## 🎮 Usage

### Navigation
- Click menu buttons at the top to switch between pages:
  - **Map** 🗺️ - Interactive world map
  - **Items** ⚔️ - Browse items
  - **Mobs** 🐉 - View mob information
  - **Quests** 📜 - Quest database
  - **Guides** 📖 - Community guides

### Map Controls
- Click on zones to view detailed maps
- Use arrow keys to navigate between levels
- Press `ESC` to close detailed views
- Click on rooms to see descriptions and exits

### Search & Filter
- Use search boxes to filter by name
- Filter by categories, types, or zones
- Real-time results as you type

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server (opens browser automatically)
- `npm build` - Create production build
- `npm test` - Run tests (if configured)

### Additional Scripts

- **PUSH_TO_GITHUB.bat** - Git commit and push helper (Windows only)

## 📊 Data Files

The app uses JSON data files located in `public/GameData/`:
- `WorldData.json` - Zone and room information
- `EnabledZones.json` - Active zones list
- `Items.json` - Complete items database
- `Mobs.json` - Complete mobs database
- `Quests.json` - Quest information
- `Guides.json` - Community-contributed guides
- `Skills.json` - Skills and abilities
- `Spells.json` - Magic spells
- `Stats.json` - Game statistics

## 🎨 Visual Design

The app features a nostalgic 90s MUD aesthetic:
- **Color Scheme**: Retro terminal with Matrix green (`#00ff00`)
- **Fonts**: VT323 and Press Start 2P for authentic retro feel
- **UI Elements**: Pixel art sprites and ASCII-inspired borders
- **Responsive**: Works on desktop and mobile devices

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔧 Technical Stack

- **React** ^18.2.0
- **React DOM** ^18.2.0
- **React Scripts** 5.0.1
- **React Markdown** ^9.0.1 - Guide rendering
- **Remark GFM** ^4.0.0 - GitHub Flavored Markdown
- **ES6 Modules** - Modern JavaScript
- **SVG Graphics** - Scalable map rendering
- **CSS3** - Animations and styling

## 📝 Contributing

We welcome contributions! You can help improve the Revelation Game Library in several ways:

### Submit a Pull Request
1. Visit the repository at [https://github.com/TheLilGibby/mud-revelation-vibe](https://github.com/TheLilGibby/mud-revelation-vibe)
2. Fork the repository
3. Make your changes and submit a pull request
4. PRs for bug fixes, features, and improvements are welcome!

### Submit Guides
1. Use the in-app Guide Submission feature
2. Follow the community guidelines
3. Submit your content for review

## 📄 License

Part of the Revelation Game Library project.

## 🎯 Version

2.0.0 - Full Game Library Edition

---

**Enjoy exploring the world of Revelation!** 🗡️📖

