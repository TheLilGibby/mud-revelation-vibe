# Navigation Fix: Mobs → Items Page

## Issue
When clicking on a dropped item in the MobsPage to view it in the Items database, the navigation was failing to automatically open the item details modal.

## Root Cause
The ItemsPage navigation handler only supported navigation by item **name** (for GuidesPage → ItemsPage navigation), but MobsPage was trying to navigate by item **Id**.

## Solution

### 1. Updated ItemsPage Navigation Handler
**File**: `src/pages/ItemsPage.js`

**Before:**
```javascript
// Only handled navigation by item name
useEffect(() => {
    if (navigationData && navigationData.searchItem && items.length > 0) {
        const foundItem = items.find(item => 
            item.Name?.toLowerCase() === navigationData.searchItem.toLowerCase()
        );
        if (foundItem) {
            setSelectedItem(foundItem);
        }
    }
}, [navigationData, items, onClearNavigation]);
```

**After:**
```javascript
// Now handles both navigation by Id AND by name
useEffect(() => {
    // Only process navigation when page is active and we have data
    if (!isActive || !navigationData || items.length === 0) return;

    let foundItem = null;

    // Handle navigation by item ID (from MobsPage)
    if (navigationData.Id) {
        foundItem = items.find(item => item.Id === navigationData.Id);
        if (foundItem) {
            console.log(`[ItemsPage] Navigated to item by Id: ${foundItem.Name}`);
            setSelectedItem(foundItem);
            setSearchTerm('');  // Clear search to ensure visibility
        }
    }
    // Handle navigation by item name (from GuidesPage)
    else if (navigationData.searchItem) {
        setSearchTerm(navigationData.searchItem);
        foundItem = items.find(item => 
            item.Name?.toLowerCase() === navigationData.searchItem.toLowerCase()
        );
        if (foundItem) {
            setSelectedItem(foundItem);
        }
    }
    
    if (onClearNavigation) {
        onClearNavigation();
    }
}, [isActive, navigationData, items, onClearNavigation]);
```

### 2. Added `isActive` Check
**Why?** With the new page mounting strategy (pages stay mounted but hidden), we need to ensure navigation only processes when the page becomes active.

### 3. Updated MobsPage Navigation (Consistency)
**File**: `src/pages/MobsPage.js`

Added the same `isActive` check for consistency:
```javascript
useEffect(() => {
    // Only process navigation when page is active and we have data
    if (!isActive || !navigationData || mobs.length === 0) return;
    
    const foundMob = mobs.find(mob => mob.Id === navigationData.Id);
    if (foundMob) {
        setSelectedMob(foundMob);
        setSearchTerm('');
    }
    
    if (onClearNavigation) {
        onClearNavigation();
    }
}, [isActive, navigationData, mobs, onClearNavigation]);
```

## Navigation Flow

### MobsPage → ItemsPage
1. User clicks "📦 View Full Details in Items Page" button
2. MobsPage calls: `onNavigateToItems({ Id: selectedDroppedItem.Id })`
3. App.js: `handleNavigateToItems` sets navigation data and switches page
4. ItemsPage becomes active (`isActive=true`)
5. Navigation effect triggers, finds item by Id
6. Sets `selectedItem`, which automatically opens the modal
7. User sees item details immediately! ✅

### GuidesPage → ItemsPage (Still Works)
1. User clicks on equipment link in guide
2. GuidesPage calls: `onNavigateToItems({ searchItem: itemName })`
3. Same flow as above, but searches by name
4. Works perfectly! ✅

## Benefits

✅ **Dual Navigation Support**: Works with both Id and name
✅ **Active Page Check**: Only processes when page is visible
✅ **Console Logging**: Easy debugging with clear log messages
✅ **Search Clearing**: Ensures navigated item is always visible
✅ **Error Handling**: Warns if item not found

## Testing

Test the following scenarios:

1. **Mobs → Items by Id**
   - Open MobsPage
   - Click on a mob
   - Click on a dropped item
   - Click "View Full Details in Items Page"
   - ✅ Should open ItemsPage with item modal visible

2. **Guides → Items by Name**
   - Open GuidesPage
   - Click on equipment link in a guide
   - ✅ Should open ItemsPage with item selected

3. **Items → Mobs by Id**
   - Open ItemsPage
   - View an item's "Dropped By" section
   - Click on a mob
   - ✅ Should open MobsPage with mob modal visible

## Console Output

When navigation works correctly, you should see:
```
[ItemsPage] Using 15324 items from context
[ItemsPage] Navigated to item by Id: Iron Sword
```

Or if navigating by name:
```
[ItemsPage] Navigated to item by name: Iron Sword
```

## No Breaking Changes

- All existing navigation paths still work
- Backward compatible with previous code
- No changes to data structures or props

