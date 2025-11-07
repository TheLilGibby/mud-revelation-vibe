# Table Jitter and Navigation Fixes

## Issues Fixed

### 1. Table Jitter When Clicking Rows with Item Selected
**Problem**: When viewing an item (e.g., `http://localhost:3000/?itemId=942`) and clicking on a different table row, the table would create a jittering animation and fail to show the newly selected item.

**Root Cause**: There was a circular dependency between the URL parameter reading effect and the URL update effect:
1. User clicks row → `setSelectedItem(item)` is called
2. URL update effect runs → changes URL to include new `itemId`
3. URL parameter reading effect had `selectedItem` in dependencies → runs again when `selectedItem` changes
4. This creates an endless loop of effects triggering each other, causing the jitter

**Solution**: Added a `useRef` flag (`isManualSelection`) to track whether an item selection is from a user click vs URL parameter:

```javascript
const isManualSelection = useRef(false); // Track if selection is from user click vs URL

// When user clicks a row
onClick={() => {
    isManualSelection.current = true;
    setSelectedItem(item);
}}

// In URL parameter effect
useEffect(() => {
    // Skip if this was a manual selection
    if (isManualSelection.current) {
        isManualSelection.current = false;
        return;
    }
    // ... process URL parameter
}, [isActive, items, selectedItem]);
```

This breaks the circular dependency by preventing the URL parameter effect from re-processing when the selection came from a user click.

### 2. Mob-to-Mob Navigation from Items Page
**Problem**: When navigating from the Items page "Dropped By" section to the Mobs page, clicking on the second mob would fail to properly direct the user to that mob's detail view.

**Root Cause**: When navigating from Items → Mobs using `onNavigateToMob`, the navigation data triggers `setSelectedMob`, which then triggers the URL update effect. This URL change would cause the URL parameter reading effect to run, but without the manual selection flag, it could cause conflicts.

**Solution**: Added the `isManualSelection` flag to the navigation effect in MobsPage:

```javascript
// Handle navigation from ItemsPage
useEffect(() => {
    if (!isActive || !navigationData || mobs.length === 0) return;
    
    const foundMob = mobs.find(mob => mob.Id === navigationData.Id);
    
    if (foundMob) {
        // Mark as manual selection to prevent URL effect from re-processing
        isManualSelection.current = true;
        setSelectedMob(foundMob);
        setSearchTerm('');
    }
    
    if (onClearNavigation) {
        onClearNavigation();
    }
}, [isActive, navigationData, mobs, onClearNavigation]);
```

### 3. Items-to-Items Navigation from Mobs Page
**Problem**: When viewing a mob's "Dropped Items" section and clicking on an item, users expected to navigate to the Items page with that item's detail view open.

**Root Cause**: The dropped items section was calling `setSelectedDroppedItem(item)` which opened a modal instead of navigating to the Items page.

**Solution**: Changed the onClick handler to use `onNavigateToItems` instead:

```javascript
// OLD (opened modal)
onClick={() => setSelectedDroppedItem(item)}

// NEW (navigates to Items page)
onClick={() => {
    if (onNavigateToItems) {
        onNavigateToItems({ Id: item.Id });
    }
}}
```

Also added the manual selection flag to the Items page navigation effect:

```javascript
// Handle navigation from other pages (e.g., Guides, Mobs)
useEffect(() => {
    if (!isActive || !navigationData || items.length === 0) return;
    
    if (navigationData.Id) {
        const foundItem = items.find(item => item.Id === navigationData.Id);
        if (foundItem) {
            // Mark as manual selection to prevent URL effect from re-processing
            isManualSelection.current = true;
            setSelectedItem(foundItem);
            setSearchTerm('');
        }
    }
    
    if (onClearNavigation) {
        onClearNavigation();
    }
}, [isActive, navigationData, items, onClearNavigation]);
```

## Files Modified

### src/pages/ItemsPage.js
- Added `useRef` import
- Added `isManualSelection` ref flag
- Updated table row click handler to set flag before `setSelectedItem`
- Updated close button click handler to set flag
- Updated URL parameter effect to check and clear flag
- Updated navigation from other pages effect to set flag

### src/pages/MobsPage.js
- Added `useRef` import  
- Added `isManualSelection` ref flag
- Updated table row click handler to set flag before `setSelectedMob`
- Updated navigation from ItemsPage effect to set flag
- Updated dropped items click handler to navigate to Items page instead of opening modal

## Benefits

✅ **No more table jitter** - Clicking table rows while viewing an item works smoothly

✅ **Proper cross-page navigation** - All navigation between Items ↔ Mobs works correctly

✅ **Consistent behavior** - Both manual clicks and programmatic navigation use the same pattern

✅ **Clean separation** - URL effects only run for actual URL changes, not for programmatic selections

## Testing

To verify the fixes work:

1. **Test Table Jitter Fix**:
   - Navigate to `http://localhost:3000/?itemId=942`
   - Click on different item rows in the table
   - Expected: Smooth transition to each item without jittering

2. **Test Mob-to-Mob Navigation**:
   - Go to Items page, click on an item that's dropped by multiple mobs
   - Click first mob → navigates to Mobs page
   - Click second mob from "Dropped By" section
   - Expected: Properly shows second mob's details

3. **Test Dropped Items Navigation**:
   - Go to Mobs page, select a mob that drops items
   - Click on an item in the "Dropped Items" section
   - Expected: Navigates to Items page with that item's detail view open

## Technical Pattern

The solution uses a common React pattern for handling both user-initiated and programmatic state changes:

```javascript
const isManualSelection = useRef(false);

// User action
onClick={() => {
    isManualSelection.current = true;
    setSelectedItem(item);
}}

// Effect that should skip on user actions
useEffect(() => {
    if (isManualSelection.current) {
        isManualSelection.current = false;
        return;  // Skip this effect run
    }
    // ... handle URL parameter changes
}, [dependencies]);
```

This pattern:
- Uses `useRef` to store a flag that doesn't trigger re-renders
- Sets the flag before manual state changes
- Checks and clears the flag in effects that should be skipped
- Prevents circular dependencies between effects

