import React, { useState, useEffect } from 'react';

function ItemsPage() {
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
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedWeaponTypes, setSelectedWeaponTypes] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [minLevel, setMinLevel] = useState(0);
    const [maxLevel, setMaxLevel] = useState(150);
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100000);
    const [absoluteMaxValue, setAbsoluteMaxValue] = useState(100000); // Fixed max value for slider
    const [minDamage, setMinDamage] = useState(0);
    const [maxDamage, setMaxDamage] = useState(1000);
    const [absoluteMaxDamage, setAbsoluteMaxDamage] = useState(1000); // Fixed max damage for slider
    const [showItemTypes, setShowItemTypes] = useState(false);
    const [showWeaponTypes, setShowWeaponTypes] = useState(false);
    const [showArmorSlots, setShowArmorSlots] = useState(false);
    const [selectedArmorSlots, setSelectedArmorSlots] = useState([]);
    const [showEffects, setShowEffects] = useState(false);
    const [allEffects, setAllEffects] = useState([]);
    const [selectedEffects, setSelectedEffects] = useState([]);
    const [effectSearchTerm, setEffectSearchTerm] = useState('');
    const itemsPerPage = 50;

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
                const mouseValue = mousePercent * 200;
                
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
    }, [minLevel, maxLevel]);

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

    // Load items data
    useEffect(() => {
        fetch('/GameData/Items.json')
            .then(response => response.json())
            .then(data => {
                setItems(data);
                setFilteredItems(data);
                
                // Set all item types as selected by default
                const allTypes = [...new Set(data.map(item => item.Type).filter(Boolean))];
                setSelectedTypes(allTypes);
                
                // Set all weapon types as selected by default
                const allWeaponTypes = [...new Set(data.filter(item => item.WeaponType).map(item => item.WeaponType))];
                setSelectedWeaponTypes(allWeaponTypes);
                
                // Extract all unique armor slots
                const allArmorSlots = [...new Set(data.filter(item => item.Slot && item.Slot.trim() !== '').map(item => item.Slot))].sort();
                setSelectedArmorSlots(allArmorSlots); // All selected by default
                
                // Extract all unique effects from items
                const effectsSet = new Set();
                data.forEach(item => {
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
                setSelectedEffects(sortedEffects); // All selected by default
                
                // Calculate max value from data
                const maxItemValue = Math.max(...data.map(item => item.Value || 0));
                const calculatedMax = Math.ceil(maxItemValue / 1000) * 1000; // Round up to nearest 1000
                setMaxValue(calculatedMax);
                setAbsoluteMaxValue(calculatedMax);
                
                // Calculate max damage from data
                const maxItemDamage = Math.max(...data.map(item => item.Damage || 0));
                const calculatedMaxDamage = Math.max(100, Math.ceil(maxItemDamage / 10) * 10); // Round up to nearest 10, min 100
                setMaxDamage(calculatedMaxDamage);
                setAbsoluteMaxDamage(calculatedMaxDamage);
                
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading items:', error);
                setIsLoading(false);
            });
    }, []);

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
                    item.Slot && selectedArmorSlots.includes(item.Slot)
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
    }, [searchTerm, selectedTypes, selectedWeaponTypes, selectedArmorSlots, selectedEffects, allEffects, sortBy, minLevel, maxLevel, minValue, maxValue, minDamage, maxDamage, items]);

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
            height: '100vh',
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
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                borderRight: '3px solid #00ff00',
                padding: '20px',
                overflowY: 'auto',
                flexShrink: 0,
                boxShadow: '3px 0 15px rgba(0, 0, 0, 0.5)'
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
                            padding: '12px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginBottom: showItemTypes ? '12px' : '0',
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
                            padding: '12px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {/* Select All Option */}
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 8px',
                                    marginBottom: '8px',
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
                                        padding: '8px',
                                        marginBottom: '4px',
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
                                padding: '12px',
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
                                padding: '12px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {/* Select All Option */}
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px 8px',
                                        marginBottom: '8px',
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
                                            padding: '8px',
                                            marginBottom: '4px',
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
                                padding: '12px',
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
                                padding: '12px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {/* Select All Option */}
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px 8px',
                                        marginBottom: '8px',
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
                                            padding: '8px',
                                            marginBottom: '4px',
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
                                padding: '12px',
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
                                padding: '12px',
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
                                        padding: '10px',
                                        marginBottom: '12px',
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
                                        padding: '10px 8px',
                                        marginBottom: '8px',
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
                                                    padding: '8px',
                                                    marginBottom: '4px',
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
                                        setMinLevel(Math.max(0, Math.min(200, numValue)));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setMinLevel(Math.max(0, Math.min(200, value)));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max="200"
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
                                        setMaxLevel(Math.max(0, Math.min(200, numValue)));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setMaxLevel(Math.max(0, Math.min(200, value)));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max="200"
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
                            left: `${(minLevel / 200) * 100}%`,
                            width: `${((maxLevel - minLevel) / 200) * 100}%`,
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
                            max="200"
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
                            max="200"
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
                    
                    {/* Level Labels */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.9em',
                        color: '#888'
                    }}>
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                        <span>150</span>
                        <span>200</span>
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
                    
                    {/* Value Labels */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.9em',
                        color: '#888'
                    }}>
                        <span>0</span>
                        <span>{Math.floor(absoluteMaxValue * 0.25).toLocaleString()}</span>
                        <span>{Math.floor(absoluteMaxValue * 0.5).toLocaleString()}</span>
                        <span>{Math.floor(absoluteMaxValue * 0.75).toLocaleString()}</span>
                        <span>{absoluteMaxValue.toLocaleString()}</span>
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
                    
                    {/* Damage Labels */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.9em',
                        color: '#888'
                    }}>
                        <span>0</span>
                        <span>{Math.floor(absoluteMaxDamage * 0.25)}</span>
                        <span>{Math.floor(absoluteMaxDamage * 0.5)}</span>
                        <span>{Math.floor(absoluteMaxDamage * 0.75)}</span>
                        <span>{absoluteMaxDamage}</span>
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
                        setSelectedTypes([...itemTypes]); // Reset to all types selected
                        setSelectedWeaponTypes([...weaponTypes]); // Reset to all weapon types selected
                        setSelectedArmorSlots([...armorSlots]); // Reset to all armor slots selected
                        setSelectedEffects([...allEffects]); // Reset to all effects selected
                        setEffectSearchTerm(''); // Clear effect search
                        setSortBy('name');
                        setMinLevel(0);
                        setMaxLevel(200);
                        setMinValue(0);
                        setMaxValue(absoluteMaxValue);
                        setMinDamage(0);
                        setMaxDamage(absoluteMaxDamage);
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
                padding: '20px',
                paddingBottom: '40px',
                overflowY: 'auto',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                position: 'relative'
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

                {/* Item Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '15px'
                }}>
                    {currentItems.map(item => (
                        <div
                            key={item.Id}
                            onClick={() => setSelectedItem(item)}
                            style={{
                                background: '#1a1a1a',
                                border: `2px solid ${getRarityColor(item)}`,
                                borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 20px ${getRarityColor(item)}80`;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '2em', marginRight: '10px' }}>
                                    {getItemIcon(item)}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '1.3em',
                                        fontWeight: 'bold',
                                        color: getRarityColor(item),
                                        marginBottom: '3px'
                                    }}>
                                        {cleanItemName(item.Name) || 'Unknown Item'}
                                    </div>
                                    <div style={{ fontSize: '0.9em', color: '#888' }}>
                                        {item.Type || 'Unknown'} {item.WeaponType ? `- ${item.WeaponType}` : ''}
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: '1.1em', color: '#aaa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {item.Level > 0 && (
                                    <div>Level: <span style={{ color: '#ffff00' }}>{item.Level}</span></div>
                                )}
                                {item.Damage > 0 && (
                                    <div>Damage: <span style={{ color: '#ff6600' }}>{item.Damage}</span></div>
                                )}
                                {item.Armor > 0 && (
                                    <div>Armor: <span style={{ color: '#00aaff' }}>{item.Armor}</span></div>
                                )}
                                {item.Value > 0 && (
                                    <div>Value: <span style={{ color: '#ffd700' }}>{item.Value}</span></div>
                                )}
                                {getItemEffectCount(item) > 0 && (
                                    <div>Effects: <span style={{ color: '#ff00ff' }}>✨ {getItemEffectCount(item)}</span></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        marginTop: '50px',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                        border: '2px solid #555',
                        borderRadius: '10px',
                        boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ 
                            fontSize: '3em', 
                            marginBottom: '20px',
                            filter: 'grayscale(1)'
                        }}>
                            🔍
                        </div>
                        <div style={{ 
                            fontSize: '1.8em',
                            color: '#666',
                            marginBottom: '10px',
                            fontWeight: 'bold'
                        }}>
                            No items found
                        </div>
                        <div style={{ 
                            fontSize: '1.2em',
                            color: '#555'
                        }}>
                            Try adjusting your filters or search term
                        </div>
                    </div>
                )}
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
                    boxShadow: `-8px 0 25px rgba(0, 0, 0, 0.7), inset 0 0 30px ${getRarityColor(selectedItem)}15`
                }}>
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedItem(null)}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
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
                                        marginBottom: '8px',
                                        padding: '8px',
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
                </div>
            )}
        </div>
    );
}

export default ItemsPage;

