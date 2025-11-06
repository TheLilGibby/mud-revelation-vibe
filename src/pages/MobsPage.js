import React, { useState, useEffect } from 'react';

function MobsPage({ onNavigateToMap }) {
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
    const [isLoading, setIsLoading] = useState(true);
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
    const [showTypes, setShowTypes] = useState(false);
    const [showTiers, setShowTiers] = useState(false);
    const [showFactions, setShowFactions] = useState(false);
    const [showLocations, setShowLocations] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [locationSearchTerm, setLocationSearchTerm] = useState('');
    const itemsPerPage = 50;

    // Clean mob names
    const cleanMobName = (name) => {
        if (!name) return '';
        return name.replace(/\\cf\d+/gi, '').replace(/\\cf\w+/gi, '').trim().replace(/\.$/, '');
    };

    // Handle slider z-index for LEVEL slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-level');
        const maxSlider = document.querySelector('.dual-range-max-level');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) {
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
            }
        };
        
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

    // Handle slider z-index for HEALTH slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-health');
        const maxSlider = document.querySelector('.dual-range-max-health');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) {
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
            }
        };
        
        const sliderContainer = minSlider.parentElement;
        if (sliderContainer) {
            sliderContainer.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [minHealth, maxHealth, absoluteMaxHealth]);

    // Handle slider z-index for DAMAGE slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-damage');
        const maxSlider = document.querySelector('.dual-range-max-damage');
        
        if (!minSlider || !maxSlider) return;

        const handleMouseMove = (e) => {
            if (!e.buttons) {
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
            }
        };
        
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

    // Load mobs data
    useEffect(() => {
        fetch('/GameData/Mobs.json')
            .then(response => response.json())
            .then(data => {
                setMobs(data);
                setFilteredMobs(data);
                
                // Set all types as selected by default
                const allTypes = [...new Set(data.map(mob => mob.Type).filter(Boolean))];
                setSelectedTypes(allTypes);
                
                // Set all tiers as selected by default
                const allTiers = [...new Set(data.map(mob => mob.Tier).filter(Boolean))];
                setSelectedTiers(allTiers);
                
                // Set all factions as selected by default (including "No Faction")
                const allFactions = [...new Set(data.map(mob => {
                    if (!mob.Faction || mob.Faction.trim() === '') return 'No Faction';
                    return mob.Faction;
                }))].sort();
                setSelectedFactions(allFactions);
                
                // Set all locations as selected by default
                const allLocations = [...new Set(
                    data.flatMap(mob => {
                        if (!mob.Location) return [];
                        if (Array.isArray(mob.Location)) {
                            return mob.Location.filter(loc => loc && loc.trim() !== '');
                        }
                        return mob.Location.trim() !== '' ? [mob.Location] : [];
                    })
                )].sort();
                setSelectedLocations(allLocations);
                
                // Calculate max health from data
                const maxMobHealth = Math.max(...data.map(mob => mob.Health || 0));
                const calculatedMaxHealth = Math.ceil(maxMobHealth / 1000) * 1000;
                setMaxHealth(calculatedMaxHealth);
                setAbsoluteMaxHealth(calculatedMaxHealth);
                
                // Calculate max damage from data
                const maxMobDamage = Math.max(...data.map(mob => mob.Damage || 0));
                const calculatedMaxDamage = Math.max(100, Math.ceil(maxMobDamage / 10) * 10);
                setMaxDamage(calculatedMaxDamage);
                setAbsoluteMaxDamage(calculatedMaxDamage);
                
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading mobs:', error);
                setIsLoading(false);
            });
    }, []);

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
            const allTypes = [...new Set(mobs.map(mob => mob.Type).filter(Boolean))];
            if (selectedTypes.length < allTypes.length) {
                filtered = filtered.filter(mob => 
                    !mob.Type || selectedTypes.includes(mob.Type)
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

        setFilteredMobs(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedTypes, selectedTiers, selectedFactions, selectedLocations, showBossOnly, sortBy, minLevel, maxLevel, minHealth, maxHealth, minDamage, maxDamage, mobs]);

    // Get unique types, tiers, factions, and locations
    const mobTypes = [...new Set(mobs.map(mob => mob.Type).filter(Boolean))].sort();
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

                {/* Boss Filter Toggle */}
                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
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
                            padding: '12px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginBottom: showTypes ? '12px' : '0',
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
                                        ({mobs.filter(mob => mob.Type === type).length})
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
                                padding: '12px',
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
                                padding: '12px',
                                marginTop: '12px',
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
                                            padding: '8px',
                                            marginBottom: '4px',
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
                                padding: '12px',
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
                                padding: '12px',
                                marginTop: '12px',
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
                                            padding: '8px',
                                            marginBottom: '4px',
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
                                padding: '12px',
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
                                📍 Locations
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
                                padding: '12px',
                                marginTop: '12px'
                            }}>
                                {/* Location Search Box */}
                                <div style={{ marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        value={locationSearchTerm}
                                        onChange={(e) => setLocationSearchTerm(e.target.value)}
                                        placeholder="Search locations..."
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
                                            ).length} location{mobLocations.filter(loc => 
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
                                            padding: '10px 8px',
                                            marginBottom: '8px',
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

                                    {/* Individual Location Checkboxes - Filtered */}
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
                                                    padding: '8px',
                                                    marginBottom: '4px',
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
                    
                    {/* Health Labels */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.9em',
                        color: '#888'
                    }}>
                        <span>0</span>
                        <span>{Math.floor(absoluteMaxHealth * 0.25).toLocaleString()}</span>
                        <span>{Math.floor(absoluteMaxHealth * 0.5).toLocaleString()}</span>
                        <span>{Math.floor(absoluteMaxHealth * 0.75).toLocaleString()}</span>
                        <span>{absoluteMaxHealth.toLocaleString()}</span>
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
                        setSelectedTypes([...mobTypes]);
                        setSelectedTiers([...mobTiers]);
                        setSelectedFactions([...mobFactions]);
                        setSelectedLocations([...mobLocations]);
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
                padding: '20px',
                overflowY: 'auto'
            }}>
                {/* Pagination Info */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    padding: '15px',
                    background: '#1a1a1a',
                    border: '2px solid #00ff00',
                    borderRadius: '5px'
                }}>
                    <div style={{ fontSize: '1.3em' }}>
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMobs.length)} of {filteredMobs.length}
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

                {/* Mob Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '15px'
                }}>
                    {currentMobs.map(mob => (
                        <div
                            key={mob.Id}
                            onClick={() => setSelectedMob(mob)}
                            style={{
                                background: '#1a1a1a',
                                border: `2px solid ${getRarityColor(mob)}`,
                                borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 20px ${getRarityColor(mob)}80`;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                {/* Mob Pixel Art */}
                                <div style={{ 
                                    marginRight: '15px',
                                    width: '64px',
                                    height: '64px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#1a1a1a',
                                    border: `2px solid ${getRarityColor(mob)}`,
                                    borderRadius: '5px',
                                    boxShadow: `0 0 10px ${getRarityColor(mob)}40`,
                                    padding: '4px'
                                }}>
                                    <img 
                                        src={`/images/mobs/${mob.Id}.png`} 
                                        alt={cleanMobName(mob.Name)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            imageRendering: 'pixelated',
                                            imageRendering: '-moz-crisp-edges',
                                            imageRendering: 'crisp-edges'
                                        }}
                                        onError={(e) => {
                                            // Fallback to emoji icon if image not found
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <span style={{ 
                                        fontSize: '2em',
                                        display: 'none' // Hidden by default, shown on image error
                                    }}>
                                        {getMobIcon(mob)}
                                    </span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '1.3em',
                                        fontWeight: 'bold',
                                        color: getRarityColor(mob),
                                        marginBottom: '3px'
                                    }}>
                                        {cleanMobName(mob.Name) || 'Unknown Mob'}
                                    </div>
                                    <div style={{ fontSize: '0.9em', color: '#888' }}>
                                        {mob.Type || 'Unknown'} {mob.Tier && `- ${mob.Tier}`}
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: '1.1em', color: '#aaa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {mob.Level > 0 && (
                                    <div>Level: <span style={{ color: '#ffff00' }}>{mob.Level}</span></div>
                                )}
                                {mob.Health > 0 && (
                                    <div>HP: <span style={{ color: '#ff6666' }}>{mob.Health}</span></div>
                                )}
                                {mob.Damage > 0 && (
                                    <div>DMG: <span style={{ color: '#ff6600' }}>{mob.Damage}</span></div>
                                )}
                                {mob.Experience > 0 && (
                                    <div>EXP: <span style={{ color: '#00aaff' }}>{mob.Experience}</span></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMobs.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: '1.5em',
                        color: '#888',
                        marginTop: '50px'
                    }}>
                        No mobs found matching your filters.
                    </div>
                )}
            </div>

            {/* Right Panel - Mob Details */}
            {selectedMob && (
                <div style={{
                    width: '550px',
                    background: '#0a0a0a',
                    borderLeft: `4px solid ${getRarityColor(selectedMob)}`,
                    padding: '25px',
                    overflowY: 'auto',
                    flexShrink: 0,
                    boxShadow: `-5px 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px ${getRarityColor(selectedMob)}20`
                }}>
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedMob(null)}
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

                    {/* Large Pixel Art Display */}
                    <div style={{
                        marginBottom: '25px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: '#1a1a1a',
                        border: `3px solid ${getRarityColor(selectedMob)}`,
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: `0 0 30px ${getRarityColor(selectedMob)}60, inset 0 0 30px ${getRarityColor(selectedMob)}20`
                    }}>
                        <div style={{
                            width: '400px',
                            height: '400px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                            border: `2px solid ${getRarityColor(selectedMob)}40`,
                            borderRadius: '5px',
                            position: 'relative',
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
                            
                            <img 
                                src={`/images/mobs/${selectedMob.Id}.png`} 
                                alt={cleanMobName(selectedMob.Name)}
                                style={{
                                    maxWidth: '90%',
                                    maxHeight: '90%',
                                    imageRendering: 'pixelated',
                                    imageRendering: '-moz-crisp-edges',
                                    imageRendering: 'crisp-edges',
                                    filter: `drop-shadow(0 0 20px ${getRarityColor(selectedMob)})`,
                                    position: 'relative',
                                    zIndex: 1
                                }}
                                onError={(e) => {
                                    // Fallback to emoji icon if image not found
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{ 
                                fontSize: '12em',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                filter: `drop-shadow(0 0 20px ${getRarityColor(selectedMob)})`,
                                position: 'relative',
                                zIndex: 1
                            }}>
                                {getMobIcon(selectedMob)}
                            </div>
                        </div>
                    </div>

                    {/* Mob Header */}
                    <div style={{ 
                        marginBottom: '25px',
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
                            {selectedMob.Type} {selectedMob.Tier && `- ${selectedMob.Tier}`}
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

                    {/* Location Section */}
                    {selectedMob.Location && selectedMob.Location.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #00aaff',
                            borderRadius: '3px',
                            padding: '18px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(0, 170, 255, 0.1)'
                        }}>
                            <h3 style={{ 
                                color: '#00aaff', 
                                marginBottom: '12px', 
                                fontSize: '1.6em',
                                borderBottom: '1px solid #00aaff40',
                                paddingBottom: '8px'
                            }}>
                                Location{selectedMob.Location.length > 1 ? 's' : ''}:
                            </h3>
                            <div style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#ccc' }}>
                                {Array.isArray(selectedMob.Location) ? (
                                    selectedMob.Location.map((loc, idx) => (
                                        <div key={idx} style={{
                                            padding: '8px',
                                            background: '#0a0a0a',
                                            borderRadius: '3px',
                                            marginBottom: '8px',
                                            border: '1px solid #00aaff40',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>
                                            📍 {loc}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        padding: '8px',
                                        background: '#0a0a0a',
                                        borderRadius: '3px',
                                        border: '1px solid #00aaff40',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word'
                                    }}>
                                        📍 {selectedMob.Location}
                                    </div>
                                )}
                            </div>
                            
                            {/* View on Map Button */}
                            <button
                                onClick={() => {
                                    // Get the first location if it's an array
                                    const location = Array.isArray(selectedMob.Location) 
                                        ? selectedMob.Location[0] 
                                        : selectedMob.Location;
                                    
                                    // Navigate to map page with mob data
                                    if (onNavigateToMap) {
                                        onNavigateToMap({
                                            searchLocation: location,
                                            mobName: selectedMob.Name,
                                            mobLevel: selectedMob.Level
                                        });
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '12px',
                                    background: 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)',
                                    border: '2px solid #00aaff',
                                    borderRadius: '5px',
                                    color: '#fff',
                                    fontSize: '1.2em',
                                    fontFamily: 'VT323, monospace',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 0 10px rgba(0, 170, 255, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #00ddff 0%, #00aaff 100%)';
                                    e.target.style.boxShadow = '0 0 20px rgba(0, 170, 255, 0.6)';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)';
                                    e.target.style.boxShadow = '0 0 10px rgba(0, 170, 255, 0.3)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <span style={{ fontSize: '1.3em' }}>🗺️</span>
                                View on Map
                            </button>
                        </div>
                    )}

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
            )}
        </div>
    );
}

export default MobsPage;
