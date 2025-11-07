import React, { useState, useEffect } from 'react';
import { loadMobData, getMobsInZone, findMobByName, getMobTierColor, getMobDifficultyText, getMobZones } from '../utils/mobDataLoader';

// Helper function to get user-friendly mob type display
function getMobTypeDisplay(mob) {
    const type = mob.Type;
    
    // Non-combat NPCs - Only specific NPC types
    if (type === 'PLAYER_GREETING' || type === 'OUT_OF_MONEY' || type === 'QUEST_GIVER' || type === 'MERCHANT') {
        return '🗣️ NPC';
    }
    
    // Combat mobs (including Type "0" which are typically hostile creatures)
    if (type === 'NORMAL' || type === '0' || type === 0 || type === '') {
        return '⚔️ Mob';
    }
    
    if (type === 'BOSS') {
        return '👑 Boss';
    }
    
    if (type === 'ELITE') {
        return '⭐ Elite';
    }
    
    // Default: treat as mob
    return '⚔️ Mob';
}

// Helper function to get color for mob type
function getMobTypeColor(mob) {
    const type = mob.Type;
    
    // NPCs are cyan/friendly color - Only specific NPC types
    if (type === 'PLAYER_GREETING' || type === 'OUT_OF_MONEY' || type === 'QUEST_GIVER' || type === 'MERCHANT') {
        return '#00FFFF';
    }
    
    // Normal mobs are yellow (including Type "0" which are typically hostile creatures)
    if (type === 'NORMAL' || type === '0' || type === 0 || type === '') {
        return '#FFFF00';
    }
    
    // Bosses are red
    if (type === 'BOSS') {
        return '#FF0000';
    }
    
    // Elite are purple
    if (type === 'ELITE') {
        return '#FF00FF';
    }
    
    // Default - treat as mob
    return '#FFFF00';
}

function WikiSidebar({ zoneName, zoneData, roomNpcs, isVisible, onClose, onHighlightMob, onClearHighlight, onShowMobPath, highlightedMob, currentFloor }) {
    const [mobData, setMobData] = useState(null);
    const [zoneMobs, setZoneMobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(true); // Show/hide filters
    const [mobSearchTerm, setMobSearchTerm] = useState(''); // Search term for mobs
    
    // Sort and filter states
    const [sortBy, setSortBy] = useState('level'); // 'level', 'name', 'type'
    const [filterType, setFilterType] = useState('all'); // 'all', or specific type
    const [showBossOnly, setShowBossOnly] = useState(false);
    const [minLevel, setMinLevel] = useState(0); // Minimum level filter (0-200)
    const [maxLevel, setMaxLevel] = useState(200); // Maximum level filter (0-200)

    // Add CSS for range slider thumbs
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            /* WebKit (Chrome, Safari) */
            input[type="range"].mob-level-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #00ff00;
                cursor: pointer;
                border: 2px solid #000;
                box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
                position: relative;
                z-index: 10;
            }
            
            input[type="range"].mob-level-range::-webkit-slider-thumb:hover {
                background: #ffff00;
                box-shadow: 0 0 12px rgba(255, 255, 0, 1);
                transform: scale(1.1);
            }
            
            /* Firefox */
            input[type="range"].mob-level-range::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #00ff00;
                cursor: pointer;
                border: 2px solid #000;
                box-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
            }
            
            input[type="range"].mob-level-range::-moz-range-thumb:hover {
                background: #ffff00;
                box-shadow: 0 0 12px rgba(255, 255, 0, 1);
                transform: scale(1.1);
            }
            
            /* Remove default track styling */
            input[type="range"].mob-level-range::-webkit-slider-runnable-track {
                background: transparent;
            }
            
            input[type="range"].mob-level-range::-moz-range-track {
                background: transparent;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Handle slider z-index and pointer events based on thumb positions
    useEffect(() => {
        const minSlider = document.querySelector('.mob-level-range-min');
        const maxSlider = document.querySelector('.mob-level-range-max');
        
        if (!minSlider || !maxSlider) return;

        // Update z-index based on thumb proximity
        const updateZIndex = () => {
            // If thumbs are far apart, both are easily accessible
            if (Math.abs(maxLevel - minLevel) > 10) {
                // Min slider on top for left side, max for right side
                if (minLevel < maxLevel / 2) {
                    minSlider.style.zIndex = '5';
                    maxSlider.style.zIndex = '4';
                } else {
                    minSlider.style.zIndex = '4';
                    maxSlider.style.zIndex = '5';
                }
            } else {
                // When close together, determine by position
                minSlider.style.zIndex = '5';
                maxSlider.style.zIndex = '4';
            }
        };

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

        updateZIndex();
        
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
    }, [minLevel, maxLevel])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await loadMobData();
            if (data) {
                setMobData(data);
                const mobs = getMobsInZone(data, zoneName);
                setZoneMobs(mobs);
            }
            setLoading(false);
        };

        if (isVisible) {
            loadData();
        }
    }, [zoneName, isVisible]);

    if (!isVisible) return null;

    // Helper function to get all levels (Z coordinates) where a mob appears
    const getMobLevels = (mobName) => {
        if (!zoneData || !zoneData.rooms) return [];
        
        const levels = new Set();
        zoneData.rooms.forEach(room => {
            const hasMob = room.npcs.some(npc => 
                npc.name.toLowerCase() === mobName.toLowerCase()
            );
            if (hasMob) {
                // Use the display Z coordinate (already normalized to start at 0)
                levels.add(room.position.z);
            }
        });
        
        return Array.from(levels).sort((a, b) => a - b);
    };

    // Apply filters
    let filteredMobs = [...zoneMobs];
    
    // Filter by search term
    if (mobSearchTerm) {
        filteredMobs = filteredMobs.filter(mob => 
            mob.Name?.toLowerCase().includes(mobSearchTerm.toLowerCase())
        );
    }
    
    // Filter by type
    if (filterType !== 'all') {
        if (filterType === 'NPC') {
            // NPC filter includes only specific quest/merchant NPC types
            filteredMobs = filteredMobs.filter(mob => 
                mob.Type === 'PLAYER_GREETING' || 
                mob.Type === 'OUT_OF_MONEY' ||
                mob.Type === 'QUEST_GIVER' ||
                mob.Type === 'MERCHANT'
            );
        } else if (filterType === 'Mob') {
            // Mob filter includes Type "0", "NORMAL", and empty types (hostile creatures)
            filteredMobs = filteredMobs.filter(mob => 
                mob.Type === 'NORMAL' || 
                mob.Type === '0' || 
                mob.Type === 0 ||
                mob.Type === '' ||
                (!mob.Type && mob.Type !== 'PLAYER_GREETING' && mob.Type !== 'OUT_OF_MONEY' && mob.Type !== 'QUEST_GIVER' && mob.Type !== 'MERCHANT')
            );
        } else {
            filteredMobs = filteredMobs.filter(mob => mob.Type === filterType);
        }
    }
    
    // Filter by level range
    filteredMobs = filteredMobs.filter(mob => {
        const mobLevel = mob.Level || 0;
        return mobLevel >= minLevel && mobLevel <= maxLevel;
    });
    
    // Filter boss only
    if (showBossOnly) {
        filteredMobs = filteredMobs.filter(mob => mob.IsBoss);
    }

    // Apply sorting
    const sortedZoneMobs = [...filteredMobs].sort((a, b) => {
        switch (sortBy) {
            case 'level':
                return a.Level - b.Level;
            case 'level-desc':
                return b.Level - a.Level;
            case 'name':
                return a.Name.localeCompare(b.Name);
            case 'type':
                return (a.Type || '').localeCompare(b.Type || '');
            default:
                return 0;
        }
    });

    // Get unique types for filters
    const uniqueTypes = [...new Set(zoneMobs.map(m => m.Type).filter(Boolean))];
    
    // Add common types that should always be available (excluding NPC which is a special filter)
    const commonTypes = ['NORMAL', 'PLAYER_GREETING', '0', 'OUT_OF_MONEY', 'BOSS', 'ELITE'];
    const allTypes = [...new Set([...commonTypes, ...uniqueTypes])].filter(t => t && t !== 'NPC').sort();

    return (
        <div className="wiki-sidebar">
            <div className="wiki-header">
                <h3>📚 Wiki: {zoneName}</h3>
                <button className="wiki-close" onClick={onClose} title="Close Wiki">
                    ✕
                </button>
            </div>

            <div className="wiki-content">
                {loading ? (
                    <div className="wiki-loading">
                        <p>Loading mob data...</p>
                    </div>
                ) : (
                    <div className="wiki-mob-list">
                                <div className="wiki-section-header">
                                    <h4>All Mobs in {zoneName}</h4>
                                    <span className="mob-count">
                                        {sortedZoneMobs.length} / {zoneMobs.length}
                                    </span>
                                </div>

                                {/* Search Box */}
                                <div style={{
                                    marginBottom: '10px'
                                }}>
                                    <input
                                        type="text"
                                        value={mobSearchTerm}
                                        onChange={(e) => setMobSearchTerm(e.target.value)}
                                        placeholder="🔍 Search mobs..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            borderRadius: '5px',
                                            color: '#00ff00',
                                            fontSize: '1em',
                                            fontFamily: 'VT323, monospace'
                                        }}
                                    />
                                </div>

                                {/* Show/Hide Filters Button */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        background: showFilters ? '#00ff0020' : '#2a2a2a',
                                        border: '2px solid #00ff00',
                                        borderRadius: '5px',
                                        color: '#00ff00',
                                        fontSize: '1.1em',
                                        fontFamily: 'VT323, monospace',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#00ff0030';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = showFilters ? '#00ff0020' : '#2a2a2a';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <span>{showFilters ? '🔽' : '▶️'} Filters</span>
                                    <span style={{ fontSize: '0.9em', opacity: 0.7 }}>
                                        {showFilters ? 'Hide' : 'Show'}
                                    </span>
                                </button>

                                {/* Sort and Filter Controls */}
                                {showFilters && (
                                    <div className="filter-controls" style={{
                                        background: '#0a0a0a',
                                        padding: '12px',
                                        marginBottom: '15px',
                                        border: '1px solid #333',
                                        borderRadius: '5px'
                                    }}>
                                    {/* Sort */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ 
                                            color: '#00ff00', 
                                            fontSize: '0.9em',
                                            fontWeight: 'bold',
                                            marginBottom: '5px',
                                            display: 'block'
                                        }}>
                                            🔽 Sort By:
                                        </label>
                                        <select 
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '6px',
                                                background: '#1a1a1a',
                                                color: '#00ff00',
                                                border: '1px solid #00ff00',
                                                borderRadius: '3px',
                                                fontSize: '0.9em',
                                                fontFamily: 'VT323, monospace'
                                            }}
                                        >
                                            <option value="level">Level (Low to High)</option>
                                            <option value="level-desc">Level (High to Low)</option>
                                            <option value="name">Name (A-Z)</option>
                                            <option value="type">Type</option>
                                        </select>
                                    </div>

                                    {/* Filter by Type */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ 
                                            color: '#00ff00', 
                                            fontSize: '0.9em',
                                            fontWeight: 'bold',
                                            marginBottom: '5px',
                                            display: 'block'
                                        }}>
                                            🎯 Filter by Type:
                                        </label>
                                        <select 
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '6px',
                                                background: '#1a1a1a',
                                                color: '#00ff00',
                                                border: '1px solid #00ff00',
                                                borderRadius: '3px',
                                                fontSize: '0.9em',
                                                fontFamily: 'VT323, monospace'
                                            }}
                                        >
                                            <option value="all">All Types</option>
                                            <option value="NPC">🗣️ NPCs (Non-Combat)</option>
                                            <option value="PLAYER_GREETING">👋 Player Greeting</option>
                                            <option value="NORMAL">⚔️ Normal Mobs</option>
                                            <option value="0">📋 Type 0 (Basic NPC)</option>
                                            <option value="OUT_OF_MONEY">💰 Out of Money</option>
                                            <option value="BOSS">👑 Boss</option>
                                            <option value="ELITE">⭐ Elite</option>
                                            {allTypes.filter(t => !['NPC', 'PLAYER_GREETING', 'NORMAL', '0', 'OUT_OF_MONEY', 'BOSS', 'ELITE'].includes(t)).map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <div style={{ 
                                            fontSize: '0.75em', 
                                            color: '#888', 
                                            marginTop: '3px'
                                        }}>
                                            {filterType !== 'all' && filterType === 'NPC' && 'Showing: Non-combat NPCs'}
                                            {filterType !== 'all' && filterType !== 'NPC' && `Filtering by: ${filterType}`}
                                        </div>
                                    </div>

                                    {/* Level Range Filter */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ 
                                            color: '#00ff00', 
                                            fontSize: '0.9em',
                                            fontWeight: 'bold',
                                            marginBottom: '8px',
                                            display: 'block'
                                        }}>
                                            📊 Level Range: 
                                            <input 
                                                type="number"
                                                value={minLevel}
                                                onChange={(e) => {
                                                    const value = Math.max(0, Math.min(200, parseInt(e.target.value) || 0));
                                                    setMinLevel(value);
                                                }}
                                                onDoubleClick={(e) => e.target.select()}
                                                onFocus={(e) => e.target.select()}
                                                style={{
                                                    width: '50px',
                                                    marginLeft: '8px',
                                                    padding: '3px 6px',
                                                    background: '#2a2a2a',
                                                    border: '2px solid #ffff00',
                                                    borderRadius: '3px',
                                                    color: '#ffff00',
                                                    fontSize: '0.95em',
                                                    fontFamily: 'VT323, monospace',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <span style={{ color: '#ffff00', margin: '0 6px' }}>-</span>
                                            <input 
                                                type="number"
                                                value={maxLevel}
                                                onChange={(e) => {
                                                    const value = Math.max(0, Math.min(200, parseInt(e.target.value) || 0));
                                                    setMaxLevel(value);
                                                }}
                                                onDoubleClick={(e) => e.target.select()}
                                                onFocus={(e) => e.target.select()}
                                                style={{
                                                    width: '50px',
                                                    padding: '3px 6px',
                                                    background: '#2a2a2a',
                                                    border: '2px solid #ffff00',
                                                    borderRadius: '3px',
                                                    color: '#ffff00',
                                                    fontSize: '0.95em',
                                                    fontFamily: 'VT323, monospace',
                                                    textAlign: 'center'
                                                }}
                                            />
                                        </label>
                                        
                                        {/* Dual Thumb Range Slider */}
                                        <div style={{ position: 'relative', height: '35px', marginBottom: '8px' }}>
                                            {/* Track Background */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '13px',
                                                left: '0',
                                                right: '0',
                                                height: '6px',
                                                background: '#1a1a1a',
                                                border: '1px solid #333',
                                                borderRadius: '3px'
                                            }} />
                                            
                                            {/* Selected Range Highlight */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '13px',
                                                left: `${(minLevel / 200) * 100}%`,
                                                width: `${((maxLevel - minLevel) / 200) * 100}%`,
                                                height: '6px',
                                                background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff6600)',
                                                border: '1px solid #00ff00',
                                                borderRadius: '3px',
                                                boxShadow: '0 0 8px rgba(0, 255, 0, 0.5)'
                                            }} />
                                            
                                            {/* Max Level Slider */}
                                            <input
                                                type="range"
                                                className="mob-level-range mob-level-range-max"
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
                                                    height: '35px',
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
                                                className="mob-level-range mob-level-range-min"
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
                                                    height: '35px',
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
                                            fontSize: '0.7em',
                                            color: '#666'
                                        }}>
                                            <span>0</span>
                                            <span>50</span>
                                            <span>100</span>
                                            <span>150</span>
                                            <span>200</span>
                                        </div>
                                    </div>

                                    {/* Boss Only Toggle */}
                                    <div>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9em'
                                        }}>
                                            <input 
                                                type="checkbox"
                                                checked={showBossOnly}
                                                onChange={(e) => setShowBossOnly(e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                                                👑 Show Bosses Only
                                            </span>
                                        </label>
                                    </div>

                                    {/* Clear Filters Button */}
                                    {(filterType !== 'all' || showBossOnly || minLevel !== 0 || maxLevel !== 200 || mobSearchTerm) && (
                                        <button
                                            onClick={() => {
                                                setFilterType('all');
                                                setShowBossOnly(false);
                                                setMinLevel(0);
                                                setMaxLevel(200);
                                                setMobSearchTerm('');
                                            }}
                                            style={{
                                                marginTop: '10px',
                                                width: '100%',
                                                padding: '6px',
                                                background: '#ff6600',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '3px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: '0.9em'
                                            }}
                                        >
                                            🔄 Clear Filters
                                        </button>
                                    )}
                                </div>
                                )}

                                {sortedZoneMobs.length === 0 ? (
                                    <p className="no-mobs">
                                        {zoneMobs.length === 0 
                                            ? 'No mob data available for this zone.' 
                                            : 'No mobs match the current filters.'}
                                    </p>
                                ) : (
                                    <div className="mob-grid">
                                        {sortedZoneMobs.map(mob => {
                                            const mobZones = getMobZones(mob);
                                            return (
                                                <div key={mob.Id} className="mob-card" style={{
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'stretch'
                                                }}>
                                                    {/* LEVEL on far left */}
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                                        color: '#000',
                                                        padding: '10px',
                                                        borderRadius: '5px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: '50px',
                                                        fontWeight: 'bold',
                                                        flexShrink: 0
                                                    }}>
                                                        <div style={{ fontSize: '0.7em', opacity: '0.8' }}>LVL</div>
                                                        <div style={{ fontSize: '1.5em', lineHeight: '1' }}>{mob.Level}</div>
                                                    </div>

                                                    {/* Mob details in center */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="mob-card-header" style={{ marginBottom: '5px' }}>
                                                            <span 
                                                                className="mob-name"
                                                                style={{ 
                                                                    color: getMobTierColor(mob.Tier),
                                                                    display: 'block',
                                                                    marginBottom: '3px',
                                                                    fontSize: '1.1em',
                                                                    fontWeight: 'bold',
                                                                    wordWrap: 'break-word',
                                                                    overflowWrap: 'break-word',
                                                                    hyphens: 'auto'
                                                                }}
                                                            >
                                                                {mob.Name}
                                                                {mob.IsBoss && (
                                                                    <span className="mob-boss-badge" style={{ marginLeft: '8px' }}>👑 BOSS</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Simple text info */}
                                                        <div style={{ fontSize: '0.85em', color: '#aaa', lineHeight: '1.4' }}>
                                                            <div style={{ 
                                                                color: getMobTypeColor(mob), 
                                                                fontWeight: 'bold',
                                                                marginBottom: '2px'
                                                            }}>
                                                                {getMobTypeDisplay(mob)}
                                                            </div>
                                                            {mob.Difficulty > 0 && (
                                                                <div>Difficulty: {getMobDifficultyText(mob.Difficulty)}</div>
                                                            )}
                                                            {mob.Faction && (
                                                                <div>Faction: {mob.Faction}</div>
                                                            )}
                                                            {/* Floor/Level information */}
                                                            {(() => {
                                                                const levels = getMobLevels(mob.Name);
                                                                if (levels.length > 0) {
                                                                    return (
                                                                        <div style={{ 
                                                                            color: '#00FFFF',
                                                                            fontWeight: 'bold',
                                                                            marginTop: '3px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px'
                                                                        }}>
                                                                            <span style={{ fontSize: '1em' }}>📍</span>
                                                                            <span>
                                                                                Floor{levels.length > 1 ? 's' : ''}: {
                                                                                    levels.length === 1 
                                                                                        ? levels[0]
                                                                                        : levels.join(', ')
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons on far right */}
                                                    {onHighlightMob && (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column',
                                                            gap: '4px',
                                                            alignItems: 'stretch',
                                                            flexShrink: 0
                                                        }}>
                                                            {/* Show Mob Button */}
                                                            <button
                                                                className="show-locations-btn"
                                                                onClick={() => {
                                                                    if (highlightedMob === mob.Name) {
                                                                        onClearHighlight();
                                                                    } else {
                                                                        onHighlightMob(mob.Name);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    background: highlightedMob === mob.Name ? '#00FF00' : '#FF6600',
                                                                    color: '#000',
                                                                    border: `2px solid ${highlightedMob === mob.Name ? '#00FF00' : '#FF8800'}`,
                                                                    borderRadius: '3px',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8em',
                                                                    fontFamily: 'VT323, monospace',
                                                                    transition: 'all 0.2s',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (highlightedMob !== mob.Name) {
                                                                        e.target.style.background = '#FF8800';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = highlightedMob === mob.Name ? '#00FF00' : '#FF6600';
                                                                }}
                                                                title={highlightedMob === mob.Name ? 'Click to hide rooms' : 'Click to show rooms with this mob'}
                                                            >
                                                                {highlightedMob === mob.Name ? '✓ Shown' : '📍 Show'}
                                                            </button>
                                                            
                                                            {/* Show Path Button */}
                                                            {onShowMobPath && (() => {
                                                                const levels = getMobLevels(mob.Name);
                                                                const isOnCurrentFloor = currentFloor !== undefined && levels.includes(currentFloor);
                                                                const needsNavigation = currentFloor !== undefined && levels.length > 0 && !isOnCurrentFloor;
                                                                
                                                                if (needsNavigation) {
                                                                    const targetFloor = levels.sort((a, b) => {
                                                                        const distA = Math.abs(a - currentFloor);
                                                                        const distB = Math.abs(b - currentFloor);
                                                                        return distA - distB;
                                                                    })[0];
                                                                    
                                                                    const direction = targetFloor > currentFloor ? '⬆️' : '⬇️';
                                                                    const distance = Math.abs(targetFloor - currentFloor);
                                                                    
                                                                    return (
                                                                        <button
                                                                            onClick={() => {
                                                                                onShowMobPath(mob.Name, levels);
                                                                            }}
                                                                            style={{
                                                                                padding: '6px 10px',
                                                                                background: '#9932cc',
                                                                                color: '#fff',
                                                                                border: '2px solid #ba55d3',
                                                                                borderRadius: '3px',
                                                                                fontWeight: 'bold',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.8em',
                                                                                fontFamily: 'VT323, monospace',
                                                                                transition: 'all 0.2s',
                                                                                whiteSpace: 'nowrap'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.target.style.background = '#ba55d3';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.target.style.background = '#9932cc';
                                                                            }}
                                                                            title={`Go ${direction} ${distance} floor${distance > 1 ? 's' : ''} to reach floor ${targetFloor}`}
                                                                        >
                                                                            {direction} Path
                                                                        </button>
                                                                    );
                                                                } else if (isOnCurrentFloor) {
                                                                    return (
                                                                        <div style={{
                                                                            padding: '6px 10px',
                                                                            background: '#00ff00',
                                                                            color: '#000',
                                                                            border: '2px solid #00cc00',
                                                                            borderRadius: '3px',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.8em',
                                                                            fontFamily: 'VT323, monospace',
                                                                            textAlign: 'center',
                                                                            whiteSpace: 'nowrap'
                                                                        }}>
                                                                            ✓ Here
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                )}
            </div>
        </div>
    );
}

export default WikiSidebar;

