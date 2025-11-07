# URL Sharing Feature

## Overview
The application now supports direct linking to specific items, quests, and mobs via URL parameters. Users can share URLs that will automatically navigate to the correct page and open the specific entity.

## Supported URL Parameters

### Items Page
- Parameter: `itemId`
- Example: `http://localhost:3000/?itemId=1269`
- Behavior: Navigates to Items page and opens the item with ID 1269

### Quests Page
- Parameter: `quest`
- Example: `http://localhost:3000/?quest=146`
- Behavior: Navigates to Quests page and opens the quest with ID 146

### Mobs Page
- Parameter: `mobId`
- Example: `http://localhost:3000/?mobId=42`
- Behavior: Navigates to Mobs page and opens the mob with ID 42

### Multiple Parameters
You can combine parameters (though only one will be processed):
- Example: `http://localhost:3000/?itemId=1269&quest=146`
- Behavior: Opens Items page (itemId takes priority)

## How It Works

### 1. App.js
On application load, the main App component checks for URL parameters and automatically sets the active page:
```javascript
// Priority order: itemId -> quest -> mobId
if (urlParams.has('itemId')) {
    setActivePage('items');
} else if (urlParams.has('quest')) {
    setActivePage('quests');
} else if (urlParams.has('mobId')) {
    setActivePage('mobs');
}
```

### 2. Individual Pages
Each page (Items, Quests, Mobs) has a useEffect hook that:
- Waits for the page to be active (`isActive === true`)
- Waits for data to be loaded
- Reads the URL parameter
- Opens the specified entity
- **Keeps the URL parameter** (for proper browser history and bookmarking)

### 3. Share Buttons
Each detail view now has a share button (🔗) that:
- Generates a shareable URL with the appropriate parameter
- Copies the URL to the clipboard
- Shows a "Link copied!" tooltip

### 4. Browser History
When browsing entities normally (without URL parameters), the URL is updated automatically to maintain proper browser history and enable back/forward navigation.

## Implementation Details

### Files Modified
1. **src/App.js** - Added URL parameter detection for all entity types
2. **src/pages/ItemsPage.js** - Already had URL handling (enhanced)
3. **src/pages/QuestsPage.js** - Enhanced URL handling to check `isActive` prop
4. **src/pages/MobsPage.js** - Added complete URL parameter handling and share button

### Key Features
- ✅ Automatic page navigation based on URL parameters
- ✅ Auto-open entity detail view
- ✅ Share button on all detail views
- ✅ Clipboard copy with visual feedback
- ✅ Browser history support
- ✅ URL cleanup after processing
- ✅ Prevents re-triggering when entity is already selected

## Testing

To test the feature:

1. **Direct Link Test**
   - Open: `http://localhost:3000/?itemId=1269`
   - Expected: Items page opens with item #1269 displayed
   
2. **Quest Link Test**
   - Open: `http://localhost:3000/?quest=146`
   - Expected: Quests page opens with quest #146 displayed

3. **Mob Link Test**
   - Open: `http://localhost:3000/?mobId=42`
   - Expected: Mobs page opens with mob #42 displayed

4. **Share Button Test**
   - Open any entity detail view
   - Click the 🔗 button
   - Expected: "Link copied!" tooltip appears
   - Paste the URL in a new tab
   - Expected: Same entity opens automatically

## Bug Fixes

### Bug Fix 1: Clean URL Parameters

#### Issue
Previously, when sharing an item/quest/mob, the generated URL could include leftover parameters from previous page visits. For example, visiting a quest then sharing an item would result in: `http://localhost:3000/?quest=146&itemId=855`

#### Solution
All share functions and URL update operations now create **clean URLs** using:
```javascript
const url = new URL(window.location.origin + window.location.pathname);
url.searchParams.set('itemId', item.Id);
```

This ensures only the relevant parameter is included in shared URLs:
- Item share: `http://localhost:3000/?itemId=855` ✅
- Quest share: `http://localhost:3000/?quest=146` ✅
- Mob share: `http://localhost:3000/?mobId=42` ✅

#### Affected Functions
1. **ItemsPage.js**: `handleShareItem()` - Share button and URL updates
2. **QuestsPage.js**: `handleShareQuest()`, `handleQuestClick()`, `handleBackToList()`
3. **MobsPage.js**: `handleShareMob()` - Share button and URL updates

### Bug Fix 2: URL Parameter Not Working on Initial Load

#### Issue
When users clicked on a shared link like `http://localhost:3000/?itemId=942`, the page would load but the item detail view wouldn't open. This was caused by the URL parameter being immediately cleared after processing, which conflicted with the browser history management effect.

#### Solution
Removed the code that was immediately clearing URL parameters after processing. Now the URL parameters persist throughout the session, which allows:
- ✅ Shared links to work on initial page load
- ✅ Browser back/forward buttons to work properly
- ✅ URL to stay in sync with selected entity
- ✅ Proper browser history for bookmarking

**Before (broken):**
```javascript
if (itemId) {
    const item = items.find(i => i.Id === parseInt(itemId));
    if (item && selectedItem?.Id !== item.Id) {
        setSelectedItem(item);
        // ❌ This was immediately clearing the URL
        const url = new URL(window.location);
        url.searchParams.delete('itemId');
        window.history.replaceState({}, '', url);
    }
}
```

**After (fixed):**
```javascript
if (itemId) {
    const item = items.find(i => i.Id === parseInt(itemId));
    if (item && selectedItem?.Id !== item.Id) {
        console.log(`[ItemsPage] Opening item from URL: ${item.Name} (ID: ${item.Id})`);
        setSelectedItem(item);
        // ✅ URL parameter stays intact
    }
}
```

The separate "Update URL when item is selected" effect handles keeping the URL in sync when users browse normally.

#### Affected Files
- `src/pages/ItemsPage.js` - Removed URL clearing after processing itemId
- `src/pages/QuestsPage.js` - Removed URL clearing after processing quest
- `src/pages/MobsPage.js` - Removed URL clearing after processing mobId

## Notes

- URL parameters are case-sensitive
- Only numeric IDs are supported
- If an invalid ID is provided, the page will load but no entity will be selected
- The URL is cleaned after processing to avoid confusion
- Multiple parameters in one URL will only process the first match (priority: itemId > quest > mobId)
- **Clean URLs**: All share functions and URL updates create clean URLs with only the relevant parameter (no leftover parameters from previous pages)

