import React, { useState, useEffect, useRef } from 'react';
import worldMapData from '../complete_world_map_data.json';

function WorldMapGrid({ onZoneSelect, onOpenDetailedMap, selectedZone, highlightedZones, highlightedMobName, onClearHighlight }) {
    const [currentZone, setCurrentZone] = useState('myronmet');
    const [visitedZones, setVisitedZones] = useState(new Set(['myronmet']));
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true); // Left sidebar visibility
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true); // Right sidebar visibility
    const [nodeSize, setNodeSize] = useState(20); // Zone dot/node size
    const [cityNameSize, setCityNameSize] = useState(14); // City name font size
    const [connectionLineWidth, setConnectionLineWidth] = useState(10); // Connection line width
    const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false); // Region dropdown visibility
    const [searchTerm, setSearchTerm] = useState(''); // Search term for zones
    const [searchResults, setSearchResults] = useState([]); // Filtered search results
    const [showSearchResults, setShowSearchResults] = useState(false); // Show/hide search results dropdown
    const [isSearchFocused, setIsSearchFocused] = useState(false); // Track if search input is focused
    const [followPlayer, setFollowPlayer] = useState(true); // Camera follows player movement
    const svgRef = useRef(null);

    // Close region dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isRegionDropdownOpen && !e.target.closest('.region-filter')) {
                setIsRegionDropdownOpen(false);
            }
            if (showSearchResults && !e.target.closest('.zone-search')) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isRegionDropdownOpen, showSearchResults]);

    // Fuzzy search scoring function
    const fuzzyScore = (searchTerm, targetString) => {
        const search = searchTerm.toLowerCase();
        const target = targetString.toLowerCase();
        
        // Exact match - highest score
        if (target === search) return 1000;
        
        // Starts with search term - very high score
        if (target.startsWith(search)) return 900;
        
        // Contains exact search term - high score
        if (target.includes(search)) return 800;
        
        // Fuzzy matching with character proximity
        let score = 0;
        let searchIndex = 0;
        let consecutiveMatches = 0;
        let lastMatchIndex = -2;
        
        for (let i = 0; i < target.length && searchIndex < search.length; i++) {
            if (target[i] === search[searchIndex]) {
                // Bonus for consecutive characters
                if (i === lastMatchIndex + 1) {
                    consecutiveMatches++;
                    score += 10 + (consecutiveMatches * 5); // Bonus for streaks
                } else {
                    consecutiveMatches = 0;
                    score += 10;
                }
                
                // Bonus for matching at word boundaries
                if (i === 0 || target[i - 1] === ' ') {
                    score += 15;
                }
                
                lastMatchIndex = i;
                searchIndex++;
            }
        }
        
        // If we matched all search characters, add completion bonus
        if (searchIndex === search.length) {
            score += 100;
            
            // Bonus for shorter target strings (more relevant)
            const lengthRatio = search.length / target.length;
            score += lengthRatio * 50;
        } else {
            // Didn't match all characters, very low score
            score = score / 10;
        }
        
        return score;
    };

    // Handle zone search with fuzzy matching
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const term = searchTerm.toLowerCase();
        const scoredMatches = Object.entries(worldMapData.locations)
            .map(([zoneName, zoneData]) => {
                const displayScore = fuzzyScore(term, zoneData.displayName || '');
                const nameScore = fuzzyScore(term, zoneName);
                const maxScore = Math.max(displayScore, nameScore);
                
                return {
                    name: zoneName,
                    displayName: zoneData.displayName,
                    region: zoneData.region,
                    type: zoneData.type,
                    score: maxScore
                };
            })
            .filter(result => result.score > 50) // Minimum threshold for matches
            .sort((a, b) => b.score - a.score) // Sort by best match
            .slice(0, 10); // Limit to top 10 results

        setSearchResults(scoredMatches);
        setShowSearchResults(scoredMatches.length > 0);
    }, [searchTerm]);

    // Center camera on a specific zone
    const centerOnZone = (zoneName) => {
        if (!followPlayer) return;
        
        const zone = worldMapData.locations[zoneName];
        if (!zone || !svgRef.current) return;

        const cellSize = 180;
        const zoneX = zone.gridX * cellSize;
        const zoneY = zone.gridY * cellSize;

        // Get the SVG container dimensions
        const container = svgRef.current.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate the center offset
        // We want the zone to be in the center of the viewport
        const targetX = -(zoneX * zoomLevel - containerWidth / 2);
        const targetY = -(zoneY * zoomLevel - containerHeight / 2);

        setPanOffset({ x: targetX, y: targetY });
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Don't intercept keyboard input if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.isContentEditable
            )) {
                return;
            }

            // Don't process keyboard navigation if search input is focused
            if (isSearchFocused) return;
            
            const zone = worldMapData.locations[currentZone];
            if (!zone) return;

            let newZone = null;
            switch(e.key) {
                case 'Enter':
                    // Navigate into the current zone's detailed view
                    if (onOpenDetailedMap) {
                        onOpenDetailedMap({
                            name: currentZone,
                            displayName: zone.displayName,
                            type: zone.type,
                            description: zone.description,
                            exits: zone.exits,
                            region: zone.region
                        });
                    }
                    e.preventDefault();
                    return;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (zone.exits) newZone = zone.exits.north; // North is up on the map
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (zone.exits) newZone = zone.exits.south; // South is down on the map
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (zone.exits) newZone = zone.exits.west;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (zone.exits) newZone = zone.exits.east;
                    e.preventDefault();
                    break;
                case 'q':
                case 'Q':
                case '1':
                    if (zone.exits) newZone = zone.exits.northwest;
                    e.preventDefault();
                    break;
                case 'e':
                case 'E':
                case '2':
                    if (zone.exits) newZone = zone.exits.northeast;
                    e.preventDefault();
                    break;
                case 'z':
                case 'Z':
                case '3':
                    if (zone.exits) newZone = zone.exits.southwest;
                    e.preventDefault();
                    break;
                case 'c':
                case 'C':
                case '4':
                    if (zone.exits) newZone = zone.exits.southeast;
                    e.preventDefault();
                    break;
                case 'PageUp':
                    if (zone.exits) newZone = zone.exits.up;
                    e.preventDefault();
                    break;
                case 'PageDown':
                    if (zone.exits) newZone = zone.exits.down;
                    e.preventDefault();
                    break;
                default:
                    break;
            }

            if (newZone && worldMapData.locations[newZone]) {
                setCurrentZone(newZone);
                setVisitedZones(prev => new Set([...prev, newZone]));
                
                // Center camera on new zone if follow player is enabled
                if (followPlayer) {
                    setTimeout(() => centerOnZone(newZone), 50);
                }
                
                if (onZoneSelect) {
                    const zoneData = worldMapData.locations[newZone];
                    onZoneSelect({
                        name: newZone,
                        displayName: zoneData.displayName,
                        type: zoneData.type,
                        description: zoneData.description,
                        exits: zoneData.exits
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentZone, onZoneSelect, isSearchFocused, followPlayer, zoomLevel]);

    // Mouse drag handlers
    const handleMouseDown = (e) => {
        if (e.button === 0) { // Left mouse button
            // Disable camera lock when user starts dragging
            if (followPlayer) {
                setFollowPlayer(false);
            }
            setIsDragging(true);
            setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPanOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel(prev => Math.max(0.5, Math.min(3, prev * delta)));
    };

    // Filter zones by region
    const getFilteredZones = () => {
        const allEntries = Object.entries(worldMapData.locations);
        if (selectedRegion === 'all') {
            return allEntries;
        }
        const filtered = allEntries.filter(([_, zone]) => zone.region === selectedRegion);
        // Always include the current zone even if it is outside the selected region
        if (currentZone && worldMapData.locations[currentZone]) {
            const alreadyIncluded = filtered.some(([name]) => name === currentZone);
            if (!alreadyIncluded) {
                filtered.push([currentZone, worldMapData.locations[currentZone]]);
            }
        }
        return filtered;
    };

    // Render the map grid
    const renderMap = () => {
        const cellSize = 180; // Larger cells for better visibility
        const filteredZones = getFilteredZones();

        // Calculate bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        filteredZones.forEach(([_, zone]) => {
            if (zone.gridX < minX) minX = zone.gridX;
            if (zone.gridX > maxX) maxX = zone.gridX;
            if (zone.gridY < minY) minY = zone.gridY;
            if (zone.gridY > maxY) maxY = zone.gridY;
        });

        const gridWidth = (maxX - minX + 1) * cellSize;
        const gridHeight = (maxY - minY + 1) * cellSize;
        const padding = 100;

        return (
            <svg
                ref={svgRef}
                viewBox={`${minX * cellSize - padding} ${minY * cellSize - padding} ${gridWidth + padding * 2} ${gridHeight + padding * 2}`}
                style={{
                    width: '100%',
                    height: '100%',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Grid background */}
                <defs>
                    <pattern id="grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
                        <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="#222" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect 
                    x={minX * cellSize - padding} 
                    y={minY * cellSize - padding} 
                    width={gridWidth + padding * 2} 
                    height={gridHeight + padding * 2} 
                    fill="url(#grid)" 
                />

                {/* Draw connection lines */}
                {filteredZones.map(([zoneName, zone]) => {
                    if (!zone.exits) return null;
                    return Object.entries(zone.exits).map(([direction, targetName]) => {
                        const targetZone = worldMapData.locations[targetName];
                        if (!targetZone) return null;

                        const x1 = zone.gridX * cellSize;
                        const y1 = zone.gridY * cellSize; // Natural Y-axis (higher Y = lower on screen)
                        const x2 = targetZone.gridX * cellSize;
                        const y2 = targetZone.gridY * cellSize; // Natural Y-axis (higher Y = lower on screen)

                        const isVisited = visitedZones.has(zoneName) && visitedZones.has(targetName);

                        return (
                            <line
                                key={`${zoneName}-${targetName}-${direction}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isVisited ? '#00ff00' : '#555'}
                                strokeWidth={connectionLineWidth}
                                strokeDasharray={isVisited ? '' : '8,8'}
                                opacity="0.4"
                            />
                        );
                    });
                })}

                {/* Draw zone nodes */}
                {filteredZones.map(([zoneName, zone]) => {
                    const isCurrent = zoneName === currentZone;
                    const isVisited = visitedZones.has(zoneName);
                    const isSelected = selectedZone?.name === zoneName;
                    
                    // Check if highlighted
                    const isHighlighted = highlightedZones && highlightedZones.length > 0 && 
                        highlightedZones.some(hz => 
                            hz.toLowerCase() === zoneName.toLowerCase() ||
                            hz.toLowerCase() === zone.displayName.toLowerCase() ||
                            hz.toLowerCase().includes(zoneName.toLowerCase()) ||
                            zoneName.toLowerCase().includes(hz.toLowerCase())
                        );

                    // Get region color
                    const regionColor = worldMapData.regions[zone.region]?.color || '#888';

                    let nodeColor = regionColor;
                    if (isCurrent) nodeColor = '#ffff00';
                    else if (isHighlighted) nodeColor = '#ff00ff';
                    else if (isSelected) nodeColor = '#ff6600';
                    else if (isVisited) nodeColor = '#00ff00';

                    const x = zone.gridX * cellSize;
                    const y = zone.gridY * cellSize; // Natural Y-axis (higher Y = lower on screen)

                    return (
                        <g
                            key={zoneName}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentZone(zoneName);
                                setVisitedZones(prev => new Set([...prev, zoneName]));
                                if (followPlayer) {
                                    setTimeout(() => centerOnZone(zoneName), 50);
                                }
                                if (onZoneSelect) {
                                    onZoneSelect({
                                        name: zoneName,
                                        displayName: zone.displayName,
                                        type: zone.type,
                                        description: zone.description,
                                        exits: zone.exits,
                                        region: zone.region
                                    });
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Glow effect for current zone */}
                            {isCurrent && (
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={nodeSize * 1.2}
                                    fill={nodeColor}
                                    opacity="0.3"
                                >
                                    <animate
                                        attributeName="r"
                                        values={`${nodeSize * 1.2};${nodeSize * 1.7};${nodeSize * 1.2}`}
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}

                            {/* Highlight glow for mob locations */}
                            {isHighlighted && (
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={nodeSize * 1.5}
                                    fill="#ff00ff"
                                    opacity="0.4"
                                >
                                    <animate
                                        attributeName="r"
                                        values={`${nodeSize * 1.5};${nodeSize * 2};${nodeSize * 1.5}`}
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.4;0.7;0.4"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}

                            {/* Zone node circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r={nodeSize}
                                fill={nodeColor}
                                stroke="#fff"
                                strokeWidth="3"
                            />

                            {/* Zone name background */}
                            <rect
                                x={x - (zone.displayName.length * (cityNameSize * 0.35))}
                                y={y - (cityNameSize * 3.5)}
                                width={zone.displayName.length * (cityNameSize * 0.7) + 10}
                                height={cityNameSize * 1.8}
                                fill="rgba(0, 0, 0, 0.9)"
                                rx="5"
                                stroke={isCurrent ? '#ffff00' : 'rgba(255,255,255,0.3)'}
                                strokeWidth={isCurrent ? '2' : '1'}
                            />

                            {/* Zone name text */}
                            <text
                                x={x}
                                y={y - (cityNameSize * 2)}
                                textAnchor="middle"
                                fill={nodeColor}
                                fontSize={cityNameSize}
                                fontWeight="bold"
                                fontFamily="VT323, monospace"
                                stroke="#000"
                                strokeWidth="5"
                                paintOrder="stroke"
                            >
                                {zone.displayName}
                            </text>

                            {/* Type label background */}
                            <rect
                                x={x - (zone.type.length * 3.5)}
                                y={y + 25}
                                width={zone.type.length * 7 + 8}
                                height="18"
                                fill="rgba(0, 0, 0, 0.8)"
                                rx="3"
                            />

                            {/* Type label */}
                            <text
                                x={x}
                                y={y + 37}
                                textAnchor="middle"
                                fill="#aaa"
                                fontSize="12"
                                fontFamily="VT323, monospace"
                            >
                                {zone.type}
                            </text>
                        </g>
                    );
                })}

                {/* Region labels */}
                {selectedRegion === 'all' && Object.entries(worldMapData.regions).map(([regionKey, region]) => {
                    // Find center of region zones
                    const regionZones = Object.entries(worldMapData.locations).filter(
                        ([_, zone]) => zone.region === regionKey
                    );
                    if (regionZones.length === 0) return null;

                    const avgX = regionZones.reduce((sum, [_, zone]) => sum + zone.gridX, 0) / regionZones.length;
                    const avgY = regionZones.reduce((sum, [_, zone]) => sum + zone.gridY, 0) / regionZones.length;

                    return (
                        <g key={regionKey}>
                            <rect
                                x={avgX * cellSize - 100}
                                y={avgY * cellSize - 120}
                                width="200"
                                height="30"
                                fill="rgba(0, 0, 0, 0.7)"
                                stroke={region.color}
                                strokeWidth="2"
                                rx="5"
                            />
                            <text
                                x={avgX * cellSize}
                                y={avgY * cellSize - 97}
                                textAnchor="middle"
                                fill={region.color}
                                fontSize="18"
                                fontWeight="bold"
                                fontFamily="VT323, monospace"
                            >
                                {region.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    };

    const currentZoneData = worldMapData.locations[currentZone];
    const regionData = currentZoneData ? worldMapData.regions[currentZoneData.region] : null;

    return (
        <div className="world-map-grid-container" style={{ display: 'flex', height: '100%', position: 'relative' }}>
            {/* Left Sidebar */}
            <div className="world-map-sidebar" style={{
                position: 'fixed',
                left: '0',
                top: '80px',
                bottom: 0,
                width: isLeftSidebarOpen ? '320px' : '50px',
                background: '#1a1a1a',
                borderRight: '3px solid #00ff00',
                padding: isLeftSidebarOpen ? '20px' : '10px',
                overflowY: isLeftSidebarOpen ? 'auto' : 'hidden',
                overflowX: 'hidden',
                flexShrink: 0,
                zIndex: 100,
                transition: 'width 0.3s ease, padding 0.3s ease'
            }}>
                {/* Toggle Button */}
                {isLeftSidebarOpen ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '15px'
                    }}>
                    <button
                        onClick={() => setIsLeftSidebarOpen(false)}
                        style={{
                            background: '#ff6600',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                                padding: '8px 15px',
                            cursor: 'pointer',
                            fontFamily: 'VT323, monospace',
                                fontSize: '1.1em',
                                fontWeight: 'bold'
                        }}
                        title="Collapse sidebar"
                    >
                            ◀ Collapse
                    </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '10px'
                    }}>
                    <button
                        onClick={() => setIsLeftSidebarOpen(true)}
                        style={{
                            background: '#00ff00',
                            color: '#000',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '15px 10px',
                            cursor: 'pointer',
                            fontFamily: 'VT323, monospace',
                            fontSize: '1.5em',
                            fontWeight: 'bold',
                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                        }}
                        title="Expand sidebar"
                    >
                        ▶
                    </button>
                    </div>
                )}

                {/* Content - only show when expanded */}
                {isLeftSidebarOpen && (
                    <>
                        {/* Mob Location Highlight Banner */}
                        {highlightedZones && highlightedZones.length > 0 && highlightedMobName && (
                    <div style={{
                        background: 'linear-gradient(135deg, #ff00ff, #8800ff)',
                        padding: '15px',
                        marginBottom: '20px',
                        borderRadius: '5px',
                        border: '2px solid #ff00ff',
                        boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)'
                    }}>
                        <div style={{ 
                            color: '#fff', 
                            fontWeight: 'bold', 
                            fontSize: '1.1em',
                            marginBottom: '10px',
                            textAlign: 'center'
                        }}>
                            📍 Tracking: {highlightedMobName}
                        </div>
                        <div style={{ 
                            color: '#fff', 
                            fontSize: '0.9em',
                            marginBottom: '10px',
                            textAlign: 'center'
                        }}>
                            Found in {highlightedZones.length} zone{highlightedZones.length > 1 ? 's' : ''}
                        </div>
                        {onClearHighlight && (
                            <button
                                onClick={onClearHighlight}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#000',
                                    color: '#ff00ff',
                                    border: '2px solid #ff00ff',
                                    borderRadius: '3px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontFamily: 'VT323, monospace',
                                    fontSize: '1em'
                                }}
                            >
                                ✕ Clear Highlight
                            </button>
                        )}
                    </div>
                )}

                {/* Zone Search */}
                <div className="zone-search" style={{ marginBottom: '20px', position: 'relative' }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>🔍 Search Zones:</h4>
                    <input
                        type="text"
                        placeholder="Type zone name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => {
                            setIsSearchFocused(true);
                            if (searchResults.length > 0) {
                                setShowSearchResults(true);
                            }
                        }}
                        onBlur={() => {
                            setIsSearchFocused(false);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '3px',
                            color: '#00ff00',
                            fontSize: '1em',
                            fontFamily: 'VT323, monospace',
                            outline: 'none',
                            boxShadow: searchTerm ? '0 0 10px rgba(0, 255, 0, 0.3)' : 'none',
                            transition: 'box-shadow 0.2s'
                        }}
                    />
                    
                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '5px',
                            background: '#1a1a1a',
                            border: '2px solid #00ff00',
                            borderRadius: '3px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 20px rgba(0, 255, 0, 0.3)'
                        }}>
                            {searchResults.map((result) => {
                                const regionColor = worldMapData.regions[result.region]?.color || '#888';
                                return (
                                    <div
                                        key={result.name}
                                        onClick={() => {
                                            setCurrentZone(result.name);
                                            setVisitedZones(prev => new Set([...prev, result.name]));
                                            setSearchTerm('');
                                            setShowSearchResults(false);
                                            
                                            // Center camera on selected zone if follow player is enabled
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(result.name), 50);
                                            }
                                            
                                            if (onZoneSelect) {
                                                onZoneSelect({
                                                    name: result.name,
                                                    displayName: result.displayName,
                                                    type: result.type,
                                                    description: worldMapData.locations[result.name].description,
                                                    exits: worldMapData.locations[result.name].exits,
                                                    region: result.region
                                                });
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #2a2a2a',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#2a2a2a';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '5px'
                                        }}>
                                            <div style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: regionColor,
                                                border: '2px solid #fff',
                                                flexShrink: 0
                                            }} />
                                            <div style={{
                                                color: '#00ff00',
                                                fontSize: '1.1em',
                                                fontWeight: 'bold',
                                                flex: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {result.displayName}
                                            </div>
                                        </div>
                                        <div style={{
                                            color: '#888',
                                            fontSize: '0.9em',
                                            paddingLeft: '22px'
                                        }}>
                                            {worldMapData.regions[result.region]?.name || result.region} • {result.type}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* No Results Message */}
                    {searchTerm && searchResults.length === 0 && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '2px solid #ff6600',
                            borderRadius: '3px',
                            color: '#ff6600',
                            fontSize: '0.9em',
                            textAlign: 'center'
                        }}>
                            No zones found matching "{searchTerm}"
                        </div>
                    )}
                </div>

                {/* Follow Player Toggle */}
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>📍 Camera Controls:</h4>
                    <div
                        onClick={() => setFollowPlayer(!followPlayer)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: followPlayer ? '#00ff00' : '#2a2a2a',
                            border: followPlayer ? '2px solid #00ff00' : '2px solid #666',
                            color: followPlayer ? '#000' : '#666',
                            fontSize: '1.1em',
                            fontFamily: 'VT323, monospace',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.3s ease',
                            boxShadow: followPlayer ? '0 0 15px rgba(0, 255, 0, 0.5)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!followPlayer) {
                                e.currentTarget.style.background = '#3a3a3a';
                                e.currentTarget.style.color = '#888';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!followPlayer) {
                                e.currentTarget.style.background = '#2a2a2a';
                                e.currentTarget.style.color = '#666';
                            }
                        }}
                    >
                        <span style={{ fontSize: '1.3em' }}>
                            {followPlayer ? '🔒' : '🔓'}
                        </span>
                        <span>
                            {followPlayer ? 'Camera Locked' : 'Camera Unlocked'}
                        </span>
                    </div>
                    <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '3px',
                        color: '#888',
                        fontSize: '0.9em',
                        textAlign: 'center',
                        fontFamily: 'VT323, monospace'
                    }}>
                        {followPlayer 
                            ? '📍 Camera follows movement. Dragging unlocks.' 
                            : '🗺️ Free camera - drag to explore'}
                    </div>
                </div>

                {/* Region Filter */}
                <div className="region-filter" style={{ marginBottom: '20px', position: 'relative' }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>Filter by Region:</h4>
                    
                    {/* Custom Dropdown Button */}
                    <div
                        onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            color: '#00ff00',
                            fontSize: '1em',
                            fontFamily: 'VT323, monospace',
                            cursor: 'pointer',
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {selectedRegion !== 'all' && (
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: worldMapData.regions[selectedRegion]?.color || '#888',
                                    border: '2px solid #fff'
                                }} />
                            )}
                            <span>
                                {selectedRegion === 'all' ? 'All Regions' : worldMapData.regions[selectedRegion]?.name}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.8em' }}>{isRegionDropdownOpen ? '▲' : '▼'}</span>
                </div>

                    {/* Dropdown Menu */}
                    {isRegionDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#1a1a1a',
                            border: '2px solid #00ff00',
                            borderTop: 'none',
                            borderRadius: '0 0 3px 3px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            marginTop: '-2px'
                        }}>
                            {/* All Regions Option */}
                            <div
                                    onClick={() => {
                                    setSelectedRegion('all');
                                    setIsRegionDropdownOpen(false);
                                    }}
                                    style={{
                                    padding: '10px',
                                        cursor: 'pointer',
                                    background: selectedRegion === 'all' ? '#00ff00' : 'transparent',
                                    color: selectedRegion === 'all' ? '#000' : '#00ff00',
                                        fontFamily: 'VT323, monospace',
                                    fontSize: '1em',
                                    borderBottom: '1px solid #333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedRegion !== 'all') {
                                        e.target.style.background = '#2a2a2a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedRegion !== 'all') {
                                        e.target.style.background = 'transparent';
                                    }
                                }}
                            >
                                <span>All Regions</span>
                    </div>

                            {/* Individual Region Options */}
                            {Object.entries(worldMapData.regions).map(([key, region]) => (
                                <div
                                    key={key}
                                    onClick={() => {
                                        setSelectedRegion(key);
                                        setIsRegionDropdownOpen(false);
                                    }}
                                    style={{
                            padding: '10px',
                                        cursor: 'pointer',
                                        background: selectedRegion === key ? '#00ff00' : 'transparent',
                                        color: selectedRegion === key ? '#000' : '#00ff00',
                                        fontFamily: 'VT323, monospace',
                                        fontSize: '1em',
                                        borderBottom: '1px solid #333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedRegion !== key) {
                                            e.target.style.background = '#2a2a2a';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedRegion !== key) {
                                            e.target.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: region.color,
                                        border: '2px solid #fff',
                                        flexShrink: 0
                                    }} />
                                    <span>{region.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Display Tools */}
                <div className="display-tools" style={{
                    background: '#0a0a0a',
                    border: '2px solid #00ff00',
                    borderRadius: '5px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '1.1em', textAlign: 'center', borderBottom: '1px solid #00ff00', paddingBottom: '8px' }}>Display Tools</h4>
                    
                    {/* Zone Dot Size */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ color: '#888', fontSize: '0.9em', display: 'block', marginBottom: '8px' }}>
                            Zone Dot Size: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{nodeSize}px</span>
                        </label>
                        <input 
                            type="range" 
                            min="10" 
                            max="40" 
                            value={nodeSize} 
                            onChange={(e) => setNodeSize(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    {/* City Name Size */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ color: '#888', fontSize: '0.9em', display: 'block', marginBottom: '8px' }}>
                            City Name Size: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{cityNameSize}px</span>
                        </label>
                        <input 
                            type="range" 
                            min="8" 
                            max="32" 
                            value={cityNameSize} 
                            onChange={(e) => setCityNameSize(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    {/* Connection Line Width */}
                    <div style={{ marginBottom: '0' }}>
                        <label style={{ color: '#888', fontSize: '0.9em', display: 'block', marginBottom: '8px' }}>
                            Connection Line Width: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{connectionLineWidth}px</span>
                        </label>
                        <input 
                            type="range" 
                            min="1" 
                            max="20" 
                            value={connectionLineWidth} 
                            onChange={(e) => setConnectionLineWidth(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                </div>

                {/* Controls Help */}
                <div className="controls-help" style={{
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '5px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>Controls:</h4>
                    <div style={{ fontSize: '0.85em', lineHeight: '1.8', color: '#ccc' }}>
                        <div>⬆⬇⬅➡ WASD - Navigate</div>
                        <div>↖ Q/1 - Northwest</div>
                        <div>↗ E/2 - Northeast</div>
                        <div>↙ Z/3 - Southwest</div>
                        <div>↘ C/4 - Southeast</div>
                        <div>🖱️ Mouse Wheel - Zoom</div>
                        <div>🖱️ Click + Drag - Pan</div>
                        <div>🖱️ Click Zone - Jump</div>
                        <div>⌨️ Enter - Enter Zone View</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="world-stats" style={{
                    background: '#2a2a2a',
                    border: '2px solid #00ff00',
                    borderRadius: '5px',
                    padding: '15px',
                    fontSize: '0.9em'
                }}>
                    <div style={{ marginBottom: '5px', color: '#00ff00' }}>
                        <strong>Total Zones:</strong> {Object.keys(worldMapData.locations).length}
                    </div>
                    <div style={{ marginBottom: '5px', color: '#00ff00' }}>
                        <strong>Visited:</strong> {visitedZones.size}
                    </div>
                    <div style={{ color: '#00ff00' }}>
                        <strong>Zoom:</strong> {(zoomLevel * 100).toFixed(0)}%
                    </div>
                </div>
                    </>
                )}
            </div>

            {/* Map Canvas */}
            <div className="world-map-canvas" style={{
                position: 'fixed',
                left: isLeftSidebarOpen ? '320px' : '50px',
                right: isRightSidebarOpen ? '500px' : '50px',
                top: '80px',
                bottom: 0,
                background: '#0a0a0a',
                overflow: 'hidden',
                transition: 'left 0.3s ease, right 0.3s ease'
            }}>
                {renderMap()}
            </div>

            {/* Right Sidebar - Zone Details */}
            <div style={{
                position: 'fixed',
                right: '0',
                top: '80px',
                bottom: 0,
                width: isRightSidebarOpen ? '500px' : '50px',
                zIndex: 100,
                transition: 'width 0.3s ease, padding 0.3s ease',
                background: '#1a1a1a',
                borderLeft: '3px solid #00ff00',
                padding: isRightSidebarOpen ? '20px' : '10px',
                overflowY: isRightSidebarOpen ? 'auto' : 'hidden',
                overflowX: 'hidden'
            }}>
                {/* Toggle Button */}
                {isRightSidebarOpen ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: '15px'
                    }}>
                        <button
                            onClick={() => setIsRightSidebarOpen(false)}
                            style={{
                                background: '#ff6600',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '8px 15px',
                                cursor: 'pointer',
                                fontFamily: 'VT323, monospace',
                                fontSize: '1.1em',
                                fontWeight: 'bold'
                            }}
                            title="Collapse sidebar"
                        >
                            Collapse ▶
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '10px'
                    }}>
                        <button
                            onClick={() => setIsRightSidebarOpen(true)}
                            style={{
                                background: '#00ff00',
                                color: '#000',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '15px 10px',
                                cursor: 'pointer',
                                fontFamily: 'VT323, monospace',
                                fontSize: '1.5em',
                                fontWeight: 'bold',
                                boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                            }}
                            title="Expand sidebar"
                        >
                            ◀
                        </button>
                    </div>
                )}

                {/* Zone Details Content - only show when expanded */}
                {isRightSidebarOpen && (
                <div>
                    <h3 style={{ 
                        color: '#00ff00', 
                        fontSize: '1.5em', 
                        marginBottom: '20px',
                        borderBottom: '2px solid #00ff00',
                        paddingBottom: '10px'
                    }}>
                        Zone Details
                    </h3>

                    <div style={{
                        background: '#2a2a2a',
                        border: '2px solid #ffff00',
                        borderRadius: '5px',
                        padding: '15px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ 
                            fontSize: '1.4em', 
                            fontWeight: 'bold', 
                            color: '#ffff00',
                            marginBottom: '10px'
                        }}>
                            {currentZoneData?.displayName || currentZone}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.9em', marginBottom: '5px' }}>
                            Type: <span style={{ color: '#00ff00' }}>{currentZoneData?.type}</span>
                        </div>
                        {regionData && (
                            <div style={{ color: '#888', fontSize: '0.9em', marginBottom: '5px' }}>
                                Region: <span style={{ color: regionData.color }}>{regionData.name}</span>
                            </div>
                        )}
                        {currentZoneData?.description && (
                            <div style={{ 
                                color: '#ccc', 
                                fontSize: '0.9em', 
                                marginTop: '10px',
                                lineHeight: '1.6',
                                fontStyle: 'italic'
                            }}>
                                {currentZoneData.description}
                            </div>
                        )}
                    </div>

                    {/* Available Exits - Directional Map */}
                    {currentZoneData?.exits && Object.keys(currentZoneData.exits).length > 0 && (
                        <div style={{
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '1.1em', textAlign: 'center' }}>Available Exits</h4>
                            
                            {/* Directional Grid */}
                                    <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gridTemplateRows: 'repeat(3, 60px)',
                                gap: '6px',
                                marginBottom: '12px'
                            }}>
                                {/* Northwest */}
                                {currentZoneData.exits.northwest ? (
                                    <button
                                        onClick={() => {
                                            const targetZone = worldMapData.locations[currentZoneData.exits.northwest];
                                            setCurrentZone(currentZoneData.exits.northwest);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.northwest]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.northwest), 50);
                                            }
                                        }}
                                        style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.northwest]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>↖</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.northwest]?.displayName}
                                        </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* North */}
                                {currentZoneData.exits.north ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.north);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.north]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.north), 50);
                                            }
                                        }}
                                        style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.north]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>⬆</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.north]?.displayName}
                                    </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* Northeast */}
                                {currentZoneData.exits.northeast ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.northeast);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.northeast]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.northeast), 50);
                                            }
                                        }}
                                        style={{
                                        background: '#1a1a1a', 
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.northeast]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>↗</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.northeast]?.displayName}
                                    </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* West */}
                                {currentZoneData.exits.west ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.west);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.west]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.west), 50);
                                            }
                                        }}
                                        style={{
                                        background: '#1a1a1a', 
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.west]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>⬅</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.west]?.displayName}
                                        </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* Center - Current Zone */}
                                <div style={{
                                    background: '#00ff00',
                                    border: '3px solid #ffff00',
                                    borderRadius: '5px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '5px',
                                    boxShadow: '0 0 15px rgba(0, 255, 0, 0.5)'
                                }}>
                                    <div style={{ fontSize: '2em', color: '#000' }}>📍</div>
                                    <div style={{ fontSize: '0.65em', fontWeight: 'bold', color: '#000', textAlign: 'center', fontFamily: 'VT323, monospace' }}>
                                        HERE
                                    </div>
                                </div>

                                {/* East */}
                                {currentZoneData.exits.east ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.east);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.east]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.east), 50);
                                            }
                                        }}
                                        style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.east]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>➡</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.east]?.displayName}
                                    </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* Southwest */}
                                {currentZoneData.exits.southwest ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.southwest);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.southwest]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.southwest), 50);
                                            }
                                        }}
                                        style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.southwest]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>↙</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.southwest]?.displayName}
                                        </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* South */}
                                {currentZoneData.exits.south ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.south);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.south]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.south), 50);
                                            }
                                        }}
                                        style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.south]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>⬇</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.south]?.displayName}
                                        </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}

                                {/* Southeast */}
                                {currentZoneData.exits.southeast ? (
                                    <button
                                        onClick={() => {
                                            setCurrentZone(currentZoneData.exits.southeast);
                                            setVisitedZones(prev => new Set([...prev, currentZoneData.exits.southeast]));
                                            if (followPlayer) {
                                                setTimeout(() => centerOnZone(currentZoneData.exits.southeast), 50);
                                            }
                                        }}
                                        style={{
                                            background: '#1a1a1a',
                                            border: '2px solid #00ff00',
                                            color: '#00ff00',
                                            cursor: 'pointer',
                                            borderRadius: '5px',
                                            fontSize: '0.75em',
                                            fontFamily: 'VT323, monospace',
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#1a1a1a';
                                            e.currentTarget.style.color = '#00ff00';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title={worldMapData.locations[currentZoneData.exits.southeast]?.displayName}
                                    >
                                        <div style={{ fontSize: '1.2em' }}>↘</div>
                                        <div style={{ fontSize: '1.05em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', fontWeight: 'bold' }}>
                                            {worldMapData.locations[currentZoneData.exits.southeast]?.displayName}
                                        </div>
                                    </button>
                                ) : <div style={{ background: '#0a0a0a', border: '2px solid #333', borderRadius: '5px' }}></div>}
                            </div>

                            {/* Up/Down Exits */}
                            {(currentZoneData.exits.up || currentZoneData.exits.down) && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    {currentZoneData.exits.up && (
                                        <button
                                            onClick={() => {
                                                setCurrentZone(currentZoneData.exits.up);
                                                setVisitedZones(prev => new Set([...prev, currentZoneData.exits.up]));
                                                if (followPlayer) {
                                                    setTimeout(() => centerOnZone(currentZoneData.exits.up), 50);
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                background: '#1a1a1a',
                                                border: '2px solid #00ff00',
                                                color: '#00ff00',
                                                cursor: 'pointer',
                                                borderRadius: '5px',
                                                fontSize: '0.9em',
                                                fontFamily: 'VT323, monospace',
                                                padding: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#00ff00';
                                                e.currentTarget.style.color = '#000';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#1a1a1a';
                                                e.currentTarget.style.color = '#00ff00';
                                            }}
                                            title={worldMapData.locations[currentZoneData.exits.up]?.displayName}
                                        >
                                            <span style={{ fontSize: '1.2em' }}>⏫</span>
                                            <span style={{ fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {worldMapData.locations[currentZoneData.exits.up]?.displayName}
                                            </span>
                                        </button>
                                    )}
                                    {currentZoneData.exits.down && (
                                        <button
                                            onClick={() => {
                                                setCurrentZone(currentZoneData.exits.down);
                                                setVisitedZones(prev => new Set([...prev, currentZoneData.exits.down]));
                                                if (followPlayer) {
                                                    setTimeout(() => centerOnZone(currentZoneData.exits.down), 50);
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                        background: '#1a1a1a', 
                                                border: '2px solid #00ff00',
                                                color: '#00ff00',
                                                cursor: 'pointer',
                                                borderRadius: '5px',
                                                fontSize: '0.9em',
                                                fontFamily: 'VT323, monospace',
                                                padding: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#00ff00';
                                                e.currentTarget.style.color = '#000';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#1a1a1a';
                                                e.currentTarget.style.color = '#00ff00';
                                            }}
                                            title={worldMapData.locations[currentZoneData.exits.down]?.displayName}
                                        >
                                            <span style={{ fontSize: '1.2em' }}>⏬</span>
                                            <span style={{ fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {worldMapData.locations[currentZoneData.exits.down]?.displayName}
                                        </span>
                                        </button>
                                    )}
                                    </div>
                                )}
                        </div>
                    )}

                    {/* Enter Zone Button */}
                    <button
                        onClick={() => {
                            if (onOpenDetailedMap) {
                                onOpenDetailedMap({
                                    name: currentZone,
                                    displayName: currentZoneData?.displayName,
                                    type: currentZoneData?.type,
                                    description: currentZoneData?.description,
                                    exits: currentZoneData?.exits,
                                    region: currentZoneData?.region
                                });
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '15px',
                            background: '#00ff00',
                            color: '#000',
                            border: 'none',
                            borderRadius: '5px',
                            fontFamily: 'VT323, monospace',
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                            marginBottom: '10px'
                        }}
                    >
                        🗺️ View Detailed Room Layout [Enter]
                    </button>
                </div>
                )}
            </div>
        </div>
    );
}

export default WorldMapGrid;

