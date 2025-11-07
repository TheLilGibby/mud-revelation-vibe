import React, { useState, useEffect, useRef } from 'react';
import { useGameData } from '../contexts/DataContext';
import MobSprite from '../components/MobSprite';

function ItemsPage({ navigationData, onClearNavigation, onNavigateToMob, isActive }) {
    const { items: loadedItems, mobs: loadedMobs } = useGameData();
    const [shareTooltip, setShareTooltip] = useState('');
    // Add CSS for range slider thumbs
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            /* WebKit (Chrome, Safari) */
            input[type="range"].dual-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #00ff00;
                cursor: pointer;
                border: 3px solid #000;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
                position: relative;
                z-index: 10;
            }
            
            input[type="range"].dual-range::-webkit-slider-thumb:hover {
                background: #ffff00;
                box-shadow: 0 0 15px rgba(255, 255, 0, 1);
                transform: scale(1.1);
            }
            
            /* Firefox */
            input[type="range"].dual-range::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #00ff00;
                cursor: pointer;
                border: 3px solid #000;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
            }
            
            input[type="range"].dual-range::-moz-range-thumb:hover {
                background: #ffff00;
                box-shadow: 0 0 15px rgba(255, 255, 0, 1);
                transform: scale(1.1);
            }
            
            /* Remove default track styling */
            input[type="range"].dual-range::-webkit-slider-runnable-track {
                background: transparent;
            }
            
            input[type="range"].dual-range::-moz-range-track {
                background: transparent;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);
    
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedWeaponTypes, setSelectedWeaponTypes] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [minLevel, setMinLevel] = useState(0);
    const [maxLevel, setMaxLevel] = useState(200);
    const [absoluteMaxLevel, setAbsoluteMaxLevel] = useState(200); // Fixed max level for slider
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100000);
    const [absoluteMaxValue, setAbsoluteMaxValue] = useState(100000); // Fixed max value for slider
    const [minDamage, setMinDamage] = useState(0);
    const [maxDamage, setMaxDamage] = useState(1000);
    const [absoluteMaxDamage, setAbsoluteMaxDamage] = useState(1000); // Fixed max damage for slider
    const [minWeight, setMinWeight] = useState(0);
    const [maxWeight, setMaxWeight] = useState(100);
    const [absoluteMaxWeight, setAbsoluteMaxWeight] = useState(100); // Fixed max weight for slider
    const [minRequiredLevel, setMinRequiredLevel] = useState(0);
    const [maxRequiredLevel, setMaxRequiredLevel] = useState(100);
    const [absoluteMaxRequiredLevel, setAbsoluteMaxRequiredLevel] = useState(100); // Fixed max required level for slider
    const [showItemTypes, setShowItemTypes] = useState(() => {
        const saved = localStorage.getItem('revelationItemsShowItemTypes');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showWeaponTypes, setShowWeaponTypes] = useState(() => {
        const saved = localStorage.getItem('revelationItemsShowWeaponTypes');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showArmorSlots, setShowArmorSlots] = useState(() => {
        const saved = localStorage.getItem('revelationItemsShowArmorSlots');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [selectedArmorSlots, setSelectedArmorSlots] = useState([]);
    const [showEffects, setShowEffects] = useState(() => {
        const saved = localStorage.getItem('revelationItemsShowEffects');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [allEffects, setAllEffects] = useState([]);
    const [selectedEffects, setSelectedEffects] = useState([]);
    const [effectSearchTerm, setEffectSearchTerm] = useState('');
    const [mobs, setMobs] = useState([]);
    const [selectedMobForDrops, setSelectedMobForDrops] = useState(null);
    const [showMobFilter, setShowMobFilter] = useState(() => {
        const saved = localStorage.getItem('revelationItemsShowMobFilter');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [mobSearchTerm, setMobSearchTerm] = useState('');
    const [showMobNavigationConfirm, setShowMobNavigationConfirm] = useState(false);
    const [selectedMobToNavigate, setSelectedMobToNavigate] = useState(null);
    const itemsPerPage = 50;
    const isManualSelection = useRef(false); // Track if item selection is from user click vs URL

    // Clean item names from formatting codes
    const cleanItemName = (name) => {
        if (!name) return '';
        // Remove color codes like \cf14, \cf2, etc. and any trailing periods/dots
        return name
            .replace(/\\cf\d+/gi, '')  // Remove color codes
            .replace(/\\cf\w+/gi, '')   // Remove any other formatting codes
            .trim()                      // Remove leading/trailing spaces
            .replace(/\.$/, '');         // Remove trailing period if it's the last character
    };

    // Clean mob names from formatting codes
    const cleanMobName = (name) => {
        if (!name) return '';
        return name.replace(/\\cf\d+/gi, '').replace(/\\cf\w+/gi, '').trim().replace(/\.$/, '');
    };

    // Count all item effects
    const getItemEffectCount = (item) => {
        let count = 0;
        
        // Count ItemEffects array
        if (item.ItemEffects && Array.isArray(item.ItemEffects)) {
            count += item.ItemEffects.filter(e => e && e.trim()).length;
        }
        
        // Count special effects
        if (item.PotionEffect) count++;
        if (item.PoisonEffect) count++;
        if (item.ScrollEffect) count++;
        if (item.UsableSpell) count++;
        if (item.ProcSpellName) count++;
        
        return count;
    };

    // Get mobs that drop a specific item
    const getMobsForItem = (itemId) => {
        return mobs.filter(mob => 
            mob.DroppedItems && 
            Array.isArray(mob.DroppedItems) && 
            mob.DroppedItems.includes(itemId)
        );
    };

    // Share item link - copy URL to clipboard
    const handleShareItem = async (item) => {
        // Create a clean URL with only the itemId parameter
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('itemId', item.Id);
        
        try {
            await navigator.clipboard.writeText(url.toString());
            setShareTooltip('Link copied!');
            setTimeout(() => setShareTooltip(''), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
            setShareTooltip('Failed to copy');
            setTimeout(() => setShareTooltip(''), 2000);
        }
    };

    // Handle slider z-index and pointer events for LEVEL slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-level');
        const maxSlider = document.querySelector('.dual-range-max-level');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) { // Only when not dragging
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mousePercent = mouseX / rect.width;
                const mouseValue = mousePercent * absoluteMaxLevel;
                
                // Calculate distance from mouse to each thumb
                const distanceToMin = Math.abs(mouseValue - minLevel);
                const distanceToMax = Math.abs(mouseValue - maxLevel);
                
                // Bring the closer slider to the front
                if (distanceToMin < distanceToMax) {
                    minSlider.style.zIndex = '5';
                    maxSlider.style.zIndex = '4';
                } else {
                    minSlider.style.zIndex = '4';
                    maxSlider.style.zIndex = '5';
                }
            }
        };
        
        // Add mousemove listener to parent container
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [minLevel, maxLevel, absoluteMaxLevel]);

    // Handle slider z-index and pointer events for VALUE slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-value');
        const maxSlider = document.querySelector('.dual-range-max-value');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) { // Only when not dragging
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mousePercent = mouseX / rect.width;
                const mouseValue = mousePercent * absoluteMaxValue;
                
                // Calculate distance from mouse to each thumb
                const distanceToMin = Math.abs(mouseValue - minValue);
                const distanceToMax = Math.abs(mouseValue - maxValue);
                
                // Bring the closer slider to the front
                if (distanceToMin < distanceToMax) {
                    minSlider.style.zIndex = '5';
                    maxSlider.style.zIndex = '4';
                } else {
                    minSlider.style.zIndex = '4';
                    maxSlider.style.zIndex = '5';
                }
            }
        };
        
        // Add mousemove listener to parent container
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [minValue, maxValue, absoluteMaxValue]);

    // Handle slider z-index and pointer events for DAMAGE slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-damage');
        const maxSlider = document.querySelector('.dual-range-max-damage');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) { // Only when not dragging
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mousePercent = mouseX / rect.width;
                const mouseValue = mousePercent * absoluteMaxDamage;
                
                // Calculate distance from mouse to each thumb
                const distanceToMin = Math.abs(mouseValue - minDamage);
                const distanceToMax = Math.abs(mouseValue - maxDamage);
                
                // Bring the closer slider to the front
                if (distanceToMin < distanceToMax) {
                    minSlider.style.zIndex = '5';
                    maxSlider.style.zIndex = '4';
                } else {
                    minSlider.style.zIndex = '4';
                    maxSlider.style.zIndex = '5';
                }
            }
        };
        
        // Add mousemove listener to parent container
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [minDamage, maxDamage, absoluteMaxDamage]);

    // Handle slider z-index and pointer events for WEIGHT slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-weight');
        const maxSlider = document.querySelector('.dual-range-max-weight');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) { // Only when not dragging
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mousePercent = mouseX / rect.width;
                const mouseValue = mousePercent * absoluteMaxWeight;
                
                // Calculate distance from mouse to each thumb
                const distanceToMin = Math.abs(mouseValue - minWeight);
                const distanceToMax = Math.abs(mouseValue - maxWeight);
                
                // Bring the closer slider to the front
                if (distanceToMin < distanceToMax) {
                    minSlider.style.zIndex = '5';
                    maxSlider.style.zIndex = '4';
                } else {
                    minSlider.style.zIndex = '4';
                    maxSlider.style.zIndex = '5';
                }
            }
        };
        
        // Add mousemove listener to parent container
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [minWeight, maxWeight, absoluteMaxWeight]);

    // Handle slider z-index and pointer events for REQUIRED LEVEL slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-req-level');
        const maxSlider = document.querySelector('.dual-range-max-req-level');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) { // Only when not dragging
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mousePercent = mouseX / rect.width;
                const mouseValue = mousePercent * absoluteMaxRequiredLevel;
                
                // Calculate distance from mouse to each thumb
                const distanceToMin = Math.abs(mouseValue - minRequiredLevel);
                const distanceToMax = Math.abs(mouseValue - maxRequiredLevel);
                
                // Bring the closer slider to the front
                if (distanceToMin < distanceToMax) {
                    minSlider.style.zIndex = '5';
                    maxSlider.style.zIndex = '4';
                } else {
                    minSlider.style.zIndex = '4';
                    maxSlider.style.zIndex = '5';
                }
            }
        };
        
        // Add mousemove listener to parent container
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [minRequiredLevel, maxRequiredLevel, absoluteMaxRequiredLevel]);

    // Handle navigation from other pages (e.g., Guides, Mobs)
    useEffect(() => {
        // Only process navigation when page is active and we have data
        if (!isActive || !navigationData || items.length === 0) return;

        let foundItem = null;

        // Handle navigation by item ID (from MobsPage)
        if (navigationData.Id) {
            foundItem = items.find(item => item.Id === navigationData.Id);
            if (foundItem) {
                console.log(`[ItemsPage] Navigated to item by Id: ${foundItem.Name}`);
                // Mark as manual selection to prevent URL effect from re-processing
                isManualSelection.current = true;
                setSelectedItem(foundItem);
                // Clear search to ensure the item is visible
                setSearchTerm('');
            } else {
                console.warn(`[ItemsPage] Item with Id ${navigationData.Id} not found`);
            }
        }
        // Handle navigation by item name (from GuidesPage)
        else if (navigationData.searchItem) {
            setSearchTerm(navigationData.searchItem);
            foundItem = items.find(item => 
                item.Name?.toLowerCase() === navigationData.searchItem.toLowerCase()
            );
            if (foundItem) {
                console.log(`[ItemsPage] Navigated to item by name: ${foundItem.Name}`);
                isManualSelection.current = true;
                setSelectedItem(foundItem);
            } else {
                console.warn(`[ItemsPage] Item with name "${navigationData.searchItem}" not found`);
            }
        }
        
        // Clear navigation data after handling
        if (onClearNavigation) {
            onClearNavigation();
        }
    }, [isActive, navigationData, items, onClearNavigation]);

    // Initialize with data from context
    useEffect(() => {
        if (loadedItems && loadedItems.length > 0) {
            console.log(`[ItemsPage] Using ${loadedItems.length} items from context`);
            setItems(loadedItems);
            setFilteredItems(loadedItems);
            
            // No filters selected by default - show all results
            // const allTypes = [...new Set(loadedItems.map(item => item.Type).filter(Boolean))];
            setSelectedTypes([]);
            
            // const allWeaponTypes = [...new Set(loadedItems.filter(item => item.WeaponType).map(item => item.WeaponType))];
            setSelectedWeaponTypes([]);
            
            // const allArmorSlots = [...new Set(loadedItems.filter(item => item.Slot && item.Slot.trim() !== '').map(item => item.Slot))].sort();
            setSelectedArmorSlots([]); // No filters selected by default
            
            // Extract all unique effects from items
            const effectsSet = new Set();
            loadedItems.forEach(item => {
                // ItemEffects array
                if (item.ItemEffects && Array.isArray(item.ItemEffects)) {
                    item.ItemEffects.forEach(effect => {
                        if (effect && typeof effect === 'string') {
                            effectsSet.add(effect.trim());
                        }
                    });
                }
                // PotionEffect
                if (item.PotionEffect) effectsSet.add(item.PotionEffect.trim());
                // PoisonEffect
                if (item.PoisonEffect) effectsSet.add(item.PoisonEffect.trim());
                // ScrollEffect
                if (item.ScrollEffect) effectsSet.add(item.ScrollEffect.trim());
                // UsableSpell
                if (item.UsableSpell) effectsSet.add(item.UsableSpell.trim());
                // ProcSpellName
                if (item.ProcSpellName) effectsSet.add(item.ProcSpellName.trim());
            });
            
            const sortedEffects = Array.from(effectsSet).sort();
            setAllEffects(sortedEffects);
            setSelectedEffects([]); // No filters selected by default
            
            // Calculate max level from data
            const maxItemLevel = Math.max(...loadedItems.map(item => item.Level || 0));
            const calculatedMaxLevel = Math.max(200, maxItemLevel); // Ensure at least 200
            setMaxLevel(calculatedMaxLevel);
            setAbsoluteMaxLevel(calculatedMaxLevel);
            
            // Calculate max value from data
            const maxItemValue = Math.max(...loadedItems.map(item => item.Value || 0));
            const calculatedMax = Math.ceil(maxItemValue / 1000) * 1000; // Round up to nearest 1000
            setMaxValue(calculatedMax);
            setAbsoluteMaxValue(calculatedMax);
            
            // Calculate max damage from data
            const maxItemDamage = Math.max(...loadedItems.map(item => item.Damage || 0));
            const calculatedMaxDamage = Math.max(100, Math.ceil(maxItemDamage / 10) * 10); // Round up to nearest 10, min 100
            setMaxDamage(calculatedMaxDamage);
            setAbsoluteMaxDamage(calculatedMaxDamage);
            
            // Calculate max weight from data
            const maxItemWeight = Math.max(...loadedItems.map(item => item.Weight || 0));
            const calculatedMaxWeight = Math.max(100, Math.ceil(maxItemWeight / 10) * 10); // Round up to nearest 10, min 100
            setMaxWeight(calculatedMaxWeight);
            setAbsoluteMaxWeight(calculatedMaxWeight);
            
            // Calculate max required level from data
            const maxItemRequiredLevel = Math.max(...loadedItems.map(item => item.RequiredLevel || 0));
            const calculatedMaxRequiredLevel = Math.max(100, maxItemRequiredLevel); // Ensure at least 100
            setMaxRequiredLevel(calculatedMaxRequiredLevel);
            setAbsoluteMaxRequiredLevel(calculatedMaxRequiredLevel);
        }
    }, [loadedItems]);

    // Initialize mobs from context
    useEffect(() => {
        if (loadedMobs && loadedMobs.length > 0) {
            console.log(`[ItemsPage] Using ${loadedMobs.length} mobs from context`);
            setMobs(loadedMobs);
        }
    }, [loadedMobs]);

    // Save collapsible section states to localStorage
    useEffect(() => {
        localStorage.setItem('revelationItemsShowItemTypes', JSON.stringify(showItemTypes));
    }, [showItemTypes]);

    useEffect(() => {
        localStorage.setItem('revelationItemsShowWeaponTypes', JSON.stringify(showWeaponTypes));
    }, [showWeaponTypes]);

    useEffect(() => {
        localStorage.setItem('revelationItemsShowArmorSlots', JSON.stringify(showArmorSlots));
    }, [showArmorSlots]);

    useEffect(() => {
        localStorage.setItem('revelationItemsShowEffects', JSON.stringify(showEffects));
    }, [showEffects]);

    useEffect(() => {
        localStorage.setItem('revelationItemsShowMobFilter', JSON.stringify(showMobFilter));
    }, [showMobFilter]);

    // Handle URL parameters for direct item linking (only on initial load)
    useEffect(() => {
        if (!isActive || !items || items.length === 0) return;
        
        // Only process URL parameters if not a manual selection
        if (isManualSelection.current) {
            isManualSelection.current = false;
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('itemId');
        
        if (itemId) {
            const item = items.find(i => i.Id === parseInt(itemId));
            if (item && selectedItem?.Id !== item.Id) {
                console.log(`[ItemsPage] Opening item from URL: ${item.Name} (ID: ${item.Id})`);
                setSelectedItem(item);
            }
        }
    }, [isActive, items, selectedItem]);

    // Update URL when item is selected (for browser history)
    useEffect(() => {
        if (!isActive) return;
        
        if (selectedItem) {
            // Create clean URL with only itemId parameter
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('itemId', selectedItem.Id);
            window.history.replaceState({}, '', url);
        } else {
            // Clear URL parameters when no item is selected
            const url = new URL(window.location.origin + window.location.pathname);
            window.history.replaceState({}, '', url);
        }
    }, [selectedItem, isActive]);

    // Filter and sort items
    useEffect(() => {
        let filtered = [...items];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item => {
                const cleanName = cleanItemName(item.Name);
                return cleanName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.Description?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Type filter
        if (selectedTypes.length > 0) {
            filtered = filtered.filter(item => 
                item.Type && selectedTypes.includes(item.Type)
            );
        }

        // Weapon type filter
        if (selectedWeaponTypes.length > 0) {
            filtered = filtered.filter(item => 
                item.WeaponType && selectedWeaponTypes.includes(item.WeaponType)
            );
        }

        // Armor slot filter
        if (selectedArmorSlots.length > 0) {
            const allArmorSlots = [...new Set(items.filter(item => item.Slot && item.Slot.trim() !== '').map(item => item.Slot))];
            // Only filter if not all slots are selected
            if (selectedArmorSlots.length < allArmorSlots.length) {
                filtered = filtered.filter(item => 
                    // Include items without a slot (like weapons), or items with a selected slot
                    !item.Slot || item.Slot.trim() === '' || selectedArmorSlots.includes(item.Slot)
                );
            }
        }

        // Effects filter
        if (selectedEffects.length > 0 && selectedEffects.length < allEffects.length) {
            filtered = filtered.filter(item => {
                // Check if item has any of the selected effects
                const itemEffects = [];
                
                // Collect all effects from the item
                if (item.ItemEffects && Array.isArray(item.ItemEffects)) {
                    itemEffects.push(...item.ItemEffects.map(e => e?.trim()).filter(Boolean));
                }
                if (item.PotionEffect) itemEffects.push(item.PotionEffect.trim());
                if (item.PoisonEffect) itemEffects.push(item.PoisonEffect.trim());
                if (item.ScrollEffect) itemEffects.push(item.ScrollEffect.trim());
                if (item.UsableSpell) itemEffects.push(item.UsableSpell.trim());
                if (item.ProcSpellName) itemEffects.push(item.ProcSpellName.trim());
                
                // Check if any item effect is in selectedEffects
                return itemEffects.some(effect => selectedEffects.includes(effect));
            });
        }

        // Level filter
        filtered = filtered.filter(item => {
            const itemLevel = item.Level || 0;
            return itemLevel >= minLevel && itemLevel <= maxLevel;
        });

        // Value filter
        filtered = filtered.filter(item => {
            const itemValue = item.Value || 0;
            return itemValue >= minValue && itemValue <= maxValue;
        });

        // Damage filter
        filtered = filtered.filter(item => {
            const itemDamage = item.Damage || 0;
            return itemDamage >= minDamage && itemDamage <= maxDamage;
        });

        // Weight filter
        filtered = filtered.filter(item => {
            const itemWeight = item.Weight || 0;
            return itemWeight >= minWeight && itemWeight <= maxWeight;
        });

        // Required level filter
        filtered = filtered.filter(item => {
            const itemRequiredLevel = item.RequiredLevel || 0;
            return itemRequiredLevel >= minRequiredLevel && itemRequiredLevel <= maxRequiredLevel;
        });

        // Mob filter - filter by items dropped by selected mob
        if (selectedMobForDrops) {
            filtered = filtered.filter(item => 
                selectedMobForDrops.DroppedItems && 
                Array.isArray(selectedMobForDrops.DroppedItems) && 
                selectedMobForDrops.DroppedItems.includes(item.Id)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return cleanItemName(a.Name).localeCompare(cleanItemName(b.Name));
                case 'level':
                    return (b.Level || 0) - (a.Level || 0);
                case 'value':
                    return (b.Value || 0) - (a.Value || 0);
                case 'damage':
                    return (b.Damage || 0) - (a.Damage || 0);
                default:
                    return 0;
            }
        });

        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedTypes, selectedWeaponTypes, selectedArmorSlots, selectedEffects, allEffects, sortBy, minLevel, maxLevel, minValue, maxValue, minDamage, maxDamage, minWeight, maxWeight, minRequiredLevel, maxRequiredLevel, items, selectedMobForDrops]);

    // Get unique types, weapon types, and armor slots
    const itemTypes = [...new Set(items.map(item => item.Type).filter(Boolean))].sort();
    const weaponTypes = [...new Set(items.filter(item => item.WeaponType).map(item => item.WeaponType))].sort();
    const armorSlots = [...new Set(items.filter(item => item.Slot && item.Slot.trim() !== '').map(item => item.Slot))].sort();
    
    // Toggle type selection
    const toggleType = (type) => {
        setSelectedTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };
    
    // Toggle weapon type selection
    const toggleWeaponType = (weaponType) => {
        setSelectedWeaponTypes(prev => {
            if (prev.includes(weaponType)) {
                return prev.filter(t => t !== weaponType);
            } else {
                return [...prev, weaponType];
            }
        });
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    // Get item icon based on type
    const getItemIcon = (item) => {
        if (item.Type === 'weapon') {
            if (item.WeaponType?.includes('Sword')) return '⚔️';
            if (item.WeaponType?.includes('Bow')) return '🏹';
            if (item.WeaponType?.includes('Staff')) return '🪄';
            if (item.WeaponType?.includes('Mace')) return '🔨';
            if (item.WeaponType?.includes('Axe')) return '🪓';
            if (item.WeaponType?.includes('Dagger')) return '🗡️';
            return '⚔️';
        }
        if (item.Type === 'armor') return '🛡️';
        if (item.Type === 'potion') return '🧪';
        if (item.Type === 'scroll') return '📜';
        if (item.Type === 'food') return '🍖';
        if (item.Type === 'container') return '🎒';
        return '📦';
    };

    // Get rarity color based on level/value
    const getRarityColor = (item) => {
        if (item.Level >= 100) return '#ff00ff'; // Epic
        if (item.Level >= 75) return '#ffaa00'; // Rare
        if (item.Level >= 50) return '#00aaff'; // Uncommon
        return '#aaaaaa'; // Common
    };

    // Clean and normalize mob name for comparison
    const normalizeMobNameForComparison = (name) => {
        if (!name) return '';
        
        // Remove color codes, trailing dots, superscript numbers, and trim
        let cleaned = name
            .replace(/\\cf\d+/gi, '')
            .replace(/\\cf\w+/gi, '')
            .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '') // Remove superscript numbers
            .trim()
            .replace(/\.$/, '');
        
        // Normalize articles - remove leading "A ", "An ", "The "
        cleaned = cleaned.replace(/^(A|An|The)\s+/i, '');
        
        return cleaned.toLowerCase();
    };

    // Get mobs that drop this item
    const getMobsThatDropItem = (item) => {
        if (!item || !item.DroppedBy || !mobs || mobs.length === 0) return [];
        
        const droppedByText = item.DroppedBy.trim();
        if (droppedByText === '') return [];
        
        // Split by comma to get individual mob names
        const mobNamesFromItem = droppedByText.split(',').map(m => m.trim());
        
        // Find matching mobs
        const matchingMobs = [];
        for (const mobNameFromItem of mobNamesFromItem) {
            const normalizedItemMobName = normalizeMobNameForComparison(mobNameFromItem);
            
            // Find mob(s) that match this name
            const foundMob = mobs.find(mob => 
                normalizeMobNameForComparison(mob.Name) === normalizedItemMobName
            );
            
            if (foundMob) {
                matchingMobs.push(foundMob);
            }
        }
        
        return matchingMobs;
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                background: '#0a0a0a',
                color: '#00ff00',
                fontSize: '2em',
                fontFamily: 'VT323, monospace'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px' }}>⏳</div>
                    <div>Loading Items Database...</div>
                    <div style={{ fontSize: '0.6em', color: '#888', marginTop: '10px' }}>
                        {items.length > 0 ? `Loaded ${items.length} items` : 'Please wait...'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: '100%',
            background: '#0a0a0a',
            color: '#00ff00',
            display: 'flex',
            fontFamily: 'VT323, monospace',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Left Sidebar - Filters */}
            <div style={{
                width: '420px',
                maxWidth: '420px',
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                borderRight: '3px solid #00ff00',
                padding: '20px',
                overflowY: 'auto',
                overflowX: 'hidden',
                flexShrink: 0,
                boxShadow: '3px 0 15px rgba(0, 0, 0, 0.5)',
                minWidth: 0
            }}>
                <h2 style={{
                    fontSize: '2em',
                    marginBottom: '20px',
                    color: '#ffff00',
                    textAlign: 'center'
                }}>
                    ⚔️ Items
                </h2>

                {/* Search */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em' }}>
                        🔍 Search:
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search items..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            color: '#00ff00',
                            fontSize: '1.1em',
                            fontFamily: 'VT323, monospace',
                            borderRadius: '3px'
                        }}
                    />
                </div>

                {/* Type Filter - Collapsible */}
                <div style={{ marginBottom: '20px' }}>
                    {/* Collapsible Header */}
                    <div 
                        onClick={() => setShowItemTypes(!showItemTypes)}
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginBottom: showItemTypes ? '8px' : '0',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#00ff0020';
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#2a2a2a';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ fontSize: '1.2em' }}>
                            📦 Item Types
                            <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                ({selectedTypes.length} selected)
                            </span>
                        </div>
                        <span style={{ 
                            fontSize: '1.5em',
                            transition: 'transform 0.2s',
                            transform: showItemTypes ? 'rotate(180deg)' : 'rotate(0deg)',
                            display: 'inline-block'
                        }}>
                            ▼
                        </span>
                    </div>

                    {/* Collapsible Content */}
                    {showItemTypes && (
                        <div style={{
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            padding: '8px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {/* Select All Option */}
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 6px',
                                    marginBottom: '6px',
                                    background: selectedTypes.length === itemTypes.length ? '#00ff0030' : '#1a1a1a',
                                    border: `2px solid ${selectedTypes.length === itemTypes.length ? '#00ff00' : '#555'}`,
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '1.2em',
                                    fontWeight: 'bold'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = selectedTypes.length === itemTypes.length ? '#00ff0030' : '#00ff0015';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = selectedTypes.length === itemTypes.length ? '#00ff0030' : '#1a1a1a';
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.length === itemTypes.length}
                                    onChange={() => {
                                        if (selectedTypes.length === itemTypes.length) {
                                            setSelectedTypes([]);
                                        } else {
                                            setSelectedTypes([...itemTypes]);
                                        }
                                    }}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        marginRight: '10px',
                                        cursor: 'pointer',
                                        accentColor: '#00ff00'
                                    }}
                                />
                                <span style={{ 
                                    flex: 1,
                                    color: selectedTypes.length === itemTypes.length ? '#00ff00' : '#aaa'
                                }}>
                                    Select All
                                </span>
                            </label>

                            {/* Individual Type Checkboxes */}
                            {itemTypes.map(type => (
                                <label
                                    key={type}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '6px',
                                        marginBottom: '3px',
                                        background: selectedTypes.includes(type) ? '#00ff0020' : 'transparent',
                                        border: `1px solid ${selectedTypes.includes(type) ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.1em'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selectedTypes.includes(type)) {
                                            e.currentTarget.style.background = '#00ff0010';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!selectedTypes.includes(type)) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => toggleType(type)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            marginRight: '10px',
                                            cursor: 'pointer',
                                            accentColor: '#00ff00'
                                        }}
                                    />
                                    <span style={{ 
                                        flex: 1,
                                        color: selectedTypes.includes(type) ? '#00ff00' : '#aaa',
                                        textTransform: 'capitalize'
                                    }}>
                                        {type}
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.9em',
                                        color: '#888',
                                        marginLeft: '8px'
                                    }}>
                                        ({items.filter(item => item.Type === type).length})
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weapon Type Filter - Collapsible */}
                {weaponTypes.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        {/* Collapsible Header */}
                        <div 
                            onClick={() => setShowWeaponTypes(!showWeaponTypes)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: showWeaponTypes ? '5px 5px 0 0' : '5px',
                                cursor: 'pointer',
                                transition: 'background 0.2s, box-shadow 0.2s, border-radius 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00ff0020';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2a2a2a';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ fontSize: '1.2em' }}>
                                ⚔️ Weapon Types
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedWeaponTypes.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showWeaponTypes ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {/* Collapsible Content */}
                        {showWeaponTypes && (
                            <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderTop: 'none',
                                borderRadius: '0 0 5px 5px',
                                padding: '8px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {/* Select All Option */}
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 6px',
                                        marginBottom: '6px',
                                        background: selectedWeaponTypes.length === weaponTypes.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedWeaponTypes.length === weaponTypes.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedWeaponTypes.length === weaponTypes.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedWeaponTypes.length === weaponTypes.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedWeaponTypes.length === weaponTypes.length}
                                        onChange={() => {
                                            if (selectedWeaponTypes.length === weaponTypes.length) {
                                                setSelectedWeaponTypes([]);
                                            } else {
                                                setSelectedWeaponTypes([...weaponTypes]);
                                            }
                                        }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            marginRight: '10px',
                                            cursor: 'pointer',
                                            accentColor: '#00ff00'
                                        }}
                                    />
                                    <span style={{ 
                                        flex: 1,
                                        color: selectedWeaponTypes.length === weaponTypes.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Weapon Type Checkboxes */}
                                {weaponTypes.map(weaponType => (
                                    <label
                                        key={weaponType}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px',
                                            marginBottom: '3px',
                                            background: selectedWeaponTypes.includes(weaponType) ? '#00ff0020' : 'transparent',
                                            border: `1px solid ${selectedWeaponTypes.includes(weaponType) ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.1em'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedWeaponTypes.includes(weaponType)) {
                                                e.currentTarget.style.background = '#00ff0010';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedWeaponTypes.includes(weaponType)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedWeaponTypes.includes(weaponType)}
                                            onChange={() => toggleWeaponType(weaponType)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                marginRight: '10px',
                                                cursor: 'pointer',
                                                accentColor: '#00ff00'
                                            }}
                                        />
                                        <span style={{ 
                                            flex: 1,
                                            color: selectedWeaponTypes.includes(weaponType) ? '#00ff00' : '#aaa'
                                        }}>
                                            {weaponType}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.9em',
                                            color: '#888',
                                            marginLeft: '8px'
                                        }}>
                                            ({items.filter(item => item.WeaponType === weaponType).length})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Armor Slots Filter - Collapsible */}
                {armorSlots.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        {/* Collapsible Header */}
                        <div 
                            onClick={() => setShowArmorSlots(!showArmorSlots)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: showArmorSlots ? '5px 5px 0 0' : '5px',
                                cursor: 'pointer',
                                transition: 'background 0.2s, box-shadow 0.2s, border-radius 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00ff0020';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2a2a2a';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ fontSize: '1.2em' }}>
                                🛡️ Armor Slots
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedArmorSlots.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showArmorSlots ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {/* Collapsible Content */}
                        {showArmorSlots && (
                            <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderTop: 'none',
                                borderRadius: '0 0 5px 5px',
                                padding: '8px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {/* Select All Option */}
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 6px',
                                        marginBottom: '6px',
                                        background: selectedArmorSlots.length === armorSlots.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedArmorSlots.length === armorSlots.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedArmorSlots.length === armorSlots.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedArmorSlots.length === armorSlots.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedArmorSlots.length === armorSlots.length}
                                        onChange={() => {
                                            if (selectedArmorSlots.length === armorSlots.length) {
                                                setSelectedArmorSlots([]);
                                            } else {
                                                setSelectedArmorSlots([...armorSlots]);
                                            }
                                        }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            marginRight: '10px',
                                            cursor: 'pointer',
                                            accentColor: '#00ff00'
                                        }}
                                    />
                                    <span style={{ 
                                        flex: 1,
                                        color: selectedArmorSlots.length === armorSlots.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Armor Slot Checkboxes */}
                                {armorSlots.map(slot => (
                                    <label
                                        key={slot}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px',
                                            marginBottom: '3px',
                                            background: selectedArmorSlots.includes(slot) ? '#00ff0020' : 'transparent',
                                            border: `1px solid ${selectedArmorSlots.includes(slot) ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.1em'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedArmorSlots.includes(slot)) {
                                                e.currentTarget.style.background = '#00ff0010';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedArmorSlots.includes(slot)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedArmorSlots.includes(slot)}
                                            onChange={() => {
                                                setSelectedArmorSlots(prev => {
                                                    if (prev.includes(slot)) {
                                                        return prev.filter(s => s !== slot);
                                                    } else {
                                                        return [...prev, slot];
                                                    }
                                                });
                                            }}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                marginRight: '10px',
                                                cursor: 'pointer',
                                                accentColor: '#00ff00'
                                            }}
                                        />
                                        <span style={{ 
                                            flex: 1,
                                            color: selectedArmorSlots.includes(slot) ? '#00ff00' : '#aaa'
                                        }}>
                                            {slot}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.9em',
                                            color: '#888',
                                            marginLeft: '8px'
                                        }}>
                                            ({items.filter(item => item.Slot === slot).length})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Item Effects Filter - Collapsible and Searchable */}
                {allEffects.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        {/* Collapsible Header */}
                        <div 
                            onClick={() => setShowEffects(!showEffects)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: showEffects ? '5px 5px 0 0' : '5px',
                                cursor: 'pointer',
                                transition: 'background 0.2s, box-shadow 0.2s, border-radius 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00ff0020';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2a2a2a';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ fontSize: '1.2em' }}>
                                ✨ Item Effects
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedEffects.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showEffects ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {/* Collapsible Content */}
                        {showEffects && (
                            <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderTop: 'none',
                                borderRadius: '0 0 5px 5px',
                                padding: '8px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {/* Search Box */}
                                <input
                                    type="text"
                                    placeholder="🔍 Search effects..."
                                    value={effectSearchTerm}
                                    onChange={(e) => setEffectSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '8px',
                                        background: '#1a1a1a',
                                        border: '2px solid #00ff00',
                                        borderRadius: '3px',
                                        color: '#00ff00',
                                        fontSize: '1em',
                                        fontFamily: 'VT323, monospace',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />

                                {/* Select All Option */}
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 6px',
                                        marginBottom: '6px',
                                        background: selectedEffects.length === allEffects.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedEffects.length === allEffects.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedEffects.length === allEffects.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedEffects.length === allEffects.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedEffects.length === allEffects.length}
                                        onChange={() => {
                                            if (selectedEffects.length === allEffects.length) {
                                                setSelectedEffects([]);
                                            } else {
                                                setSelectedEffects([...allEffects]);
                                            }
                                        }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            marginRight: '10px',
                                            cursor: 'pointer',
                                            accentColor: '#00ff00'
                                        }}
                                    />
                                    <span style={{ 
                                        flex: 1,
                                        color: selectedEffects.length === allEffects.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Effect Checkboxes */}
                                {allEffects
                                    .filter(effect => effect.toLowerCase().includes(effectSearchTerm.toLowerCase()))
                                    .map(effect => {
                                        // Calculate count based on items that match ALL other filters (excluding effects filter)
                                        const effectCount = items.filter(item => {
                                            // Apply all other filters first
                                            // Search filter
                                            if (searchTerm) {
                                                const cleanName = cleanItemName(item.Name);
                                                if (!cleanName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                                    !item.Description?.toLowerCase().includes(searchTerm.toLowerCase())) {
                                                    return false;
                                                }
                                            }
                                            
                                            // Type filter
                                            if (selectedTypes.length > 0) {
                                                if (!item.Type || !selectedTypes.includes(item.Type)) {
                                                    return false;
                                                }
                                            }
                                            
                                            // Weapon type filter
                                            if (selectedWeaponTypes.length > 0) {
                                                if (!item.WeaponType || !selectedWeaponTypes.includes(item.WeaponType)) {
                                                    return false;
                                                }
                                            }
                                            
                                            // Level filter
                                            const itemLevel = item.Level || 0;
                                            if (itemLevel < minLevel || itemLevel > maxLevel) {
                                                return false;
                                            }
                                            
                                            // Value filter
                                            const itemValue = item.Value || 0;
                                            if (itemValue < minValue || itemValue > maxValue) {
                                                return false;
                                            }
                                            
                                            // Damage filter
                                            const itemDamage = item.Damage || 0;
                                            if (itemDamage < minDamage || itemDamage > maxDamage) {
                                                return false;
                                            }
                                            
                                            // Weight filter
                                            const itemWeight = item.Weight || 0;
                                            if (itemWeight < minWeight || itemWeight > maxWeight) {
                                                return false;
                                            }
                                            
                                            // Required level filter
                                            const itemRequiredLevel = item.RequiredLevel || 0;
                                            if (itemRequiredLevel < minRequiredLevel || itemRequiredLevel > maxRequiredLevel) {
                                                return false;
                                            }
                                            
                                            // Now check if item has this specific effect
                                            const itemEffects = [];
                                            if (item.ItemEffects && Array.isArray(item.ItemEffects)) {
                                                itemEffects.push(...item.ItemEffects.map(e => e?.trim()).filter(Boolean));
                                            }
                                            if (item.PotionEffect) itemEffects.push(item.PotionEffect.trim());
                                            if (item.PoisonEffect) itemEffects.push(item.PoisonEffect.trim());
                                            if (item.ScrollEffect) itemEffects.push(item.ScrollEffect.trim());
                                            if (item.UsableSpell) itemEffects.push(item.UsableSpell.trim());
                                            if (item.ProcSpellName) itemEffects.push(item.ProcSpellName.trim());
                                            return itemEffects.includes(effect);
                                        }).length;

                                        return (
                                            <label
                                                key={effect}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '6px',
                                                    marginBottom: '3px',
                                                    background: selectedEffects.includes(effect) ? '#00ff0020' : 'transparent',
                                                    border: `1px solid ${selectedEffects.includes(effect) ? '#00ff00' : '#555'}`,
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '1.1em'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!selectedEffects.includes(effect)) {
                                                        e.currentTarget.style.background = '#00ff0010';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!selectedEffects.includes(effect)) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEffects.includes(effect)}
                                                    onChange={() => {
                                                        setSelectedEffects(prev => {
                                                            if (prev.includes(effect)) {
                                                                return prev.filter(e => e !== effect);
                                                            } else {
                                                                return [...prev, effect];
                                                            }
                                                        });
                                                    }}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        marginRight: '10px',
                                                        cursor: 'pointer',
                                                        accentColor: '#00ff00'
                                                    }}
                                                />
                                                <span style={{ 
                                                    flex: 1,
                                                    color: selectedEffects.includes(effect) ? '#00ff00' : '#aaa'
                                                }}>
                                                    {effect}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.9em',
                                                    color: '#888',
                                                    marginLeft: '8px'
                                                }}>
                                                    ({effectCount})
                                                </span>
                                            </label>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {/* Mob Filter - Filter items by mob drops */}
                {mobs.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        {/* Collapsible Header */}
                        <div 
                            onClick={() => setShowMobFilter(!showMobFilter)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #ff6600',
                                borderRadius: showMobFilter ? '5px 5px 0 0' : '5px',
                                cursor: 'pointer',
                                transition: 'background 0.2s, box-shadow 0.2s, border-radius 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff660020';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 102, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2a2a2a';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ fontSize: '1.2em' }}>
                                👹 Filter by Mob Drops
                                {selectedMobForDrops && (
                                    <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                        ({cleanMobName(selectedMobForDrops.Name)})
                                    </span>
                                )}
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showMobFilter ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {/* Collapsible Content */}
                        {showMobFilter && (
                            <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #ff6600',
                                borderTop: 'none',
                                borderRadius: '0 0 5px 5px',
                                padding: '8px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {/* Search Box */}
                                <input
                                    type="text"
                                    placeholder="🔍 Search mobs..."
                                    value={mobSearchTerm}
                                    onChange={(e) => setMobSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '8px',
                                        background: '#1a1a1a',
                                        border: '2px solid #ff6600',
                                        borderRadius: '3px',
                                        color: '#ff6600',
                                        fontSize: '1em',
                                        fontFamily: 'VT323, monospace',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 10px rgba(255, 102, 0, 0.5)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />

                                {/* Clear Filter Button */}
                                {selectedMobForDrops && (
                                    <button
                                        onClick={() => setSelectedMobForDrops(null)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            marginBottom: '12px',
                                            background: '#ff0000',
                                            border: '2px solid #ff6600',
                                            borderRadius: '3px',
                                            color: '#fff',
                                            fontSize: '1.1em',
                                            fontFamily: 'VT323, monospace',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#cc0000';
                                            e.target.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#ff0000';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        ✕ Clear Mob Filter
                                    </button>
                                )}

                                {/* Mob List */}
                                {mobs
                                    .filter(mob => {
                                        const mobName = cleanMobName(mob.Name).toLowerCase();
                                        return mobName.includes(mobSearchTerm.toLowerCase()) &&
                                               mob.DroppedItems && 
                                               Array.isArray(mob.DroppedItems) && 
                                               mob.DroppedItems.length > 0;
                                    })
                                    .sort((a, b) => cleanMobName(a.Name).localeCompare(cleanMobName(b.Name)))
                                    .map(mob => {
                                        const itemCount = mob.DroppedItems.length;
                                        const isSelected = selectedMobForDrops?.Id === mob.Id;

                                        return (
                                            <div
                                                key={mob.Id}
                                                onClick={() => setSelectedMobForDrops(isSelected ? null : mob)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '8px',
                                                    marginBottom: '4px',
                                                    background: isSelected ? '#ff660030' : 'transparent',
                                                    border: `2px solid ${isSelected ? '#ff6600' : '#555'}`,
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '1.1em'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.background = '#ff660015';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                <MobSprite 
                                                    mobId={mob.Id} 
                                                    size={32}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <span style={{ 
                                                    flex: 1,
                                                    color: isSelected ? '#ff6600' : '#aaa'
                                                }}>
                                                    {cleanMobName(mob.Name)}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.9em',
                                                    color: '#888',
                                                    marginLeft: '8px'
                                                }}>
                                                    Lvl {mob.Level}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.9em',
                                                    color: '#888',
                                                    marginLeft: '8px'
                                                }}>
                                                    ({itemCount} items)
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {/* Level Range Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        📈 Level Range: 
                        <input 
                            type="number"
                            value={minLevel}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === '-') {
                                    setMinLevel(0);
                                } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue)) {
                                        setMinLevel(Math.max(0, Math.min(absoluteMaxLevel, numValue)));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setMinLevel(Math.max(0, Math.min(absoluteMaxLevel, value)));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max={absoluteMaxLevel}
                            style={{
                                width: '60px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ffff00',
                                borderRadius: '3px',
                                color: '#ffff00',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: '#ffff00', margin: '0 8px' }}>-</span>
                        <input 
                            type="number"
                            value={maxLevel}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === '-') {
                                    setMaxLevel(0);
                                } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue)) {
                                        setMaxLevel(Math.max(0, Math.min(absoluteMaxLevel, numValue)));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setMaxLevel(Math.max(0, Math.min(absoluteMaxLevel, value)));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max={absoluteMaxLevel}
                            style={{
                                width: '60px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ffff00',
                                borderRadius: '3px',
                                color: '#ffff00',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                    </label>
                    
                    {/* Dual Thumb Range Slider */}
                    <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
                        {/* Track Background */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '0',
                            right: '0',
                            height: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #555',
                            borderRadius: '5px'
                        }} />
                        
                        {/* Selected Range Highlight */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: `${(minLevel / absoluteMaxLevel) * 100}%`,
                            width: `${((maxLevel - minLevel) / absoluteMaxLevel) * 100}%`,
                            height: '8px',
                            background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff6600)',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                        }} />
                        
                        {/* Max Level Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-max-level"
                            min="0"
                            max={absoluteMaxLevel}
                            value={maxLevel}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= minLevel) {
                                    setMaxLevel(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 4
                            }}
                        />
                        
                        {/* Min Level Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-min-level"
                            min="0"
                            max={absoluteMaxLevel}
                            value={minLevel}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value <= maxLevel) {
                                    setMinLevel(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 5
                            }}
                        />
                    </div>
                </div>

                {/* Value Range Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        💰 Value Range: 
                        <input 
                            type="number"
                            value={minValue}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxValue, parseInt(e.target.value) || 0));
                                setMinValue(value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '100px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ffd700',
                                borderRadius: '3px',
                                color: '#ffd700',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: '#ffd700', margin: '0 8px' }}>-</span>
                        <input 
                            type="number"
                            value={maxValue}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxValue, parseInt(e.target.value) || 0));
                                setMaxValue(value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '100px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ffd700',
                                borderRadius: '3px',
                                color: '#ffd700',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                    </label>
                    
                    {/* Dual Thumb Range Slider */}
                    <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
                        {/* Track Background */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '0',
                            right: '0',
                            height: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #555',
                            borderRadius: '5px'
                        }} />
                        
                        {/* Selected Range Highlight */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: `${(minValue / absoluteMaxValue) * 100}%`,
                            width: `${((maxValue - minValue) / absoluteMaxValue) * 100}%`,
                            height: '8px',
                            background: 'linear-gradient(90deg, #ffd700, #ffaa00, #ff6600)',
                            border: '2px solid #ffd700',
                            borderRadius: '5px',
                            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                        }} />
                        
                        {/* Max Value Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-max-value"
                            min="0"
                            max={absoluteMaxValue}
                            step="100"
                            value={maxValue}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= minValue) {
                                    setMaxValue(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 4
                            }}
                        />
                        
                        {/* Min Value Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-min-value"
                            min="0"
                            max={absoluteMaxValue}
                            step="100"
                            value={minValue}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value <= maxValue) {
                                    setMinValue(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 5
                            }}
                        />
                    </div>
                </div>

                {/* Damage Range Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        ⚔️ Damage Range: 
                        <input 
                            type="number"
                            value={minDamage}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxDamage, parseInt(e.target.value) || 0));
                                setMinDamage(value);
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '80px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ff6600',
                                borderRadius: '3px',
                                color: '#ff6600',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: '#ff6600', margin: '0 8px' }}>-</span>
                        <input 
                            type="number"
                            value={maxDamage}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxDamage, parseInt(e.target.value) || 0));
                                setMaxDamage(value);
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '80px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ff6600',
                                borderRadius: '3px',
                                color: '#ff6600',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                    </label>
                    
                    {/* Dual Thumb Range Slider */}
                    <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
                        {/* Track Background */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '0',
                            right: '0',
                            height: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #555',
                            borderRadius: '5px'
                        }} />
                        
                        {/* Selected Range Highlight */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: `${(minDamage / absoluteMaxDamage) * 100}%`,
                            width: `${((maxDamage - minDamage) / absoluteMaxDamage) * 100}%`,
                            height: '8px',
                            background: 'linear-gradient(90deg, #ff6600, #ff0000, #aa0000)',
                            border: '2px solid #ff6600',
                            borderRadius: '5px',
                            boxShadow: '0 0 10px rgba(255, 102, 0, 0.5)'
                        }} />
                        
                        {/* Max Damage Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-max-damage"
                            min="0"
                            max={absoluteMaxDamage}
                            step="1"
                            value={maxDamage}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= minDamage) {
                                    setMaxDamage(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 4
                            }}
                        />
                        
                        {/* Min Damage Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-min-damage"
                            min="0"
                            max={absoluteMaxDamage}
                            step="1"
                            value={minDamage}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value <= maxDamage) {
                                    setMinDamage(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 5
                            }}
                        />
                    </div>
                </div>

                {/* Weight Range Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        ⚖️ Weight Range: 
                        <input 
                            type="number"
                            value={minWeight}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxWeight, parseInt(e.target.value) || 0));
                                setMinWeight(value);
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '70px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #888',
                                borderRadius: '3px',
                                color: '#888',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: '#888', margin: '0 8px' }}>-</span>
                        <input 
                            type="number"
                            value={maxWeight}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxWeight, parseInt(e.target.value) || 0));
                                setMaxWeight(value);
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '70px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #888',
                                borderRadius: '3px',
                                color: '#888',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                    </label>
                    
                    {/* Dual Thumb Range Slider */}
                    <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
                        {/* Track Background */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '0',
                            right: '0',
                            height: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #555',
                            borderRadius: '5px'
                        }} />
                        
                        {/* Selected Range Highlight */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: `${(minWeight / absoluteMaxWeight) * 100}%`,
                            width: `${((maxWeight - minWeight) / absoluteMaxWeight) * 100}%`,
                            height: '8px',
                            background: 'linear-gradient(90deg, #666, #aaa)',
                            border: '2px solid #888',
                            borderRadius: '5px',
                            boxShadow: '0 0 10px rgba(136, 136, 136, 0.5)'
                        }} />
                        
                        {/* Max Weight Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-max-weight"
                            min="0"
                            max={absoluteMaxWeight}
                            step="1"
                            value={maxWeight}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= minWeight) {
                                    setMaxWeight(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 4
                            }}
                        />
                        
                        {/* Min Weight Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-min-weight"
                            min="0"
                            max={absoluteMaxWeight}
                            step="1"
                            value={minWeight}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value <= maxWeight) {
                                    setMinWeight(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 5
                            }}
                        />
                    </div>
                </div>

                {/* Required Level Range Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        🎓 Required Level: 
                        <input 
                            type="number"
                            value={minRequiredLevel}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxRequiredLevel, parseInt(e.target.value) || 0));
                                setMinRequiredLevel(value);
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '70px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #00aaff',
                                borderRadius: '3px',
                                color: '#00aaff',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: '#00aaff', margin: '0 8px' }}>-</span>
                        <input 
                            type="number"
                            value={maxRequiredLevel}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxRequiredLevel, parseInt(e.target.value) || 0));
                                setMaxRequiredLevel(value);
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '70px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #00aaff',
                                borderRadius: '3px',
                                color: '#00aaff',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                    </label>
                    
                    {/* Dual Thumb Range Slider */}
                    <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
                        {/* Track Background */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '0',
                            right: '0',
                            height: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #555',
                            borderRadius: '5px'
                        }} />
                        
                        {/* Selected Range Highlight */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: `${(minRequiredLevel / absoluteMaxRequiredLevel) * 100}%`,
                            width: `${((maxRequiredLevel - minRequiredLevel) / absoluteMaxRequiredLevel) * 100}%`,
                            height: '8px',
                            background: 'linear-gradient(90deg, #00aaff, #0077cc)',
                            border: '2px solid #00aaff',
                            borderRadius: '5px',
                            boxShadow: '0 0 10px rgba(0, 170, 255, 0.5)'
                        }} />
                        
                        {/* Max Required Level Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-max-req-level"
                            min="0"
                            max={absoluteMaxRequiredLevel}
                            step="1"
                            value={maxRequiredLevel}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= minRequiredLevel) {
                                    setMaxRequiredLevel(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 4
                            }}
                        />
                        
                        {/* Min Required Level Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-min-req-level"
                            min="0"
                            max={absoluteMaxRequiredLevel}
                            step="1"
                            value={minRequiredLevel}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value <= maxRequiredLevel) {
                                    setMinRequiredLevel(value);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '40px',
                                background: 'transparent',
                                pointerEvents: 'auto',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                zIndex: 5
                            }}
                        />
                    </div>
                </div>

                {/* Sort */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em' }}>
                        📊 Sort By:
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            color: '#00ff00',
                            fontSize: '1.1em',
                            fontFamily: 'VT323, monospace',
                            cursor: 'pointer',
                            borderRadius: '3px'
                        }}
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="level">Level (High-Low)</option>
                        <option value="value">Value (High-Low)</option>
                        <option value="damage">Damage (High-Low)</option>
                    </select>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={() => {
                        setSearchTerm('');
                        setSelectedTypes([]); // Reset to 0 selected
                        setSelectedWeaponTypes([]); // Reset to 0 selected
                        setSelectedArmorSlots([]); // Reset to 0 selected
                        setSelectedEffects([]); // Reset to 0 selected
                        setEffectSearchTerm(''); // Clear effect search
                        setSortBy('name');
                        setMinLevel(0);
                        setMaxLevel(absoluteMaxLevel);
                        setMinValue(0);
                        setMaxValue(absoluteMaxValue);
                        setMinDamage(0);
                        setMaxDamage(absoluteMaxDamage);
                        setMinWeight(0);
                        setMaxWeight(absoluteMaxWeight);
                        setMinRequiredLevel(0);
                        setMaxRequiredLevel(absoluteMaxRequiredLevel);
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#2a2a2a',
                        border: '2px solid #ff6600',
                        color: '#ff6600',
                        fontSize: '1.2em',
                        fontFamily: 'VT323, monospace',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#ff6600';
                        e.target.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#2a2a2a';
                        e.target.style.color = '#ff6600';
                    }}
                >
                    Clear Filters
                </button>
            </div>

            {/* Main Content - Item List */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px',
                    paddingBottom: '40px'
                }}>
                    {/* Pagination Info */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        padding: '15px 20px',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
                        border: '2px solid #00ff00',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(0, 255, 0, 0.1)'
                    }}>
                    <div style={{ fontSize: '1.3em' }}>
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '10px 20px',
                                background: currentPage === 1 ? '#1a1a1a' : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                                border: '2px solid #00ff00',
                                color: currentPage === 1 ? '#555' : '#00ff00',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '1.1em',
                                fontFamily: 'VT323, monospace',
                                borderRadius: '5px',
                                transition: 'all 0.2s',
                                boxShadow: currentPage === 1 ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== 1) {
                                    e.target.style.background = '#00ff00';
                                    e.target.style.color = '#000';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 0, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== 1) {
                                    e.target.style.background = 'linear-gradient(135deg, #2a2a2a, #1a1a1a)';
                                    e.target.style.color = '#00ff00';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                                }
                            }}
                        >
                            ← Prev
                        </button>
                        <span style={{ 
                            fontSize: '1.3em', 
                            padding: '8px 16px',
                            color: '#ffff00',
                            fontWeight: 'bold'
                        }}>
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '10px 20px',
                                background: currentPage === totalPages ? '#1a1a1a' : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                                border: '2px solid #00ff00',
                                color: currentPage === totalPages ? '#555' : '#00ff00',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '1.1em',
                                fontFamily: 'VT323, monospace',
                                borderRadius: '5px',
                                transition: 'all 0.2s',
                                boxShadow: currentPage === totalPages ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== totalPages) {
                                    e.target.style.background = '#00ff00';
                                    e.target.style.color = '#000';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 0, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== totalPages) {
                                    e.target.style.background = 'linear-gradient(135deg, #2a2a2a, #1a1a1a)';
                                    e.target.style.color = '#00ff00';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                                }
                            }}
                        >
                            Next →
                        </button>
                    </div>
                </div>

                    {/* Item Table */}
                    <div style={{
                        background: '#101010',
                        border: '2px solid #00ff00',
                        borderRadius: '8px',
                        boxShadow: '0 0 25px rgba(0, 255, 0, 0.15)'
                    }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse', 
                            fontSize: '1.1em',
                            tableLayout: 'fixed',
                            minWidth: '1000px'
                        }}>
                        <thead>
                            <tr style={{
                                background: '#00ff0025',
                                color: '#00ff00',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>📦</th>
                                <th style={{ padding: '12px 14px', width: '30%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Item Name</th>
                                <th style={{ padding: '12px 14px', width: '15%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Type</th>
                                <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>Level</th>
                                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>DMG</th>
                                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>ARM</th>
                                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>Value</th>
                                <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>Effects</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ?
                                (
                                    <tr>
                                        <td colSpan="8" style={{ 
                                            textAlign: 'center', 
                                            padding: '40px', 
                                            color: '#888',
                                            fontSize: '1.2em'
                                        }}>
                                            <div style={{ marginBottom: '15px', fontSize: '2em' }}>🔍</div>
                                            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>No items found</div>
                                            <div style={{ fontSize: '0.9em', color: '#666' }}>Try adjusting your filters or search term</div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map(item => (
                                        <tr
                                            key={item.Id}
                                            onClick={() => {
                                                isManualSelection.current = true;
                                                setSelectedItem(item);
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #00ff0020',
                                                transition: 'all 0.2s',
                                                background: selectedItem?.Id === item.Id ? '#00ff0015' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedItem?.Id !== item.Id) {
                                                    e.currentTarget.style.background = '#00ff0010';
                                                }
                                                e.currentTarget.style.boxShadow = `inset 0 0 20px ${getRarityColor(item)}30`;
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedItem?.Id !== item.Id) {
                                                    e.currentTarget.style.background = 'transparent';
                                                }
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Item Icon */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'center',
                                                fontSize: '1.8em',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {getItemIcon(item)}
                                            </td>
                                            
                                            {/* Item Name */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                color: getRarityColor(item),
                                                fontWeight: 'bold',
                                                fontSize: '1.1em',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {cleanItemName(item.Name) || 'Unknown Item'}
                                            </td>
                                            
                                            {/* Type */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                color: '#aaa',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {item.Type || 'Unknown'}
                                                {item.WeaponType && (
                                                    <div style={{ fontSize: '0.9em', color: '#888' }}>
                                                        {item.WeaponType}
                                                    </div>
                                                )}
                                                {item.ArmorSlot && (
                                                    <div style={{ fontSize: '0.9em', color: '#888' }}>
                                                        {item.ArmorSlot}
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* Level */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'center',
                                                color: '#ffff00',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {item.Level > 0 ? item.Level : '-'}
                                            </td>
                                            
                                            {/* Damage */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'right',
                                                color: '#ff6600',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {item.Damage > 0 ? item.Damage : '-'}
                                            </td>
                                            
                                            {/* Armor */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'right',
                                                color: '#00aaff',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {item.Armor > 0 ? item.Armor : '-'}
                                            </td>
                                            
                                            {/* Value */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'right',
                                                color: '#ffd700',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {item.Value > 0 ? item.Value.toLocaleString() : '-'}
                                            </td>
                                            
                                            {/* Effects */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'center',
                                                color: '#ff00ff',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {getItemEffectCount(item) > 0 ? `✨ ${getItemEffectCount(item)}` : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )
                            }
                        </tbody>
                    </table>
                </div>
                </div>
            </div>

            {/* Right Panel - Item Details */}
            {selectedItem && (
                <div style={{
                    width: '420px',
                    background: 'linear-gradient(180deg, #0f0f0f 0%, #050505 100%)',
                    borderLeft: `4px solid ${getRarityColor(selectedItem)}`,
                    padding: '25px',
                    paddingBottom: '40px',
                    overflowY: 'auto',
                    flexShrink: 0,
                    boxShadow: `-8px 0 25px rgba(0, 0, 0, 0.7), inset 0 0 30px ${getRarityColor(selectedItem)}15`,
                    position: 'relative'
                }}>
                    {/* Share Button */}
                    <button
                        onClick={() => handleShareItem(selectedItem)}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '60px',
                            zIndex: 100,
                            background: 'transparent',
                            border: '2px solid #00ff00',
                            color: '#00ff00',
                            width: '35px',
                            height: '35px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '1.2em',
                            fontFamily: 'VT323, monospace',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#00ff00';
                            e.target.style.color = '#000';
                            e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#00ff00';
                            e.target.style.boxShadow = 'none';
                        }}
                        title="Share this item"
                    >
                        🔗
                    </button>
                    
                    {/* Share Tooltip */}
                    {shareTooltip && (
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            right: '60px',
                            background: '#00ff00',
                            color: '#000',
                            padding: '8px 12px',
                            borderRadius: '3px',
                            fontSize: '1em',
                            fontFamily: 'VT323, monospace',
                            fontWeight: 'bold',
                            boxShadow: '0 0 15px rgba(0, 255, 0, 0.8)',
                            zIndex: 1000,
                            whiteSpace: 'nowrap'
                        }}>
                            {shareTooltip}
                        </div>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={() => {
                            isManualSelection.current = true;
                            setSelectedItem(null);
                        }}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            zIndex: 100,
                            background: 'transparent',
                            border: '2px solid #ff0000',
                            color: '#ff0000',
                            width: '35px',
                            height: '35px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '1.4em',
                            fontFamily: 'VT323, monospace',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#ff0000';
                            e.target.style.color = '#000';
                            e.target.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#ff0000';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        ✕
                    </button>

                    {/* Item Header */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '25px',
                        paddingBottom: '20px',
                        borderBottom: `2px solid ${getRarityColor(selectedItem)}`
                    }}>
                        <div style={{ 
                            fontSize: '4em', 
                            marginBottom: '10px',
                            filter: `drop-shadow(0 0 10px ${getRarityColor(selectedItem)})`
                        }}>
                            {getItemIcon(selectedItem)}
                        </div>
                        <h2 style={{
                            fontSize: '2.2em',
                            color: getRarityColor(selectedItem),
                            marginBottom: '8px',
                            textShadow: `0 0 10px ${getRarityColor(selectedItem)}80`,
                            fontWeight: 'bold'
                        }}>
                            {cleanItemName(selectedItem.Name)}
                        </h2>
                        <div style={{ 
                            color: '#888', 
                            fontSize: '1.2em',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            {selectedItem.Type} {selectedItem.WeaponType && `- ${selectedItem.WeaponType}`}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div style={{
                        background: '#1a1a1a',
                        border: '2px solid #00ff00',
                        borderRadius: '3px',
                        padding: '18px',
                        marginBottom: '15px',
                        boxShadow: 'inset 0 0 20px rgba(0, 255, 0, 0.1)'
                    }}>
                        <h3 style={{ 
                            color: '#00ff00', 
                            marginBottom: '12px', 
                            fontSize: '1.6em',
                            borderBottom: '1px solid #00ff0040',
                            paddingBottom: '8px'
                        }}>
                            Stats:
                        </h3>
                        <div style={{ fontSize: '1.2em', lineHeight: '2', color: '#aaa' }}>
                            {selectedItem.Level > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Level:</span>
                                    <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{selectedItem.Level}</span>
                                </div>
                            )}
                            {selectedItem.Damage > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Damage:</span>
                                    <span style={{ color: '#ff6600', fontWeight: 'bold' }}>{selectedItem.Damage}</span>
                                </div>
                            )}
                            {selectedItem.Armor > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Armor:</span>
                                    <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{selectedItem.Armor}</span>
                                </div>
                            )}
                            {selectedItem.Health > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Health:</span>
                                    <span style={{ color: '#ff0066', fontWeight: 'bold' }}>+{selectedItem.Health}</span>
                                </div>
                            )}
                            {selectedItem.Mana > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Mana:</span>
                                    <span style={{ color: '#6666ff', fontWeight: 'bold' }}>+{selectedItem.Mana}</span>
                                </div>
                            )}
                            {selectedItem.Stamina > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Stamina:</span>
                                    <span style={{ color: '#ffff00', fontWeight: 'bold' }}>+{selectedItem.Stamina}</span>
                                </div>
                            )}
                            {selectedItem.Value > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Value:</span>
                                    <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{selectedItem.Value} gold</span>
                                </div>
                            )}
                            {selectedItem.Weight > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Weight:</span>
                                    <span style={{ color: '#999', fontWeight: 'bold' }}>{selectedItem.Weight}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requirements Section */}
                    {(selectedItem.RequiredLevel > 0 || selectedItem.RequiredStr > 0 || selectedItem.RequiredAgi > 0 || 
                      selectedItem.RequiredInt > 0 || selectedItem.RequiredClass) && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #ffaa00',
                            borderRadius: '3px',
                            padding: '18px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(255, 170, 0, 0.1)'
                        }}>
                            <h3 style={{ 
                                color: '#ffaa00', 
                                marginBottom: '12px', 
                                fontSize: '1.6em',
                                borderBottom: '1px solid #ffaa0040',
                                paddingBottom: '8px'
                            }}>
                                Requirements:
                            </h3>
                            <div style={{ fontSize: '1.2em', lineHeight: '2', color: '#aaa' }}>
                                {selectedItem.RequiredLevel > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Level:</span>
                                        <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{selectedItem.RequiredLevel}</span>
                                    </div>
                                )}
                                {selectedItem.RequiredStr > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Strength:</span>
                                        <span style={{ color: '#ff6600', fontWeight: 'bold' }}>{selectedItem.RequiredStr}</span>
                                    </div>
                                )}
                                {selectedItem.RequiredAgi > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Agility:</span>
                                        <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{selectedItem.RequiredAgi}</span>
                                    </div>
                                )}
                                {selectedItem.RequiredInt > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Intelligence:</span>
                                        <span style={{ color: '#6666ff', fontWeight: 'bold' }}>{selectedItem.RequiredInt}</span>
                                    </div>
                                )}
                                {selectedItem.RequiredFoc > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Focus:</span>
                                        <span style={{ color: '#ff00ff', fontWeight: 'bold' }}>{selectedItem.RequiredFoc}</span>
                                    </div>
                                )}
                                {selectedItem.RequiredClass && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Class:</span>
                                        <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{selectedItem.RequiredClass}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Item Effects Section */}
                    {(selectedItem.ItemEffects?.length > 0 || selectedItem.PotionEffect || selectedItem.PoisonEffect || 
                      selectedItem.ScrollEffect || selectedItem.UsableSpell || selectedItem.ProcSpellName) && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #ff00ff',
                            borderRadius: '3px',
                            padding: '18px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(255, 0, 255, 0.1)'
                        }}>
                            <h3 style={{ 
                                color: '#ff00ff', 
                                marginBottom: '12px', 
                                fontSize: '1.6em',
                                borderBottom: '1px solid #ff00ff40',
                                paddingBottom: '8px'
                            }}>
                                Item Effects:
                            </h3>
                            <div style={{ fontSize: '1.2em', lineHeight: '2', color: '#aaa' }}>
                                {/* Item Effects Array */}
                                {selectedItem.ItemEffects?.length > 0 && selectedItem.ItemEffects.map((effect, idx) => (
                                    <div key={idx} style={{ 
                                        marginBottom: '4px',
                                        padding: '4px 6px',
                                        background: '#0a0a0a',
                                        borderRadius: '3px',
                                        border: '1px solid #ff00ff40'
                                    }}>
                                        <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>
                                            Effect {idx + 1}:
                                        </div>
                                        <div style={{ color: '#ccc', fontSize: '0.95em', marginLeft: '10px' }}>
                                            {typeof effect === 'string' ? effect : JSON.stringify(effect)}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Potion Effect */}
                                {selectedItem.PotionEffect && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>🧪 Potion Effect:</span>
                                        <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
                                            {selectedItem.PotionEffect}
                                            {selectedItem.PotionEffectValue > 0 && ` (${selectedItem.PotionEffectValue})`}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Poison Effect */}
                                {selectedItem.PoisonEffect && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>☠️ Poison Effect:</span>
                                        <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                                            {selectedItem.PoisonEffect}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Scroll Effect */}
                                {selectedItem.ScrollEffect && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>📜 Scroll Effect:</span>
                                        <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                                            {selectedItem.ScrollEffect}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Usable Spell */}
                                {selectedItem.UsableSpell && (
                                    <div style={{ marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>✨ Usable Spell:</span>
                                            <span style={{ color: '#6666ff', fontWeight: 'bold' }}>
                                                {selectedItem.UsableSpell}
                                            </span>
                                        </div>
                                        {selectedItem.UsableSpellLevel > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginLeft: '20px' }}>
                                                <span>Level:</span>
                                                <span style={{ color: '#8888ff' }}>{selectedItem.UsableSpellLevel}</span>
                                            </div>
                                        )}
                                        {selectedItem.UsableSpellRechargeTime > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginLeft: '20px' }}>
                                                <span>Recharge:</span>
                                                <span style={{ color: '#8888ff' }}>{selectedItem.UsableSpellRechargeTime}s</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Proc Spell */}
                                {selectedItem.ProcSpellName && (
                                    <div style={{ marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>⚡ Proc Spell:</span>
                                            <span style={{ color: '#ff6600', fontWeight: 'bold' }}>
                                                {selectedItem.ProcSpellName}
                                            </span>
                                        </div>
                                        {selectedItem.ProcTrigger && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginLeft: '20px' }}>
                                                <span>Trigger:</span>
                                                <span style={{ color: '#ff8833' }}>{selectedItem.ProcTrigger}</span>
                                            </div>
                                        )}
                                        {selectedItem.ProcChance > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginLeft: '20px' }}>
                                                <span>Chance:</span>
                                                <span style={{ color: '#ff8833' }}>{selectedItem.ProcChance}%</span>
                                            </div>
                                        )}
                                        {selectedItem.ProcLevel > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginLeft: '20px' }}>
                                                <span>Level:</span>
                                                <span style={{ color: '#ff8833' }}>{selectedItem.ProcLevel}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description Section */}
                    {selectedItem.Description && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #666',
                            borderRadius: '3px',
                            padding: '18px',
                            marginBottom: '15px',
                            fontSize: '1.1em',
                            color: '#ccc',
                            lineHeight: '1.8',
                            fontStyle: 'italic'
                        }}>
                            <div style={{ 
                                color: '#888', 
                                fontSize: '0.9em', 
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                Description:
                            </div>
                            {selectedItem.Description}
                        </div>
                    )}

                    {/* Dropped By Section */}
                    {(() => {
                        const droppingMobs = getMobsThatDropItem(selectedItem);
                        if (droppingMobs.length > 0) {
                            return (
                                <div style={{
                                    background: '#1a1a1a',
                                    border: '2px solid #ff6600',
                                    borderRadius: '3px',
                                    padding: '18px',
                                    marginBottom: '15px',
                                    boxShadow: 'inset 0 0 20px rgba(255, 102, 0, 0.1)'
                                }}>
                                    <h3 style={{ 
                                        color: '#ff6600', 
                                        marginBottom: '12px', 
                                        fontSize: '1.6em',
                                        borderBottom: '1px solid #ff660040',
                                        paddingBottom: '8px'
                                    }}>
                                        👹 Dropped By ({droppingMobs.length}):
                                    </h3>
                                    <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden'
                                    }}>
                                        {droppingMobs.map((mob, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedMobToNavigate(mob);
                                                    setShowMobNavigationConfirm(true);
                                                }}
                                                style={{
                                                    padding: '10px',
                                                    background: '#0a0a0a',
                                                    borderRadius: '3px',
                                                    border: '1px solid #ff660040',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#1a1a0a';
                                                    e.currentTarget.style.borderColor = '#ff6600';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#0a0a0a';
                                                    e.currentTarget.style.borderColor = '#ff660040';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}>
                                                {/* Mob Sprite */}
                                                <div style={{ 
                                                    width: '48px',
                                                    height: '48px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#1a1a1a',
                                                    border: '2px solid #ff6600',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 0 8px rgba(255, 102, 0, 0.4)',
                                                    padding: '2px',
                                                    flexShrink: 0
                                                }}>
                                                    <MobSprite 
                                                        mobId={mob.Id}
                                                        size={48}
                                                        alt={cleanMobName(mob.Name)}
                                                        lazy={true}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%'
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Mob Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ 
                                                        color: '#ff6600', 
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1em',
                                                        marginBottom: '4px',
                                                        wordWrap: 'break-word',
                                                        overflowWrap: 'break-word'
                                                    }}>
                                                        {cleanMobName(mob.Name)}
                                                        {mob.IsBoss && (
                                                            <span style={{
                                                                marginLeft: '6px',
                                                                padding: '2px 6px',
                                                                background: '#ff00ff30',
                                                                border: '1px solid #ff00ff',
                                                                borderRadius: '3px',
                                                                color: '#ff00ff',
                                                                fontSize: '0.8em'
                                                            }}>
                                                                👑 BOSS
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '0.95em', 
                                                        color: '#888',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        {mob.Level > 0 && (
                                                            <span style={{ color: '#ffff00' }}>
                                                                Lvl {mob.Level}
                                                            </span>
                                                        )}
                                                        {mob.Health > 0 && (
                                                            <span style={{ color: '#ff6666' }}>
                                                                HP: {mob.Health.toLocaleString()}
                                                            </span>
                                                        )}
                                                        {mob.Location && (
                                                            <span style={{ color: '#00aaff' }}>
                                                                📍 {Array.isArray(mob.Location) ? mob.Location[0] : mob.Location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* View icon */}
                                                <div style={{ 
                                                    fontSize: '1.2em', 
                                                    color: '#ff6600',
                                                    flexShrink: 0
                                                }}>
                                                    👁️
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}

            {/* Mob Navigation Confirmation Dialog */}
            {showMobNavigationConfirm && selectedMobToNavigate && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => {
                        setShowMobNavigationConfirm(false);
                        setSelectedMobToNavigate(null);
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                            border: '3px solid #ff6600',
                            borderRadius: '10px',
                            padding: '30px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 0 40px rgba(255, 102, 0, 0.6), inset 0 0 20px rgba(255, 102, 0, 0.1)',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setShowMobNavigationConfirm(false);
                                setSelectedMobToNavigate(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'transparent',
                                border: 'none',
                                color: '#ff6600',
                                fontSize: '24px',
                                cursor: 'pointer',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff6600';
                                e.currentTarget.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#ff6600';
                            }}
                        >
                            ×
                        </button>

                        {/* Title */}
                        <h2 style={{
                            color: '#ff6600',
                            textAlign: 'center',
                            marginBottom: '20px',
                            fontSize: '1.8em',
                            textShadow: '0 0 10px rgba(255, 102, 0, 0.5)',
                            borderBottom: '2px solid #ff660040',
                            paddingBottom: '15px'
                        }}>
                            👹 Navigate to Mob?
                        </h2>

                        {/* Mob preview */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            padding: '20px',
                            background: '#0a0a0a',
                            borderRadius: '8px',
                            border: '2px solid #ff660040',
                            marginBottom: '25px',
                            boxShadow: 'inset 0 0 15px rgba(255, 102, 0, 0.1)'
                        }}>
                            {/* Mob Sprite */}
                            <div style={{
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#1a1a1a',
                                border: '2px solid #ff6600',
                                borderRadius: '8px',
                                boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)',
                                padding: '4px',
                                flexShrink: 0
                            }}>
                                <MobSprite
                                    mobId={selectedMobToNavigate.Id}
                                    size={64}
                                    alt={cleanMobName(selectedMobToNavigate.Name)}
                                    lazy={false}
                                    style={{
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                            </div>

                            {/* Mob Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#ff6600',
                                    fontWeight: 'bold',
                                    fontSize: '1.3em',
                                    marginBottom: '5px'
                                }}>
                                    {cleanMobName(selectedMobToNavigate.Name)}
                                    {selectedMobToNavigate.IsBoss && (
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '0.9em',
                                            color: '#ff0000',
                                            textShadow: '0 0 8px rgba(255, 0, 0, 0.8)'
                                        }}>
                                            👑 BOSS
                                        </span>
                                    )}
                                </div>
                                {selectedMobToNavigate.Level && (
                                    <div style={{
                                        color: '#00ff00',
                                        fontSize: '0.95em'
                                    }}>
                                        Level: {selectedMobToNavigate.Level}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message */}
                        <p style={{
                            color: '#cccccc',
                            textAlign: 'center',
                            marginBottom: '25px',
                            fontSize: '1.1em',
                            lineHeight: '1.5'
                        }}>
                            Would you like to navigate to the <span style={{ color: '#ff6600', fontWeight: 'bold' }}>Mobs</span> page to view this mob's details?
                        </p>

                        {/* Action buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => {
                                    console.log('[ItemsPage] Navigating to mob:', selectedMobToNavigate.Name, 'ID:', selectedMobToNavigate.Id);
                                    if (onNavigateToMob) {
                                        onNavigateToMob({ Id: selectedMobToNavigate.Id });
                                    }
                                    setShowMobNavigationConfirm(false);
                                    setSelectedMobToNavigate(null);
                                }}
                                style={{
                                    padding: '12px 30px',
                                    fontSize: '1.1em',
                                    fontWeight: 'bold',
                                    background: '#ff6600',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)',
                                    minWidth: '120px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ffaa00';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 170, 0, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ff6600';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 102, 0, 0.5)';
                                }}
                            >
                                ✓ Yes, Go!
                            </button>
                            <button
                                onClick={() => {
                                    setShowMobNavigationConfirm(false);
                                    setSelectedMobToNavigate(null);
                                }}
                                style={{
                                    padding: '12px 30px',
                                    fontSize: '1.1em',
                                    fontWeight: 'bold',
                                    background: '#333',
                                    color: '#fff',
                                    border: '2px solid #666',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: '120px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#555';
                                    e.currentTarget.style.borderColor = '#999';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#333';
                                    e.currentTarget.style.borderColor = '#666';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                ✗ Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ItemsPage;

