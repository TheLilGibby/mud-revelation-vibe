import React, { useState, useEffect, useRef } from 'react';
import { useGameData } from '../contexts/DataContext';
import MobSprite, { prefetchMobImages } from '../components/MobSprite';

function MobsPage({ onNavigateToMap, navigationData, onClearNavigation, onNavigateToItems, isActive }) {
    const { mobs: loadedMobs, items: loadedItems } = useGameData();
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

    const [mobs, setMobs] = useState([]);
    const [filteredMobs, setFilteredMobs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedTiers, setSelectedTiers] = useState([]);
    const [selectedFactions, setSelectedFactions] = useState([]);
    const [selectedMob, setSelectedMob] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [minLevel, setMinLevel] = useState(0);
    const [maxLevel, setMaxLevel] = useState(200);
    const [minHealth, setMinHealth] = useState(0);
    const [maxHealth, setMaxHealth] = useState(100000);
    const [absoluteMaxHealth, setAbsoluteMaxHealth] = useState(100000);
    const [minDamage, setMinDamage] = useState(0);
    const [maxDamage, setMaxDamage] = useState(1000);
    const [absoluteMaxDamage, setAbsoluteMaxDamage] = useState(1000);
    const [showBossOnly, setShowBossOnly] = useState(false);
    const [showTypes, setShowTypes] = useState(() => {
        const saved = localStorage.getItem('revelationMobsShowTypes');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showTiers, setShowTiers] = useState(() => {
        const saved = localStorage.getItem('revelationMobsShowTiers');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showFactions, setShowFactions] = useState(() => {
        const saved = localStorage.getItem('revelationMobsShowFactions');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showLocations, setShowLocations] = useState(() => {
        const saved = localStorage.getItem('revelationMobsShowLocations');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [locationSearchTerm, setLocationSearchTerm] = useState('');
    const [items, setItems] = useState([]);
    const [selectedDroppedItem, setSelectedDroppedItem] = useState(null);
    const [shareTooltip, setShareTooltip] = useState('');
    const [showItemNavigationConfirm, setShowItemNavigationConfirm] = useState(false);
    const [selectedItemToNavigate, setSelectedItemToNavigate] = useState(null);
    const itemsPerPage = 50;
    const isManualSelection = useRef(false); // Track if mob selection is from user click vs URL

    // Clean mob names
    const cleanMobName = (name) => {
        if (!name) return '';
        return name.replace(/\\cf\d+/gi, '').replace(/\\cf\w+/gi, '').trim().replace(/\.$/, '');
    };

    const normalizeMobType = (type) => {
        if (typeof type === 'string') {
            const trimmed = type.trim();
            return trimmed === '' ? 'No Type' : trimmed;
        }
        return 'No Type';
    };

    // Handle slider z-index for LEVEL slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-level');
        const maxSlider = document.querySelector('.dual-range-max-level');
        
        if (!minSlider || !maxSlider) return;

        const updateZIndex = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mousePercent = mouseX / rect.width;
            const mouseValue = mousePercent * 200;
            
            const distanceToMin = Math.abs(mouseValue - minLevel);
            const distanceToMax = Math.abs(mouseValue - maxLevel);
            
            if (distanceToMin < distanceToMax) {
                minSlider.style.zIndex = '5';
                maxSlider.style.zIndex = '4';
            } else {
                minSlider.style.zIndex = '4';
                maxSlider.style.zIndex = '5';
            }
        };

        const handleMouseMove = (e) => {
            if (!e.buttons) {
                updateZIndex(e);
            }
        };

        const handleMouseEnter = (e) => {
            updateZIndex(e);
        };
        
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
            sliderContainer.addEventListener('mouseenter', handleMouseEnter);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
                sliderContainer.removeEventListener('mouseenter', handleMouseEnter);
            }
        };
    }, [minLevel, maxLevel]);

    // Handle slider z-index for HEALTH slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-health');
        const maxSlider = document.querySelector('.dual-range-max-health');
        
        if (!minSlider || !maxSlider) return;

        const updateZIndex = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mousePercent = mouseX / rect.width;
            const mouseValue = mousePercent * absoluteMaxHealth;
            
            const distanceToMin = Math.abs(mouseValue - minHealth);
            const distanceToMax = Math.abs(mouseValue - maxHealth);
            
            if (distanceToMin < distanceToMax) {
                minSlider.style.zIndex = '5';
                maxSlider.style.zIndex = '4';
            } else {
                minSlider.style.zIndex = '4';
                maxSlider.style.zIndex = '5';
            }
        };

        const handleMouseMove = (e) => {
            if (!e.buttons) {
                updateZIndex(e);
            }
        };

        const handleMouseEnter = (e) => {
            updateZIndex(e);
        };
        
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
            sliderContainer.addEventListener('mouseenter', handleMouseEnter);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
                sliderContainer.removeEventListener('mouseenter', handleMouseEnter);
            }
        };
    }, [minHealth, maxHealth, absoluteMaxHealth]);

    // Handle slider z-index for DAMAGE slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-damage');
        const maxSlider = document.querySelector('.dual-range-max-damage');
        
        if (!minSlider || !maxSlider) return;

        const updateZIndex = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mousePercent = mouseX / rect.width;
            const mouseValue = mousePercent * absoluteMaxDamage;
            
            const distanceToMin = Math.abs(mouseValue - minDamage);
            const distanceToMax = Math.abs(mouseValue - maxDamage);
            
            if (distanceToMin < distanceToMax) {
                minSlider.style.zIndex = '5';
                maxSlider.style.zIndex = '4';
            } else {
                minSlider.style.zIndex = '4';
                maxSlider.style.zIndex = '5';
            }
        };

        const handleMouseMove = (e) => {
            if (!e.buttons) {
                updateZIndex(e);
            }
        };

        const handleMouseEnter = (e) => {
            updateZIndex(e);
        };
        
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
            sliderContainer.addEventListener('mouseenter', handleMouseEnter);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
                sliderContainer.removeEventListener('mouseenter', handleMouseEnter);
            }
        };
    }, [minDamage, maxDamage, absoluteMaxDamage]);

    // Initialize with data from context
    useEffect(() => {
        if (loadedMobs && loadedMobs.length > 0) {
            console.log(`[MobsPage] Using ${loadedMobs.length} mobs from context`);
            setMobs(loadedMobs);
            setFilteredMobs(loadedMobs);
            
            // No filters selected by default - show all results
            // const allTypes = [...new Set(loadedMobs.map(mob => normalizeMobType(mob.Type)))];
            // console.log(`[MobsPage] Found ${allTypes.length} unique types:`, allTypes);
            setSelectedTypes([]);
            
            // const allTiers = [...new Set(loadedMobs.map(mob => mob.Tier).filter(Boolean))];
            setSelectedTiers([]);
            
            // const allFactions = [...new Set(loadedMobs.map(mob => {
            //     if (!mob.Faction || mob.Faction.trim() === '') return 'No Faction';
            //     return mob.Faction;
            // }))].sort();
            setSelectedFactions([]);
            
            // const allLocations = [...new Set(
            //     loadedMobs.flatMap(mob => {
            //         if (!mob.Location) return [];
            //         if (Array.isArray(mob.Location)) {
            //             return mob.Location.filter(loc => loc && loc.trim() !== '');
            //         }
            //         return mob.Location.trim() !== '' ? [mob.Location] : [];
            //     })
            // )].sort();
            setSelectedLocations([]);
            
            // Calculate max health from data
            const maxMobHealth = Math.max(...loadedMobs.map(mob => mob.Health || 0));
            const calculatedMaxHealth = Math.ceil(maxMobHealth / 1000) * 1000;
            setMaxHealth(calculatedMaxHealth);
            setAbsoluteMaxHealth(calculatedMaxHealth);
            
            // Calculate max damage from data
            const maxMobDamage = Math.max(...loadedMobs.map(mob => mob.Damage || 0));
            const calculatedMaxDamage = Math.max(100, Math.ceil(maxMobDamage / 10) * 10);
            setMaxDamage(calculatedMaxDamage);
            setAbsoluteMaxDamage(calculatedMaxDamage);
            
            // Prefetch mob images
            prefetchMobImages(loadedMobs);
        }
    }, [loadedMobs]);

    // Initialize items from context
    useEffect(() => {
        if (loadedItems && loadedItems.length > 0) {
            console.log(`[MobsPage] Using ${loadedItems.length} items from context`);
            setItems(loadedItems);
        }
    }, [loadedItems]);

    // Save collapsible section states to localStorage
    useEffect(() => {
        localStorage.setItem('revelationMobsShowTypes', JSON.stringify(showTypes));
    }, [showTypes]);

    useEffect(() => {
        localStorage.setItem('revelationMobsShowTiers', JSON.stringify(showTiers));
    }, [showTiers]);

    useEffect(() => {
        localStorage.setItem('revelationMobsShowFactions', JSON.stringify(showFactions));
    }, [showFactions]);

    useEffect(() => {
        localStorage.setItem('revelationMobsShowLocations', JSON.stringify(showLocations));
    }, [showLocations]);

    // Handle navigation from ItemsPage
    useEffect(() => {
        // Only process navigation when page is active and we have data
        if (!isActive || !navigationData || mobs.length === 0) return;

        // Find the mob by Id
        const foundMob = mobs.find(mob => mob.Id === navigationData.Id);
        
        if (foundMob) {
            console.log(`[MobsPage] Navigated to mob: ${foundMob.Name}`);
            // Mark as manual selection to prevent URL effect from re-processing
            isManualSelection.current = true;
            setSelectedMob(foundMob);
            // Clear search to ensure the mob is visible
            setSearchTerm('');
        } else {
            console.warn(`[MobsPage] Mob with Id ${navigationData.Id} not found`);
        }
        
        // Clear navigation data after handling
        if (onClearNavigation) {
            onClearNavigation();
        }
    }, [isActive, navigationData, mobs, onClearNavigation]);

    // Handle URL parameters for direct mob linking
    useEffect(() => {
        if (!isActive || !mobs || mobs.length === 0) return;
        
        // Only process URL parameters if not a manual selection
        if (isManualSelection.current) {
            isManualSelection.current = false;
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const mobId = urlParams.get('mobId');
        
        if (mobId) {
            const mob = mobs.find(m => m.Id === parseInt(mobId));
            if (mob && selectedMob?.Id !== mob.Id) {
                console.log(`[MobsPage] Opening mob from URL: ${mob.Name}`);
                setSelectedMob(mob);
                // Clear search to ensure the mob is visible
                setSearchTerm('');
            }
        }
    }, [isActive, mobs, selectedMob]);

    // Update URL when mob is selected (for browser history)
    useEffect(() => {
        if (!isActive) return;
        
        if (selectedMob) {
            // Create clean URL with only mobId parameter
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('mobId', selectedMob.Id);
            window.history.replaceState({}, '', url);
        } else {
            // Clear URL parameters when no mob is selected
            const url = new URL(window.location.origin + window.location.pathname);
            window.history.replaceState({}, '', url);
        }
    }, [isActive, selectedMob]);

    // Filter and sort mobs
    useEffect(() => {
        let filtered = [...mobs];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(mob => {
                const cleanName = cleanMobName(mob.Name);
                return cleanName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    mob.Location?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Type filter
        if (selectedTypes.length > 0) {
            const allTypes = [...new Set(mobs.map(mob => normalizeMobType(mob.Type)))];
            if (selectedTypes.length < allTypes.length) {
                filtered = filtered.filter(mob => 
                    selectedTypes.includes(normalizeMobType(mob.Type))
                );
            }
        }

        // Tier filter
        if (selectedTiers.length > 0) {
            const allTiers = [...new Set(mobs.map(mob => mob.Tier).filter(Boolean))];
            if (selectedTiers.length < allTiers.length) {
                filtered = filtered.filter(mob => 
                    !mob.Tier || selectedTiers.includes(mob.Tier)
                );
            }
        }

        // Faction filter
        if (selectedFactions.length > 0) {
            const allFactions = [...new Set(mobs.map(mob => {
                if (!mob.Faction || mob.Faction.trim() === '') return 'No Faction';
                return mob.Faction;
            }))];
            if (selectedFactions.length < allFactions.length) {
                filtered = filtered.filter(mob => {
                    const mobFaction = (!mob.Faction || mob.Faction.trim() === '') ? 'No Faction' : mob.Faction;
                    return selectedFactions.includes(mobFaction);
                });
            }
        }

        // Location filter
        if (selectedLocations.length > 0) {
            const allLocations = [...new Set(
                mobs.flatMap(mob => {
                    if (!mob.Location) return [];
                    if (Array.isArray(mob.Location)) {
                        return mob.Location.filter(loc => loc && loc.trim() !== '');
                    }
                    return mob.Location.trim() !== '' ? [mob.Location] : [];
                })
            )];
            if (selectedLocations.length < allLocations.length) {
                filtered = filtered.filter(mob => {
                    if (!mob.Location) return true; // Include mobs without location
                    const mobLocations = Array.isArray(mob.Location) ? mob.Location : [mob.Location];
                    return mobLocations.some(loc => selectedLocations.includes(loc));
                });
            }
        }

        // Boss filter
        if (showBossOnly) {
            filtered = filtered.filter(mob => mob.IsBoss === true);
        }

        // Level filter
        filtered = filtered.filter(mob => {
            const mobLevel = mob.Level || 0;
            return mobLevel >= minLevel && mobLevel <= maxLevel;
        });

        // Health filter
        filtered = filtered.filter(mob => {
            const mobHealth = mob.Health || 0;
            return mobHealth >= minHealth && mobHealth <= maxHealth;
        });

        // Damage filter
        filtered = filtered.filter(mob => {
            const mobDamage = mob.Damage || 0;
            return mobDamage >= minDamage && mobDamage <= maxDamage;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return cleanMobName(a.Name).localeCompare(cleanMobName(b.Name));
                case 'level':
                    return (b.Level || 0) - (a.Level || 0);
                case 'health':
                    return (b.Health || 0) - (a.Health || 0);
                case 'damage':
                    return (b.Damage || 0) - (a.Damage || 0);
                case 'experience':
                    return (b.Experience || 0) - (a.Experience || 0);
                default:
                    return 0;
            }
        });

        console.log(`[MobsPage] Filtering: ${mobs.length} total → ${filtered.length} after filters`);
        if (mobs.length !== filtered.length) {
            console.log(`[MobsPage] Filter details:`, {
                searchTerm,
                selectedTypesCount: selectedTypes.length,
                selectedTiersCount: selectedTiers.length,
                selectedFactionsCount: selectedFactions.length,
                selectedLocationsCount: selectedLocations.length,
                showBossOnly,
                levelRange: [minLevel, maxLevel],
                healthRange: [minHealth, maxHealth],
                damageRange: [minDamage, maxDamage]
            });
        }

        setFilteredMobs(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedTypes, selectedTiers, selectedFactions, selectedLocations, showBossOnly, sortBy, minLevel, maxLevel, minHealth, maxHealth, minDamage, maxDamage, mobs]);

    // Prefetch images for the current page
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageMobs = filteredMobs.slice(startIndex, endIndex);
        
        // Prefetch current page mob images
        prefetchMobImages(currentPageMobs.map(mob => mob.Id));
        
        // Also prefetch next page for smoother navigation
        if (endIndex < filteredMobs.length) {
            const nextPageMobs = filteredMobs.slice(endIndex, endIndex + itemsPerPage);
            setTimeout(() => {
                prefetchMobImages(nextPageMobs.map(mob => mob.Id));
            }, 500); // Delay next page prefetch slightly
        }
    }, [filteredMobs, currentPage, itemsPerPage]);

    // Get unique types, tiers, factions, and locations
    const mobTypes = [...new Set(mobs.map(mob => normalizeMobType(mob.Type)))].sort();
    const mobTiers = [...new Set(mobs.map(mob => mob.Tier).filter(Boolean))].sort();
    const mobFactions = [...new Set(mobs.map(mob => {
        if (!mob.Faction || mob.Faction.trim() === '') return 'No Faction';
        return mob.Faction;
    }))].sort();
    const mobLocations = [...new Set(
        mobs.flatMap(mob => {
            if (!mob.Location) return [];
            if (Array.isArray(mob.Location)) {
                return mob.Location.filter(loc => loc && loc.trim() !== '');
            }
            return mob.Location.trim() !== '' ? [mob.Location] : [];
        })
    )].sort();
    
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
    
    // Toggle tier selection
    const toggleTier = (tier) => {
        setSelectedTiers(prev => {
            if (prev.includes(tier)) {
                return prev.filter(t => t !== tier);
            } else {
                return [...prev, tier];
            }
        });
    };

    // Toggle faction selection
    const toggleFaction = (faction) => {
        setSelectedFactions(prev => {
            if (prev.includes(faction)) {
                return prev.filter(f => f !== faction);
            } else {
                return [...prev, faction];
            }
        });
    };

    // Toggle location selection
    const toggleLocation = (location) => {
        setSelectedLocations(prev => {
            if (prev.includes(location)) {
                return prev.filter(l => l !== location);
            } else {
                return [...prev, location];
            }
        });
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMobs = filteredMobs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMobs.length / itemsPerPage);

    // Get mob icon based on type and tier
    const getMobIcon = (mob) => {
        if (mob.IsBoss) return '👑';
        if (mob.Type === 'PLAYER_GREETING') return '👤';
        if (mob.Type === 'AGGRESSIVE') return '😈';
        if (mob.Type === 'NORMAL') return '👾';
        if (mob.Tier === 'Dragon') return '🐲';
        if (mob.Tier === 'Event Mob') return '🎃';
        if (mob.Tier === 'Pet') return '🐾';
        return '👹';
    };

    // Get rarity color based on level/boss status
    const getRarityColor = (mob) => {
        if (mob.IsBoss) return '#ff00ff'; // Boss
        if (mob.Level >= 100) return '#ffaa00'; // High Level
        if (mob.Level >= 50) return '#00aaff'; // Mid Level
        if (mob.Type === 'AGGRESSIVE') return '#ff6666'; // Aggressive
        return '#aaaaaa'; // Normal
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

    // Get items dropped by a mob (optimized using DroppedItemsIds)
    const getDroppedItems = (mob) => {
        if (!items || items.length === 0 || !mob) return [];
        
        // Use the preprocessed DroppedItemsIds array for instant lookup
        const droppedItemsIds = mob.DroppedItemsIds || [];
        
        if (droppedItemsIds.length === 0) return [];
        
        // Create a Set for O(1) lookup instead of O(n) array.includes()
        const itemIdsSet = new Set(droppedItemsIds);
        
        // Filter items by ID - much faster than string parsing
        const foundItems = items.filter(item => itemIdsSet.has(item.Id));
        
        return foundItems;
    };

    // Share mob link - copy URL to clipboard
    const handleShareMob = async (mob) => {
        // Create a clean URL with only the mobId parameter
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('mobId', mob.Id);
        
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
                    <div>Loading Mobs Database...</div>
                    <div style={{ fontSize: '0.6em', color: '#888', marginTop: '10px' }}>
                        {mobs.length > 0 ? `Loaded ${mobs.length} mobs` : 'Please wait...'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            background: '#0a0a0a',
            color: '#00ff00',
            display: 'flex',
            fontFamily: 'VT323, monospace',
            overflow: 'hidden',
            position: 'relative',
            maxWidth: '100vw'
        }}>
            {/* Left Sidebar - Filters */}
            <div style={{
                width: '420px',
                maxWidth: '420px',
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                borderRight: '3px solid #00ff00',
                padding: '10px',
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
                    👾 Mobs
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
                        placeholder="Search mobs..."
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            color: '#00ff00',
                            fontSize: '1.1em',
                            fontFamily: 'VT323, monospace',
                            borderRadius: '3px'
                        }}
                    />
                </div>

                {/* Boss Filter Toggle */}
                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            background: showBossOnly ? '#ff00ff30' : '#2a2a2a',
                            border: `2px solid ${showBossOnly ? '#ff00ff' : '#00ff00'}`,
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '1.2em'
                        }}
                        onMouseEnter={(e) => {
                            if (!showBossOnly) {
                                e.currentTarget.style.background = '#00ff0020';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!showBossOnly) {
                                e.currentTarget.style.background = '#2a2a2a';
                                e.currentTarget.style.boxShadow = 'none';
                            }
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={showBossOnly}
                            onChange={() => setShowBossOnly(!showBossOnly)}
                            style={{
                                width: '20px',
                                height: '20px',
                                marginRight: '10px',
                                cursor: 'pointer',
                                accentColor: '#ff00ff'
                            }}
                        />
                        <span style={{ flex: 1, color: showBossOnly ? '#ff00ff' : '#00ff00' }}>
                            👑 Bosses Only
                        </span>
                    </label>
                </div>

                {/* Type Filter - Collapsible */}
                <div style={{ marginBottom: '20px' }}>
                    <div 
                        onClick={() => setShowTypes(!showTypes)}
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '8px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginBottom: showTypes ? '8px' : '0',
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
                            🏷️ Mob Types
                            <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                ({selectedTypes.length} selected)
                            </span>
                        </div>
                        <span style={{ 
                            fontSize: '1.5em',
                            transition: 'transform 0.2s',
                            transform: showTypes ? 'rotate(180deg)' : 'rotate(0deg)',
                            display: 'inline-block'
                        }}>
                            ▼
                        </span>
                    </div>

                    {showTypes && (
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
                                    background: selectedTypes.length === mobTypes.length ? '#00ff0030' : '#1a1a1a',
                                    border: `2px solid ${selectedTypes.length === mobTypes.length ? '#00ff00' : '#555'}`,
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '1.2em',
                                    fontWeight: 'bold'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = selectedTypes.length === mobTypes.length ? '#00ff0030' : '#00ff0015';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = selectedTypes.length === mobTypes.length ? '#00ff0030' : '#1a1a1a';
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.length === mobTypes.length}
                                    onChange={() => {
                                        if (selectedTypes.length === mobTypes.length) {
                                            setSelectedTypes([]);
                                        } else {
                                            setSelectedTypes([...mobTypes]);
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
                                    color: selectedTypes.length === mobTypes.length ? '#00ff00' : '#aaa'
                                }}>
                                    Select All
                                </span>
                            </label>

                            {/* Individual Type Checkboxes */}
                            {mobTypes.map(type => (
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
                                        ({mobs.filter(mob => normalizeMobType(mob.Type) === type).length})
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tier Filter - Collapsible */}
                {mobTiers.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div 
                            onClick={() => setShowTiers(!showTiers)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                cursor: 'pointer',
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
                                🏆 Tiers
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedTiers.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showTiers ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {showTiers && (
                    <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                padding: '8px',
                                marginTop: '8px',
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
                                        background: selectedTiers.length === mobTiers.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedTiers.length === mobTiers.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedTiers.length === mobTiers.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedTiers.length === mobTiers.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTiers.length === mobTiers.length}
                                        onChange={() => {
                                            if (selectedTiers.length === mobTiers.length) {
                                                setSelectedTiers([]);
                                            } else {
                                                setSelectedTiers([...mobTiers]);
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
                                        color: selectedTiers.length === mobTiers.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Tier Checkboxes */}
                                {mobTiers.map(tier => (
                                    <label
                                        key={tier}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px',
                                            marginBottom: '3px',
                                            background: selectedTiers.includes(tier) ? '#00ff0020' : 'transparent',
                                            border: `1px solid ${selectedTiers.includes(tier) ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.1em'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedTiers.includes(tier)) {
                                                e.currentTarget.style.background = '#00ff0010';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedTiers.includes(tier)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTiers.includes(tier)}
                                            onChange={() => toggleTier(tier)}
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
                                            color: selectedTiers.includes(tier) ? '#00ff00' : '#aaa'
                                        }}>
                                            {tier}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.9em',
                                            color: '#888',
                                            marginLeft: '8px'
                                        }}>
                                            ({mobs.filter(mob => mob.Tier === tier).length})
                                        </span>
                                    </label>
                                ))}
                    </div>
                        )}
                </div>
                )}

                {/* Faction Filter - Collapsible */}
                {mobFactions.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div 
                            onClick={() => setShowFactions(!showFactions)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                cursor: 'pointer',
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
                                🛡️ Factions
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedFactions.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showFactions ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {showFactions && (
                <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                padding: '8px',
                                marginTop: '8px',
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
                                        background: selectedFactions.length === mobFactions.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedFactions.length === mobFactions.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedFactions.length === mobFactions.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedFactions.length === mobFactions.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFactions.length === mobFactions.length}
                                        onChange={() => {
                                            if (selectedFactions.length === mobFactions.length) {
                                                setSelectedFactions([]);
                                            } else {
                                                setSelectedFactions([...mobFactions]);
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
                                        color: selectedFactions.length === mobFactions.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Faction Checkboxes */}
                                {mobFactions.map(faction => (
                                    <label
                                        key={faction}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px',
                                            marginBottom: '3px',
                                            background: selectedFactions.includes(faction) ? '#00ff0020' : 'transparent',
                                            border: `1px solid ${selectedFactions.includes(faction) ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.1em'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedFactions.includes(faction)) {
                                                e.currentTarget.style.background = '#00ff0010';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedFactions.includes(faction)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedFactions.includes(faction)}
                                            onChange={() => toggleFaction(faction)}
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
                                            color: selectedFactions.includes(faction) ? '#00ff00' : '#aaa'
                                        }}>
                                            {faction}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.9em',
                                            color: '#888',
                                            marginLeft: '8px'
                                        }}>
                                            ({mobs.filter(mob => {
                                                const mobFaction = (!mob.Faction || mob.Faction.trim() === '') ? 'No Faction' : mob.Faction;
                                                return mobFaction === faction;
                                            }).length})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Location Filter - Collapsible */}
                {mobLocations.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div 
                            onClick={() => setShowLocations(!showLocations)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                cursor: 'pointer',
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
                                🗺️ Regions
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedLocations.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showLocations ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {showLocations && (
                            <div style={{
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                padding: '8px',
                                marginTop: '8px'
                            }}>
                                {/* Region Search Box */}
                                <div style={{ marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        value={locationSearchTerm}
                                        onChange={(e) => setLocationSearchTerm(e.target.value)}
                                        placeholder="Search regions..."
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            background: '#1a1a1a',
                                            border: '2px solid #00aaff',
                                            color: '#00aaff',
                                            fontSize: '1em',
                                            fontFamily: 'VT323, monospace',
                                            borderRadius: '3px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {locationSearchTerm && (
                                        <div style={{
                                            marginTop: '6px',
                                            fontSize: '0.9em',
                                            color: '#888',
                                            textAlign: 'center'
                                        }}>
                                            {mobLocations.filter(loc => 
                                                loc.toLowerCase().includes(locationSearchTerm.toLowerCase())
                                            ).length} region{mobLocations.filter(loc => 
                                                loc.toLowerCase().includes(locationSearchTerm.toLowerCase())
                                            ).length !== 1 ? 's' : ''} found
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    maxHeight: '250px',
                                    overflowY: 'auto'
                                }}>
                                    {/* Select All Option */}
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px 6px',
                                            marginBottom: '6px',
                                            background: selectedLocations.length === mobLocations.length ? '#00ff0030' : '#1a1a1a',
                                            border: `2px solid ${selectedLocations.length === mobLocations.length ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.2em',
                                            fontWeight: 'bold'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = selectedLocations.length === mobLocations.length ? '#00ff0030' : '#00ff0015';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = selectedLocations.length === mobLocations.length ? '#00ff0030' : '#1a1a1a';
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedLocations.length === mobLocations.length}
                                            onChange={() => {
                                                if (selectedLocations.length === mobLocations.length) {
                                                    setSelectedLocations([]);
                                                } else {
                                                    setSelectedLocations([...mobLocations]);
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
                                            color: selectedLocations.length === mobLocations.length ? '#00ff00' : '#aaa'
                                        }}>
                                            Select All
                                        </span>
                                    </label>

                                    {/* Individual Region Checkboxes - Filtered */}
                                    {mobLocations
                                        .filter(location => 
                                            location.toLowerCase().includes(locationSearchTerm.toLowerCase())
                                        )
                                        .map(location => (
                                            <label
                                                key={location}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '6px',
                                                    marginBottom: '3px',
                                                    background: selectedLocations.includes(location) ? '#00ff0020' : 'transparent',
                                                    border: `1px solid ${selectedLocations.includes(location) ? '#00ff00' : '#555'}`,
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '1.1em'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!selectedLocations.includes(location)) {
                                                        e.currentTarget.style.background = '#00ff0010';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!selectedLocations.includes(location)) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLocations.includes(location)}
                                                    onChange={() => toggleLocation(location)}
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
                                                    color: selectedLocations.includes(location) ? '#00ff00' : '#aaa'
                                                }}>
                                                    {location}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.9em',
                                                    color: '#888',
                                                    marginLeft: '8px'
                                                }}>
                                                    ({mobs.filter(mob => {
                                                        if (!mob.Location) return false;
                                                        const mobLocations = Array.isArray(mob.Location) ? mob.Location : [mob.Location];
                                                        return mobLocations.includes(location);
                                                    }).length})
                                                </span>
                                            </label>
                                        ))
                                    }
                                    
                                    {/* No Results Message */}
                                    {locationSearchTerm && mobLocations.filter(location => 
                                        location.toLowerCase().includes(locationSearchTerm.toLowerCase())
                                    ).length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '20px',
                                            color: '#888',
                                            fontSize: '1.1em'
                                        }}>
                                            No locations found matching "{locationSearchTerm}"
                                        </div>
                                    )}
                                </div>
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
                </div>

                {/* Health Range Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        ❤️ Health Range: 
                        <input 
                            type="number"
                            value={minHealth}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxHealth, parseInt(e.target.value) || 0));
                                setMinHealth(value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '80px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ff6666',
                                borderRadius: '3px',
                                color: '#ff6666',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: '#ff6666', margin: '0 8px' }}>-</span>
                        <input 
                            type="number"
                            value={maxHealth}
                            onChange={(e) => {
                                const value = Math.max(0, Math.min(absoluteMaxHealth, parseInt(e.target.value) || 0));
                                setMaxHealth(value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '80px',
                                padding: '4px 8px',
                                background: '#2a2a2a',
                                border: '2px solid #ff6666',
                                borderRadius: '3px',
                                color: '#ff6666',
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
                            left: `${(minHealth / absoluteMaxHealth) * 100}%`,
                            width: `${((maxHealth - minHealth) / absoluteMaxHealth) * 100}%`,
                            height: '8px',
                            background: 'linear-gradient(90deg, #ff6666, #ff3333, #ff0000)',
                            border: '2px solid #ff6666',
                            borderRadius: '5px',
                            boxShadow: '0 0 10px rgba(255, 102, 102, 0.5)'
                        }} />
                        
                        {/* Max Health Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-max-health"
                            min="0"
                            max={absoluteMaxHealth}
                            step="100"
                            value={maxHealth}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value >= minHealth) {
                                    setMaxHealth(value);
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
                        
                        {/* Min Health Slider */}
                        <input
                            type="range"
                            className="dual-range dual-range-min-health"
                            min="0"
                            max={absoluteMaxHealth}
                            step="100"
                            value={minHealth}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value <= maxHealth) {
                                    setMinHealth(value);
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '70px',
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            style={{
                                width: '70px',
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
                            background: 'linear-gradient(90deg, #ff6600, #ff3300, #ff0000)',
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
                            step="10"
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
                            step="10"
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
                            padding: '8px',
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
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="level">Level (High-Low)</option>
                        <option value="level-asc">Level (Low-High)</option>
                        <option value="health">Health (High-Low)</option>
                        <option value="health-asc">Health (Low-High)</option>
                        <option value="damage">Damage (High-Low)</option>
                        <option value="damage-asc">Damage (Low-High)</option>
                        <option value="experience">Experience (High-Low)</option>
                        <option value="experience-asc">Experience (Low-High)</option>
                    </select>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={() => {
                        setSearchTerm('');
                        setSelectedTypes([]);
                        setSelectedTiers([]);
                        setSelectedFactions([]);
                        setSelectedLocations([]);
                        setShowBossOnly(false);
                        setSortBy('name');
                        setMinLevel(0);
                        setMaxLevel(200);
                        setMinHealth(0);
                        setMaxHealth(absoluteMaxHealth);
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

            {/* Main Content - Mob Grid */}
            <div style={{
                flex: 1,
                padding: '0',
                overflowY: 'auto',
                overflowX: 'hidden',
                minWidth: 0
            }}>
                {/* Pagination Info */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0',
                    padding: '15px',
                    background: '#1a1a1a',
                    border: '2px solid #00ff00',
                    borderRadius: '0',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none'
                }}>
                    <div style={{ fontSize: '1.3em' }}>
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMobs.length)} of {filteredMobs.length}
                        {mobs.length !== filteredMobs.length && (
                            <span style={{ color: '#ffff00', marginLeft: '10px' }}>
                                ({mobs.length} total)
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '8px 16px',
                                background: currentPage === 1 ? '#333' : '#2a2a2a',
                                border: '2px solid #00ff00',
                                color: currentPage === 1 ? '#666' : '#00ff00',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '1.1em',
                                fontFamily: 'VT323, monospace',
                                borderRadius: '3px'
                            }}
                        >
                            ← Prev
                        </button>
                        <span style={{ fontSize: '1.2em', padding: '8px 16px' }}>
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '8px 16px',
                                background: currentPage === totalPages ? '#333' : '#2a2a2a',
                                border: '2px solid #00ff00',
                                color: currentPage === totalPages ? '#666' : '#00ff00',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '1.1em',
                                fontFamily: 'VT323, monospace',
                                borderRadius: '3px'
                            }}
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Mob Table */}
                <div style={{
                    background: '#101010',
                    border: '2px solid #00ff00',
                    borderRadius: '0',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    overflow: 'hidden',
                    boxShadow: '0 0 25px rgba(0, 255, 0, 0.15)'
                }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        fontSize: '1.1em',
                        tableLayout: 'fixed',
                        minWidth: '900px'
                    }}>
                        <thead>
                            <tr style={{
                                background: '#00ff0025',
                                color: '#00ff00',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>👾</th>
                                <th style={{ padding: '12px 14px', width: '30%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Mob Name</th>
                                <th style={{ padding: '12px 14px', width: '15%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Type</th>
                                <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>Level</th>
                                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>HP</th>
                                <th style={{ padding: '12px 14px', width: '90px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>DMG</th>
                                <th style={{ padding: '12px 14px', width: '100px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>EXP</th>
                                <th style={{ padding: '12px 14px', width: '15%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMobs.length === 0 ?
                                (
                                    <tr>
                                        <td colSpan="8" style={{ 
                                            textAlign: 'center', 
                                            padding: '40px', 
                                            color: '#888',
                                            fontSize: '1.2em'
                                        }}>
                                            No mobs found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    currentMobs.map(mob => (
                                        <tr
                                            key={mob.Id}
                                            onClick={() => {
                                                isManualSelection.current = true;
                                                setSelectedMob(mob);
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #00ff0020',
                                                transition: 'all 0.2s',
                                                background: selectedMob?.Id === mob.Id ? '#00ff0015' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedMob?.Id !== mob.Id) {
                                                    e.currentTarget.style.background = '#00ff0010';
                                                }
                                                e.currentTarget.style.boxShadow = `inset 0 0 20px ${getRarityColor(mob)}30`;
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedMob?.Id !== mob.Id) {
                                                    e.currentTarget.style.background = 'transparent';
                                                }
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Mob Sprite */}
                                            <td style={{ 
                                                padding: '8px', 
                                                textAlign: 'center',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                <div style={{ 
                                                    width: '48px',
                                                    height: '48px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#1a1a1a',
                                                    border: `2px solid ${getRarityColor(mob)}`,
                                                    borderRadius: '4px',
                                                    margin: '0 auto',
                                                    boxShadow: `0 0 8px ${getRarityColor(mob)}40`,
                                                    padding: '2px'
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
                                            </td>
                                            
                                            {/* Mob Name */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                color: getRarityColor(mob),
                                                fontWeight: 'bold',
                                                fontSize: '1.1em',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {cleanMobName(mob.Name) || 'Unknown Mob'}
                                                {mob.IsBoss && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 8px',
                                                        background: '#ff00ff30',
                                                        border: '1px solid #ff00ff',
                                                        borderRadius: '3px',
                                                        color: '#ff00ff',
                                                        fontSize: '0.85em',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        👑 BOSS
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Type */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                color: '#aaa',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {normalizeMobType(mob.Type)}
                                                {mob.Tier && (
                                                    <div style={{ fontSize: '0.9em', color: '#888' }}>
                                                        {mob.Tier}
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
                                                {mob.Level > 0 ? mob.Level : '-'}
                                            </td>
                                            
                                            {/* Health */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'right',
                                                color: '#ff6666',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {mob.Health > 0 ? mob.Health.toLocaleString() : '-'}
                                            </td>
                                            
                                            {/* Damage */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'right',
                                                color: '#ff6600',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {mob.Damage > 0 ? mob.Damage : '-'}
                                            </td>
                                            
                                            {/* Experience */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                textAlign: 'right',
                                                color: '#00aaff',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {mob.Experience > 0 ? mob.Experience.toLocaleString() : '-'}
                                            </td>
                                            
                                            {/* Location */}
                                            <td style={{ 
                                                padding: '12px 14px', 
                                                color: '#aaa',
                                                fontSize: '0.95em',
                                                borderBottom: '1px solid #00ff0015'
                                            }}>
                                                {(() => {
                                                    if (!mob.Location) return '-';
                                                    if (Array.isArray(mob.Location)) {
                                                        return mob.Location.length > 0 ? mob.Location[0] : '-';
                                                    }
                                                    return mob.Location || '-';
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Panel - Mob Details */}
            {selectedMob && (
                <>
                    <div style={{
                        width: '520px',
                        maxWidth: '520px',
                        background: '#0a0a0a',
                        borderLeft: `4px solid ${getRarityColor(selectedMob)}`,
                        padding: '25px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        flexShrink: 0,
                        boxShadow: `-5px 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px ${getRarityColor(selectedMob)}20`,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '25px',
                        minWidth: 0
                    }}>
                        {/* Share Button */}
                        <button
                            onClick={() => handleShareMob(selectedMob)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '60px',
                                background: 'transparent',
                                border: '2px solid #00ff00',
                                color: '#00ff00',
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
                                transition: 'all 0.2s',
                                zIndex: 100
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
                            title="Share this mob"
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
                                setSelectedMob(null);
                            }}
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
                                transition: 'all 0.2s',
                                zIndex: 100
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

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            {/* Mob Header */}
                            <div style={{ 
                                paddingBottom: '20px',
                                borderBottom: `2px solid ${getRarityColor(selectedMob)}`,
                                textAlign: 'center'
                            }}>
                                <h2 style={{
                                    fontSize: '2.5em',
                                    color: getRarityColor(selectedMob),
                                    marginBottom: '8px',
                                    marginTop: 0,
                                    textShadow: `0 0 15px ${getRarityColor(selectedMob)}`,
                                    fontWeight: 'bold',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word'
                                }}>
                                    {cleanMobName(selectedMob.Name)}
                                </h2>
                                <div style={{ 
                                    color: '#888', 
                                    fontSize: '1.2em',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    lineHeight: '1.4',
                                    marginBottom: '15px'
                                }}>
                                    {normalizeMobType(selectedMob.Type)} {selectedMob.Tier && `- ${selectedMob.Tier}`}
                                </div>
                                {selectedMob.IsBoss && (
                                    <div style={{
                                        padding: '10px 20px',
                                        background: '#ff00ff30',
                                        border: '2px solid #ff00ff',
                                        borderRadius: '5px',
                                        color: '#ff00ff',
                                        fontSize: '1.4em',
                                        fontWeight: 'bold',
                                        display: 'inline-block',
                                        boxShadow: '0 0 20px rgba(255, 0, 255, 0.4)'
                                    }}>
                                        👑 BOSS
                                    </div>
                                )}
                            </div>

                            {/* Stats Section */}
                            <div style={{
                                background: '#1a1a1a',
                                border: '2px solid #00ff00',
                                borderRadius: '3px',
                                padding: '18px',
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
                                    {selectedMob.Level > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Level:</span>
                                            <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{selectedMob.Level}</span>
                                        </div>
                                    )}
                                    {selectedMob.Health > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Health:</span>
                                            <span style={{ color: '#ff6666', fontWeight: 'bold' }}>{selectedMob.Health.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {selectedMob.Damage > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Damage:</span>
                                            <span style={{ color: '#ff6600', fontWeight: 'bold' }}>{selectedMob.Damage}</span>
                                        </div>
                                    )}
                                    {selectedMob.Experience > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Experience:</span>
                                            <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{selectedMob.Experience.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ flexShrink: 0 }}>Faction:</span>
                                        <span style={{ 
                                            color: (!selectedMob.Faction || selectedMob.Faction.trim() === '') ? '#888' : '#ffaa00',
                                            fontWeight: 'bold',
                                            textAlign: 'right',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>
                                            {(!selectedMob.Faction || selectedMob.Faction.trim() === '') ? 'No Faction' : selectedMob.Faction}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dropped Items Section */}
                            {(() => {
                                const droppedItems = getDroppedItems(selectedMob);
                                if (droppedItems.length > 0) {
                                    return (
                                        <div style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #ffaa00',
                                            borderRadius: '3px',
                                            padding: '18px',
                                            boxShadow: 'inset 0 0 20px rgba(255, 170, 0, 0.1)'
                                        }}>
                                            <h3 style={{ 
                                                color: '#ffaa00', 
                                                marginBottom: '12px', 
                                                fontSize: '1.6em',
                                                borderBottom: '1px solid #ffaa0040',
                                                paddingBottom: '8px'
                                            }}>
                                                💎 Dropped Items ({droppedItems.length}):
                                            </h3>
                                            <div style={{ 
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                maxHeight: '300px',
                                                overflowY: 'auto',
                                                overflowX: 'hidden'
                                            }}>
                                                {droppedItems.map((item, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: '#0a0a0a',
                                                            borderRadius: '3px',
                                                            border: '1px solid #ffaa0040',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: '12px'
                                                        }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ 
                                                                color: '#ffaa00', 
                                                                fontWeight: 'bold',
                                                                fontSize: '1.1em',
                                                                marginBottom: '4px',
                                                                wordWrap: 'break-word',
                                                                overflowWrap: 'break-word'
                                                            }}>
                                                                {item.Name}
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '0.95em', 
                                                                color: '#888',
                                                                display: 'flex',
                                                                gap: '12px',
                                                                flexWrap: 'wrap'
                                                            }}>
                                                                {item.Type && (
                                                                    <span style={{ color: '#00aaff' }}>
                                                                        {item.Type}
                                                                    </span>
                                                                )}
                                                                {item.Level > 0 && (
                                                                    <span style={{ color: '#ffff00' }}>
                                                                        Lvl {item.Level}
                                                                    </span>
                                                                )}
                                                                {item.Value > 0 && (
                                                                    <span style={{ color: '#00ff00' }}>
                                                                        {item.Value} gold
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItemToNavigate(item);
                                                                setShowItemNavigationConfirm(true);
                                                            }}
                                                            style={{
                                                                padding: '6px 14px',
                                                                background: 'linear-gradient(135deg, #ffaa00 0%, #cc8800 100%)',
                                                                border: '2px solid #ffaa00',
                                                                borderRadius: '4px',
                                                                color: '#fff',
                                                                fontSize: '1em',
                                                                fontFamily: 'VT323, monospace',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s',
                                                                boxShadow: '0 0 8px rgba(255, 170, 0, 0.3)',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = 'linear-gradient(135deg, #ffcc00 0%, #ffaa00 100%)';
                                                                e.target.style.boxShadow = '0 0 15px rgba(255, 170, 0, 0.6)';
                                                                e.target.style.transform = 'translateY(-1px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = 'linear-gradient(135deg, #ffaa00 0%, #cc8800 100%)';
                                                                e.target.style.boxShadow = '0 0 8px rgba(255, 170, 0, 0.3)';
                                                                e.target.style.transform = 'translateY(0)';
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Region Section */}
                            {selectedMob.Location && selectedMob.Location.length > 0 && (() => {
                                // Parse location - if it's a string with commas, split it into an array
                                let locations = [];
                                if (Array.isArray(selectedMob.Location)) {
                                    locations = selectedMob.Location;
                                } else if (typeof selectedMob.Location === 'string') {
                                    // Check if the string contains commas (multiple regions)
                                    if (selectedMob.Location.includes(',')) {
                                        locations = selectedMob.Location.split(',').map(loc => loc.trim());
                                    } else {
                                        locations = [selectedMob.Location];
                                    }
                                }
                                
                                return (
                                    <div style={{
                                        background: '#1a1a1a',
                                        border: '2px solid #00aaff',
                                        borderRadius: '3px',
                                        padding: '18px',
                                        boxShadow: 'inset 0 0 20px rgba(0, 170, 255, 0.1)'
                                    }}>
                                        <h3 style={{ 
                                            color: '#00aaff', 
                                            marginBottom: '12px', 
                                            fontSize: '1.6em',
                                            borderBottom: '1px solid #00aaff40',
                                            paddingBottom: '8px'
                                        }}>
                                            Region{locations.length > 1 ? 's' : ''}:
                                        </h3>
                                        <div style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#ccc' }}>
                                            {locations.length > 1 ? (
                                                // Multiple locations - show individual "View on" buttons for each
                                                locations.map((loc, idx) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 12px',
                                                        background: '#0a0a0a',
                                                        borderRadius: '3px',
                                                        marginBottom: '8px',
                                                        border: '1px solid #00aaff40',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{
                                                            flex: 1,
                                                            wordWrap: 'break-word',
                                                            overflowWrap: 'break-word',
                                                            minWidth: 0
                                                        }}>
                                                            🗺️ {loc}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (onNavigateToMap) {
                                                                    onNavigateToMap({
                                                                        searchLocation: loc,
                                                                        mobName: selectedMob.Name,
                                                                        mobLevel: selectedMob.Level
                                                                    });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px 14px',
                                                                background: 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)',
                                                                border: '2px solid #00aaff',
                                                                borderRadius: '4px',
                                                                color: '#fff',
                                                                fontSize: '1em',
                                                                fontFamily: 'VT323, monospace',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s',
                                                                boxShadow: '0 0 8px rgba(0, 170, 255, 0.3)',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = 'linear-gradient(135deg, #00ddff 0%, #00aaff 100%)';
                                                                e.target.style.boxShadow = '0 0 15px rgba(0, 170, 255, 0.6)';
                                                                e.target.style.transform = 'translateY(-1px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)';
                                                                e.target.style.boxShadow = '0 0 8px rgba(0, 170, 255, 0.3)';
                                                                e.target.style.transform = 'translateY(0)';
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                // Single location - match the multiple locations layout
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    background: '#0a0a0a',
                                                    borderRadius: '3px',
                                                    marginBottom: '8px',
                                                    border: '1px solid #00aaff40',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        flex: 1,
                                                        wordWrap: 'break-word',
                                                        overflowWrap: 'break-word',
                                                        minWidth: 0
                                                    }}>
                                                        🗺️ {locations[0]}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (onNavigateToMap) {
                                                                onNavigateToMap({
                                                                    searchLocation: locations[0],
                                                                    mobName: selectedMob.Name,
                                                                    mobLevel: selectedMob.Level
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 14px',
                                                            background: 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)',
                                                            border: '2px solid #00aaff',
                                                            borderRadius: '4px',
                                                            color: '#fff',
                                                            fontSize: '1em',
                                                            fontFamily: 'VT323, monospace',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s',
                                                            boxShadow: '0 0 8px rgba(0, 170, 255, 0.3)',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #00ddff 0%, #00aaff 100%)';
                                                            e.target.style.boxShadow = '0 0 15px rgba(0, 170, 255, 0.6)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.background = 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)';
                                                            e.target.style.boxShadow = '0 0 8px rgba(0, 170, 255, 0.3)';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Description Section */}
                            {selectedMob.Description && (
                                <div style={{
                                    background: '#1a1a1a',
                                    border: '2px solid #666',
                                    borderRadius: '3px',
                                    padding: '18px',
                                    fontSize: '1.1em',
                                    color: '#ccc',
                                    lineHeight: '1.8',
                                    fontStyle: 'italic',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word'
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
                                    {selectedMob.Description}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Far Right - Pixel Art Display */}
                    <div style={{
                        width: '360px',
                        background: '#0a0a0a',
                        borderLeft: `4px solid ${getRarityColor(selectedMob)}`,
                        padding: '25px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `-5px 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px ${getRarityColor(selectedMob)}20`
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: '320px',
                            background: '#1a1a1a',
                            border: `3px solid ${getRarityColor(selectedMob)}`,
                            borderRadius: '8px',
                            padding: '20px',
                            boxShadow: `0 0 30px ${getRarityColor(selectedMob)}60, inset 0 0 30px ${getRarityColor(selectedMob)}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '100%',
                                paddingTop: '100%',
                                position: 'relative',
                                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                                border: `2px solid ${getRarityColor(selectedMob)}40`,
                                borderRadius: '5px',
                                overflow: 'hidden'
                            }}>
                                {/* Grid pattern background */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)',
                                    backgroundSize: '20px 20px',
                                    pointerEvents: 'none'
                                }} />

                                <MobSprite 
                                    mobId={selectedMob.Id}
                                    size={256}
                                    alt={cleanMobName(selectedMob.Name)}
                                    lazy={false}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        maxWidth: '90%',
                                        maxHeight: '90%',
                                        filter: `drop-shadow(0 0 20px ${getRarityColor(selectedMob)})`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Item Detail Modal */}
            {selectedDroppedItem && (
                <div 
                    onClick={() => setSelectedDroppedItem(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                            border: '3px solid #ffaa00',
                            borderRadius: '10px',
                            padding: '30px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            boxShadow: '0 0 40px rgba(255, 170, 0, 0.5)',
                            position: 'relative'
                        }}>
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedDroppedItem(null)}
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
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#ff0000';
                                e.target.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#ff0000';
                            }}
                        >
                            ✕
                        </button>

                        {/* Item Title */}
                        <h2 style={{
                            color: '#ffaa00',
                            fontSize: '2em',
                            marginBottom: '20px',
                            marginTop: '10px',
                            borderBottom: '2px solid #ffaa00',
                            paddingBottom: '10px',
                            wordWrap: 'break-word'
                        }}>
                            {selectedDroppedItem.Name}
                        </h2>

                        {/* Item Details Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '15px',
                            marginBottom: '20px'
                        }}>
                            {/* Basic Info */}
                            <div style={{
                                background: '#0a0a0a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                padding: '15px'
                            }}>
                                <h3 style={{ color: '#00ff00', marginBottom: '12px', fontSize: '1.4em' }}>
                                    Basic Info
                                </h3>
                                <div style={{ fontSize: '1.1em', lineHeight: '1.8' }}>
                                    {selectedDroppedItem.Type && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#888' }}>Type:</span>
                                            <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{selectedDroppedItem.Type}</span>
                                        </div>
                                    )}
                                    {selectedDroppedItem.Level > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#888' }}>Level:</span>
                                            <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{selectedDroppedItem.Level}</span>
                                        </div>
                                    )}
                                    {selectedDroppedItem.Value > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#888' }}>Value:</span>
                                            <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{selectedDroppedItem.Value} gold</span>
                                        </div>
                                    )}
                                    {selectedDroppedItem.Weight > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#888' }}>Weight:</span>
                                            <span style={{ color: '#aaa' }}>{selectedDroppedItem.Weight}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Combat Stats */}
                            {(selectedDroppedItem.Damage > 0 || selectedDroppedItem.Armor > 0) && (
                                <div style={{
                                    background: '#0a0a0a',
                                    border: '2px solid #ff6600',
                                    borderRadius: '5px',
                                    padding: '15px'
                                }}>
                                    <h3 style={{ color: '#ff6600', marginBottom: '12px', fontSize: '1.4em' }}>
                                        Combat Stats
                                    </h3>
                                    <div style={{ fontSize: '1.1em', lineHeight: '1.8' }}>
                                        {selectedDroppedItem.Damage > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Damage:</span>
                                                <span style={{ color: '#ff6600', fontWeight: 'bold' }}>{selectedDroppedItem.Damage}</span>
                                            </div>
                                        )}
                                        {selectedDroppedItem.Armor > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Armor:</span>
                                                <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{selectedDroppedItem.Armor}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Character Stats */}
                            {(selectedDroppedItem.Health > 0 || selectedDroppedItem.Mana > 0 || selectedDroppedItem.Stamina > 0) && (
                                <div style={{
                                    background: '#0a0a0a',
                                    border: '2px solid #00aaff',
                                    borderRadius: '5px',
                                    padding: '15px'
                                }}>
                                    <h3 style={{ color: '#00aaff', marginBottom: '12px', fontSize: '1.4em' }}>
                                        Character Stats
                                    </h3>
                                    <div style={{ fontSize: '1.1em', lineHeight: '1.8' }}>
                                        {selectedDroppedItem.Health > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Health:</span>
                                                <span style={{ color: '#ff6666', fontWeight: 'bold' }}>+{selectedDroppedItem.Health}</span>
                                            </div>
                                        )}
                                        {selectedDroppedItem.Mana > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Mana:</span>
                                                <span style={{ color: '#00aaff', fontWeight: 'bold' }}>+{selectedDroppedItem.Mana}</span>
                                            </div>
                                        )}
                                        {selectedDroppedItem.Stamina > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Stamina:</span>
                                                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>+{selectedDroppedItem.Stamina}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Requirements */}
                            {(selectedDroppedItem.RequiredLevel > 0 || selectedDroppedItem.RequiredStr > 0 || 
                              selectedDroppedItem.RequiredAgi > 0 || selectedDroppedItem.RequiredInt > 0) && (
                                <div style={{
                                    background: '#0a0a0a',
                                    border: '2px solid #ffff00',
                                    borderRadius: '5px',
                                    padding: '15px'
                                }}>
                                    <h3 style={{ color: '#ffff00', marginBottom: '12px', fontSize: '1.4em' }}>
                                        Requirements
                                    </h3>
                                    <div style={{ fontSize: '1.1em', lineHeight: '1.8' }}>
                                        {selectedDroppedItem.RequiredLevel > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Level:</span>
                                                <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{selectedDroppedItem.RequiredLevel}</span>
                                            </div>
                                        )}
                                        {selectedDroppedItem.RequiredStr > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Strength:</span>
                                                <span style={{ color: '#ff6600', fontWeight: 'bold' }}>{selectedDroppedItem.RequiredStr}</span>
                                            </div>
                                        )}
                                        {selectedDroppedItem.RequiredAgi > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Agility:</span>
                                                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{selectedDroppedItem.RequiredAgi}</span>
                                            </div>
                                        )}
                                        {selectedDroppedItem.RequiredInt > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#888' }}>Intelligence:</span>
                                                <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{selectedDroppedItem.RequiredInt}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {selectedDroppedItem.Description && selectedDroppedItem.Description.trim() !== '' && (
                            <div style={{
                                background: '#0a0a0a',
                                border: '2px solid #888',
                                borderRadius: '5px',
                                padding: '15px',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#888', marginBottom: '12px', fontSize: '1.4em' }}>
                                    Description
                                </h3>
                                <p style={{ 
                                    color: '#aaa', 
                                    fontSize: '1.1em', 
                                    lineHeight: '1.6',
                                    wordWrap: 'break-word'
                                }}>
                                    {selectedDroppedItem.Description}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            flexWrap: 'wrap'
                        }}>
                            {/* View in Items Page Button */}
                            {onNavigateToItems && (
                                <button
                                    onClick={() => {
                                        onNavigateToItems({ Id: selectedDroppedItem.Id });
                                        setSelectedDroppedItem(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        minWidth: '200px',
                                        padding: '15px',
                                        background: 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)',
                                        border: '2px solid #00ff00',
                                        borderRadius: '5px',
                                        color: '#000',
                                        fontSize: '1.3em',
                                        fontFamily: 'VT323, monospace',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'linear-gradient(135deg, #00ffaa 0%, #00dd00 100%)';
                                        e.target.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.7)';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)';
                                        e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.4)';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    📦 View Full Details in Items Page
                                </button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedDroppedItem(null)}
                                style={{
                                    flex: 1,
                                    minWidth: '150px',
                                    padding: '15px',
                                    background: '#2a2a2a',
                                    border: '2px solid #666',
                                    borderRadius: '5px',
                                    color: '#aaa',
                                    fontSize: '1.3em',
                                    fontFamily: 'VT323, monospace',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#3a3a3a';
                                    e.target.style.borderColor = '#888';
                                    e.target.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#2a2a2a';
                                    e.target.style.borderColor = '#666';
                                    e.target.style.color = '#aaa';
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Navigation Confirmation Dialog */}
            {showItemNavigationConfirm && selectedItemToNavigate && (
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
                        setShowItemNavigationConfirm(false);
                        setSelectedItemToNavigate(null);
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                            border: '3px solid #ffaa00',
                            borderRadius: '10px',
                            padding: '30px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 0 40px rgba(255, 170, 0, 0.6), inset 0 0 20px rgba(255, 170, 0, 0.1)',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setShowItemNavigationConfirm(false);
                                setSelectedItemToNavigate(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'transparent',
                                border: 'none',
                                color: '#ffaa00',
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
                                e.currentTarget.style.background = '#ffaa00';
                                e.currentTarget.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#ffaa00';
                            }}
                        >
                            ×
                        </button>

                        {/* Title */}
                        <h2 style={{
                            color: '#ffaa00',
                            textAlign: 'center',
                            marginBottom: '20px',
                            fontSize: '1.8em',
                            textShadow: '0 0 10px rgba(255, 170, 0, 0.5)',
                            borderBottom: '2px solid #ffaa0040',
                            paddingBottom: '15px'
                        }}>
                            💎 Navigate to Item?
                        </h2>

                        {/* Item preview */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            padding: '20px',
                            background: '#0a0a0a',
                            borderRadius: '8px',
                            border: '2px solid #ffaa0040',
                            marginBottom: '25px',
                            boxShadow: 'inset 0 0 15px rgba(255, 170, 0, 0.1)'
                        }}>
                            {/* Item Icon */}
                            <div style={{
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#1a1a1a',
                                border: '2px solid #ffaa00',
                                borderRadius: '8px',
                                boxShadow: '0 0 15px rgba(255, 170, 0, 0.5)',
                                padding: '4px',
                                flexShrink: 0,
                                fontSize: '32px'
                            }}>
                                💎
                            </div>

                            {/* Item Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#ffaa00',
                                    fontWeight: 'bold',
                                    fontSize: '1.3em',
                                    marginBottom: '5px'
                                }}>
                                    {selectedItemToNavigate.Name}
                                </div>
                                {selectedItemToNavigate.Type && (
                                    <div style={{
                                        color: '#00aaff',
                                        fontSize: '0.95em',
                                        marginBottom: '3px'
                                    }}>
                                        Type: {selectedItemToNavigate.Type}
                                    </div>
                                )}
                                {selectedItemToNavigate.Level > 0 && (
                                    <div style={{
                                        color: '#00ff00',
                                        fontSize: '0.95em'
                                    }}>
                                        Level: {selectedItemToNavigate.Level}
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
                            Would you like to navigate to the <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>Items</span> page to view this item's details?
                        </p>

                        {/* Action buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => {
                                    if (onNavigateToItems) {
                                        onNavigateToItems({ Id: selectedItemToNavigate.Id });
                                    }
                                    setShowItemNavigationConfirm(false);
                                    setSelectedItemToNavigate(null);
                                }}
                                style={{
                                    padding: '12px 30px',
                                    fontSize: '1.1em',
                                    fontWeight: 'bold',
                                    background: '#ffaa00',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 0 15px rgba(255, 170, 0, 0.5)',
                                    minWidth: '120px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ffcc00';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 204, 0, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffaa00';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 170, 0, 0.5)';
                                }}
                            >
                                ✓ Yes, Go!
                            </button>
                            <button
                                onClick={() => {
                                    setShowItemNavigationConfirm(false);
                                    setSelectedItemToNavigate(null);
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

export default MobsPage;
