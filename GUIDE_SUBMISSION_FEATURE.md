# User Guide Submission Feature

## Overview
The Revelation Game Library now includes a comprehensive user guide submission system that allows community members to create, edit, share, and manage their own game guides!

## Features

### 📝 Create Guides
- **Submit Your Guide Button**: Click the green "📝 Submit Your Guide" button in the left sidebar
- **Comprehensive Editor**: 
  - Add title, author, and contact information
  - Select character class and build type from predefined lists
  - Create multiple sections with rich content
  - Add skills with descriptions and max levels
  - Include spells with level information
  - Specify equipment recommendations for different slots
  - Add notes and recommendations for each section
  - Markdown support in content fields

### 📋 Section Management
Each guide can contain multiple sections covering:
- Stats and attribute recommendations
- Skills and abilities
- Spell rotations and priorities
- Equipment recommendations
- Leveling strategies
- And more!

### 🎨 Visual Features
- **User Badge**: User-submitted guides display a green "👤 USER" badge
- **Color Coding**: 
  - Official guides: Blue borders (#00aaff)
  - User guides: Green borders (#00ff00)
- **Edit/Delete Buttons**: Quick access to modify your guides
- **Detailed View**: Beautiful display with paper-doll equipment layout

### 💾 Data Persistence
- **Local Storage**: All user guides are automatically saved to your browser's localStorage
- **Auto-Save**: Changes are persisted automatically
- **No Login Required**: Everything is stored locally on your device

### 🔄 Import/Export
- **Export**: Download all your guides as a JSON file for backup or sharing
  - Click "📤 Export" in the left sidebar
  - File will download automatically
- **Import**: Load guides from JSON files
  - Click "📥 Import" in the left sidebar
  - Select a JSON file from your device
  - Guides will be imported with new IDs to avoid conflicts

### 🔍 Filtering
- **Search**: Filter guides by title, author, class, or build type
- **Class Filter**: Show only guides for specific character classes
- **Build Type Filter**: Filter by build type (Melee, Tank, Caster, etc.)
- **User Guides Toggle**: Show only user-submitted guides
- **Clear Filters**: Reset all filters to default

### ✏️ Edit & Delete
- **Edit**: Click the edit button (✏️) on any user guide to modify it
- **Delete**: Click the delete button (🗑️) to remove a guide permanently
- **Edit from Detail View**: Edit/delete buttons also available in the detailed guide panel

## How to Use

### Creating Your First Guide

1. **Open the Guides Page**: Navigate to the Guides section in the main menu

2. **Click Submit Your Guide**: Find the green button in the left sidebar

3. **Fill in Basic Information**:
   - Guide Title (required)
   - Your Name (required)
   - Contact Info (optional)
   - Character Class (required)
   - Build Type (required)

4. **Add Sections**:
   - Enter a section title (e.g., "Stats", "Skills", "Equipment")
   - Write your content (markdown supported!)
   - Add skills, spells, or equipment as needed
   - Click "➕ Add Section to Guide"

5. **Submit**: Once you've added all sections, click "📤 Submit Guide"

### Editing a Guide

1. Find your guide in the list (it will have a green border and USER badge)
2. Click the "✏️ Edit" button
3. Make your changes
4. Click "💾 Save Changes"

### Sharing Guides with Friends

1. Click "📤 Export" to download your guides
2. Share the JSON file with your friends (Discord, email, etc.)
3. They can import it using the "📥 Import" button

## Tips & Best Practices

- **Use Markdown**: Format your content with markdown for better readability
  - `**bold text**` for emphasis
  - `*italic text*` for notes
  - Lists with `-` or `*`
  - Links with `[text](url)`

- **Be Detailed**: Include level ranges, specific stats, and reasoning for recommendations

- **Structure Your Content**: Use multiple sections to organize information logically

- **Update Regularly**: Edit your guides as game patches or strategies change

- **Backup Your Guides**: Export your guides periodically to prevent data loss

- **Share Your Knowledge**: Export and share guides with your guild or community

## Technical Details

### Data Storage
- Guides are stored in browser localStorage under the key `userSubmittedGuides`
- Each guide has a unique ID in the format `user-guide-{timestamp}`
- Maximum storage depends on browser (typically 5-10MB)

### Supported Fields
- **Basic Info**: title, author, contact, characterClass, buildType
- **Sections**: title, content, skills[], spells[], slots{}, notes, recommendations
- **Skills**: name, maxLevel, description
- **Spells**: name, level, description
- **Equipment Slots**: head, neck, chest, hands, wrist, finger, main hand, off hand, legs, feet, back, waist

### Character Classes
Warrior, Cleric, Rogue, Wizard, Ranger, Paladin, Shadow Knight, Druid, Monk, Bard, Necromancer, Enchanter

### Build Types
Melee, Tank, Caster, Healer, DPS, Support, Hybrid, Solo, Group, PvP, Leveling

## Troubleshooting

**Q: My guides disappeared after clearing browser data**
A: User guides are stored in localStorage. Clearing browser data will delete them. Use the Export feature regularly to backup your guides.

**Q: Can I edit official guides?**
A: No, only user-submitted guides can be edited or deleted.

**Q: How do I share a single guide?**
A: Export all your guides, then manually edit the JSON file to include only the guide you want to share before sending it.

**Q: The import isn't working**
A: Make sure the JSON file is properly formatted. It should be an array of guide objects.

**Q: Can other people see my submitted guides?**
A: No, guides are stored locally in your browser. To share, you must export and send the file to others who can then import it.

## Future Enhancements
Potential future features could include:
- Cloud storage with user accounts
- Community guide repository
- Rating and commenting system
- Guide version history
- Rich text editor instead of markdown
- Image upload support

## Support
If you encounter any issues or have suggestions for improvements, please contact the development team or submit an issue on the project repository.

---

**Happy Guide Writing! Share your knowledge and help the community thrive! 🎮📚**

