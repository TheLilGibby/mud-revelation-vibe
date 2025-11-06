import React, { useState, useEffect, useRef } from 'react';
import worldMapData from '../complete_world_map_data.json';
import {
    roomToWorldCoords,
    zoneToWorldCoords,
    getDetailLevel,
    calculateRoomBounds,
    getZoneFloors,
    filterRoomsByFloor,
    getTerrainColor,
    isInViewport,
    getViewportBounds,
    getZoneBounds,
    CONSTANTS
} from '../utils/coordinateMapper';

function UnifiedWorldMap({ onZoneSelect, onOpenDetailedMap, selectedZone, highlightedZones, highlightedMobName, onClearHighlight }) {
    const [currentZone, setCurrentZone] = useState('myronmet');
    const [visitedZones, setVisitedZones] = useState(new Set(['myronmet']));
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [currentFloor, setCurrentFloor] = useState(0);
    const [worldData, setWorldData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cityNameFontSize, setCityNameFontSize] = useState(16); // Font size for city/zone names
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true); // Left sidebar visibility
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true); // Right sidebar visibility
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    // Load WorldData.json from public folder
    useEffect(() => {
        fetch('/GameData/WorldData.json')
            .then(response => response.json())
            .then(data => {
                setWorldData(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading WorldData:', error);
                setIsLoading(false);
            });
    }, []);

    // Get detail level based on zoom
    const detailLevel = getDetailLevel(zoomLevel);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
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
                    if (zone.exits) newZone = zone.exits.north;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (zone.exits) newZone = zone.exits.south;
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
                case '+':
                case '=':
                    setZoomLevel(prev => Math.min(CONSTANTS.MAX_ZOOM, prev * 1.3));
                    e.preventDefault();
                    break;
                case '-':
                case '_':
                    setZoomLevel(prev => Math.max(CONSTANTS.MIN_ZOOM, prev / 1.3));
                    e.preventDefault();
                    break;
                case 'PageUp':
                    setCurrentFloor(prev => prev + 1);
                    e.preventDefault();
                    break;
                case 'PageDown':
                    setCurrentFloor(prev => prev - 1);
                    e.preventDefault();
                    break;
                default:
                    break;
            }

            if (newZone && worldMapData.locations[newZone]) {
                setCurrentZone(newZone);
                setVisitedZones(prev => new Set([...prev, newZone]));
                
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
    }, [currentZone, onZoneSelect]);

    // Mouse drag handlers
    const handleMouseDown = (e) => {
        if (e.button === 0) {
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
        
        // Get mouse position relative to SVG
        const svg = svgRef.current;
        if (!svg) return;
        
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom delta
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(CONSTANTS.MIN_ZOOM, Math.min(CONSTANTS.MAX_ZOOM, zoomLevel * delta));
        
        // Calculate the world coordinates at mouse position before zoom
        const containerWidth = containerRef.current ? containerRef.current.clientWidth : 1000;
        const containerHeight = containerRef.current ? containerRef.current.clientHeight : 800;
        
        const viewBoxWidth = containerWidth / zoomLevel;
        const viewBoxHeight = containerHeight / zoomLevel;
        
        const currentZoneCoords = worldMapData.locations[currentZone];
        const cellSize = CONSTANTS.ZONE_GRID_SIZE;
        let centerX = currentZoneCoords ? currentZoneCoords.gridX * cellSize : 0;
        let centerY = currentZoneCoords ? currentZoneCoords.gridY * cellSize : 0;
        
        centerX -= panOffset.x / zoomLevel;
        centerY -= panOffset.y / zoomLevel;
        
        const viewBoxX = centerX - viewBoxWidth / 2;
        const viewBoxY = centerY - viewBoxHeight / 2;
        
        // World coordinates at mouse position
        const worldX = viewBoxX + (mouseX / rect.width) * viewBoxWidth;
        const worldY = viewBoxY + (mouseY / rect.height) * viewBoxHeight;
        
        // Calculate new viewBox dimensions at new zoom
        const newViewBoxWidth = containerWidth / newZoom;
        const newViewBoxHeight = containerHeight / newZoom;
        
        // Calculate what the new center should be to keep mouse position fixed
        const newCenterX = worldX - (mouseX / rect.width) * newViewBoxWidth + newViewBoxWidth / 2;
        const newCenterY = worldY - (mouseY / rect.height) * newViewBoxHeight + newViewBoxHeight / 2;
        
        // Calculate new pan offset
        const targetCenterX = currentZoneCoords ? currentZoneCoords.gridX * cellSize : 0;
        const targetCenterY = currentZoneCoords ? currentZoneCoords.gridY * cellSize : 0;
        
        const newPanOffsetX = (targetCenterX - newCenterX) * newZoom;
        const newPanOffsetY = (targetCenterY - newCenterY) * newZoom;
        
        // Update zoom and pan together
        setZoomLevel(newZoom);
        setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    };

    // Filter zones by region
    const getFilteredZones = () => {
        if (selectedRegion === 'all') {
            return Object.entries(worldMapData.locations);
        }
        return Object.entries(worldMapData.locations).filter(([_, zone]) => 
            zone.region === selectedRegion
        );
    };

    // Render individual rooms for a zone
    const renderZoneRooms = (zoneName, zoneInfo) => {
        if (!worldData || !worldData.Zones) return null;
        const zoneData = worldData.Zones[zoneName];
        if (!zoneData || !zoneData.Rooms) return null;

        const rooms = filterRoomsByFloor(zoneData.Rooms, currentFloor);
        const roomElements = [];

        Object.entries(rooms).forEach(([roomId, room]) => {
            const worldCoords = roomToWorldCoords(
                zoneInfo.gridX,
                zoneInfo.gridY,
                room.X,
                room.Y,
                room.Z
            );

            const terrainColor = getTerrainColor(room.TerrainColor);

            roomElements.push(
                <g key={`${zoneName}-room-${roomId}`}>
                    {/* Room square */}
                    <rect
                        x={worldCoords.worldX - CONSTANTS.ROOM_GRID_SIZE / 2}
                        y={worldCoords.worldY - CONSTANTS.ROOM_GRID_SIZE / 2}
                        width={CONSTANTS.ROOM_GRID_SIZE}
                        height={CONSTANTS.ROOM_GRID_SIZE}
                        fill={terrainColor}
                        stroke="#444"
                        strokeWidth="1"
                        opacity="0.9"
                    />

                    {/* Room exits */}
                    {room.ExitNorth && (
                        <line
                            x1={worldCoords.worldX}
                            y1={worldCoords.worldY - CONSTANTS.ROOM_GRID_SIZE / 2}
                            x2={worldCoords.worldX}
                            y2={worldCoords.worldY - CONSTANTS.ROOM_GRID_SIZE}
                            stroke="#00ff00"
                            strokeWidth="2"
                        />
                    )}
                    {room.ExitSouth && (
                        <line
                            x1={worldCoords.worldX}
                            y1={worldCoords.worldY + CONSTANTS.ROOM_GRID_SIZE / 2}
                            x2={worldCoords.worldX}
                            y2={worldCoords.worldY + CONSTANTS.ROOM_GRID_SIZE}
                            stroke="#00ff00"
                            strokeWidth="2"
                        />
                    )}
                    {room.ExitEast && (
                        <line
                            x1={worldCoords.worldX + CONSTANTS.ROOM_GRID_SIZE / 2}
                            y1={worldCoords.worldY}
                            x2={worldCoords.worldX + CONSTANTS.ROOM_GRID_SIZE}
                            y2={worldCoords.worldY}
                            stroke="#00ff00"
                            strokeWidth="2"
                        />
                    )}
                    {room.ExitWest && (
                        <line
                            x1={worldCoords.worldX - CONSTANTS.ROOM_GRID_SIZE / 2}
                            y1={worldCoords.worldY}
                            x2={worldCoords.worldX - CONSTANTS.ROOM_GRID_SIZE}
                            y2={worldCoords.worldY}
                            stroke="#00ff00"
                            strokeWidth="2"
                        />
                    )}

                    {/* Room name (only at very high zoom) */}
                    {zoomLevel > 8 && (
                        <text
                            x={worldCoords.worldX}
                            y={worldCoords.worldY + 4}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="8"
                            fontFamily="VT323, monospace"
                        >
                            {room.Name?.substring(0, 15)}
                        </text>
                    )}
                </g>
            );
        });

        return roomElements;
    };

    // Render zone boundary
    const renderZoneBoundary = (zoneName, zoneInfo) => {
        if (!worldData || !worldData.Zones) return null;
        const zoneData = worldData.Zones[zoneName];
        if (!zoneData || !zoneData.Rooms) return null;

        const bounds = calculateRoomBounds(zoneData.Rooms);
        const worldCoords = zoneToWorldCoords(zoneInfo.gridX, zoneInfo.gridY);

        const width = (bounds.maxX - bounds.minX + 2) * CONSTANTS.ROOM_GRID_SIZE;
        const height = (bounds.maxY - bounds.minY + 2) * CONSTANTS.ROOM_GRID_SIZE;
        const x = worldCoords.worldX + (bounds.minX * CONSTANTS.ROOM_GRID_SIZE) - CONSTANTS.ROOM_GRID_SIZE;
        const y = worldCoords.worldY + (bounds.minY * CONSTANTS.ROOM_GRID_SIZE) - CONSTANTS.ROOM_GRID_SIZE;

        const regionData = worldMapData.regions[zoneInfo.region];
        const color = regionData?.color || '#666';

        return (
            <rect
                key={`${zoneName}-boundary`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeDasharray="10,5"
                opacity="0.6"
            />
        );
    };

    // Main render function
    const renderMap = () => {
        const cellSize = CONSTANTS.ZONE_GRID_SIZE;
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
        const padding = cellSize / 2;

        // Calculate viewport - centered on current position
        const containerWidth = containerRef.current ? containerRef.current.clientWidth : 1000;
        const containerHeight = containerRef.current ? containerRef.current.clientHeight : 800;
        
        const viewBoxWidth = containerWidth / zoomLevel;
        const viewBoxHeight = containerHeight / zoomLevel;
        
        // Center on current zone
        const currentZoneCoords = worldMapData.locations[currentZone];
        let centerX = currentZoneCoords ? currentZoneCoords.gridX * cellSize : (minX + maxX) * cellSize / 2;
        let centerY = currentZoneCoords ? currentZoneCoords.gridY * cellSize : (minY + maxY) * cellSize / 2;
        
        // Apply pan offset
        centerX -= panOffset.x / zoomLevel;
        centerY -= panOffset.y / zoomLevel;
        
        const viewBoxX = centerX - viewBoxWidth / 2;
        const viewBoxY = centerY - viewBoxHeight / 2;

        // Calculate viewport bounds for culling
        const viewport = getViewportBounds(viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight);

        return (
            <svg
                ref={svgRef}
                viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
                style={{
                    width: '100%',
                    height: '100%',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    background: '#0a0a0a'
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
                        <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="#1a1a1a" strokeWidth="2" />
                        <circle cx={cellSize / 2} cy={cellSize / 2} r="3" fill="#2a2a2a" />
                    </pattern>
                    <pattern id="finegrid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#111" strokeWidth="1" />
                    </pattern>
                </defs>

                {/* Background grid - only render visible area */}
                <rect 
                    x={viewBoxX - cellSize} 
                    y={viewBoxY - cellSize} 
                    width={viewBoxWidth + cellSize * 2} 
                    height={viewBoxHeight + cellSize * 2} 
                    fill={detailLevel === 'rooms' ? 'url(#finegrid)' : 'url(#grid)'} 
                />

                {/* Render based on detail level */}
                {detailLevel === 'world' && (
                    <>
                        {/* Draw connection lines between zones - only visible ones */}
                        {filteredZones.map(([zoneName, zone]) => {
                            if (!zone.exits) return null;
                            
                            const x1 = zone.gridX * cellSize;
                            const y1 = zone.gridY * cellSize;
                            
                            // Check if zone is in viewport
                            const zoneBounds = {
                                left: x1 - CONSTANTS.ZONE_DISPLAY_SIZE,
                                right: x1 + CONSTANTS.ZONE_DISPLAY_SIZE,
                                top: y1 - CONSTANTS.ZONE_DISPLAY_SIZE,
                                bottom: y1 + CONSTANTS.ZONE_DISPLAY_SIZE
                            };
                            
                            if (!isInViewport(zoneBounds, viewport)) return null;
                            
                            return Object.entries(zone.exits).map(([direction, targetName]) => {
                                const targetZone = worldMapData.locations[targetName];
                                if (!targetZone) return null;

                                const x2 = targetZone.gridX * cellSize;
                                const y2 = targetZone.gridY * cellSize;

                                const isVisited = visitedZones.has(zoneName) && visitedZones.has(targetName);

                                return (
                                    <line
                                        key={`${zoneName}-${targetName}-${direction}`}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke={isVisited ? '#00ff00' : '#555'}
                                        strokeWidth="3"
                                        strokeDasharray={isVisited ? '' : '8,8'}
                                        opacity="0.4"
                                    />
                                );
                            });
                        })}

                        {/* Draw zone nodes - only visible ones */}
                        {filteredZones.map(([zoneName, zone]) => {
                            const x = zone.gridX * cellSize;
                            const y = zone.gridY * cellSize;
                            
                            // Viewport culling - skip if not visible
                            const zoneBounds = {
                                left: x - CONSTANTS.ZONE_DISPLAY_SIZE,
                                right: x + CONSTANTS.ZONE_DISPLAY_SIZE,
                                top: y - CONSTANTS.ZONE_DISPLAY_SIZE,
                                bottom: y + CONSTANTS.ZONE_DISPLAY_SIZE
                            };
                            
                            if (!isInViewport(zoneBounds, viewport)) return null;
                            
                            const isCurrent = zoneName === currentZone;
                            const isVisited = visitedZones.has(zoneName);
                            const isSelected = selectedZone?.name === zoneName;
                            
                            const isHighlighted = highlightedZones && highlightedZones.length > 0 && 
                                highlightedZones.some(hz => 
                                    hz.toLowerCase() === zoneName.toLowerCase() ||
                                    hz.toLowerCase() === zone.displayName.toLowerCase()
                                );

                            const regionColor = worldMapData.regions[zone.region]?.color || '#888';

                            let nodeColor = regionColor;
                            if (isCurrent) nodeColor = '#ffff00';
                            else if (isHighlighted) nodeColor = '#ff00ff';
                            else if (isSelected) nodeColor = '#ff6600';
                            else if (isVisited) nodeColor = '#00ff00';

                            return (
                                <g
                                    key={zoneName}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentZone(zoneName);
                                        setVisitedZones(prev => new Set([...prev, zoneName]));
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
                                    {isCurrent && (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="25"
                                            fill={nodeColor}
                                            opacity="0.3"
                                        >
                                            <animate
                                                attributeName="r"
                                                values="25;35;25"
                                                dur="1.5s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                    )}

                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="18"
                                        fill={nodeColor}
                                        stroke="#fff"
                                        strokeWidth="3"
                                    />

                                    <rect
                                        x={x - (zone.displayName.length * 5)}
                                        y={y - 50}
                                        width={zone.displayName.length * 10 + 10}
                                        height="28"
                                        fill="rgba(0, 0, 0, 0.9)"
                                        rx="5"
                                        stroke={isCurrent ? '#ffff00' : 'rgba(255,255,255,0.3)'}
                                        strokeWidth={isCurrent ? '2' : '1'}
                                    />

                                    <text
                                        x={x}
                                        y={y - 28}
                                        textAnchor="middle"
                                        fill={nodeColor}
                                        fontSize={cityNameFontSize}
                                        fontWeight="bold"
                                        fontFamily="VT323, monospace"
                                        stroke="#000"
                                        strokeWidth="5"
                                        paintOrder="stroke"
                                    >
                                        {zone.displayName}
                                    </text>
                                </g>
                            );
                        })}
                    </>
                )}

                {detailLevel === 'zones' && (
                    <>
                        {/* Show zone boundaries - only visible zones */}
                        {filteredZones.map(([zoneName, zone]) => {
                            if (!worldData || !worldData.Zones) return null;
                            const zoneData = worldData.Zones[zoneName];
                            if (!zoneData) return null;
                            
                            const roomBounds = calculateRoomBounds(zoneData.Rooms);
                            const zoneBounds = getZoneBounds(zone.gridX, zone.gridY, roomBounds);
                            
                            if (!isInViewport(zoneBounds, viewport)) return null;
                            
                            return renderZoneBoundary(zoneName, zone);
                        })}
                        {/* Still show zone nodes but smaller - only visible ones */}
                        {filteredZones.map(([zoneName, zone]) => {
                            const x = zone.gridX * cellSize;
                            const y = zone.gridY * cellSize;
                            
                            const zoneBounds = {
                                left: x - 50,
                                right: x + 50,
                                top: y - 50,
                                bottom: y + 50
                            };
                            
                            if (!isInViewport(zoneBounds, viewport)) return null;
                            
                            return (
                                <circle
                                    key={`${zoneName}-node`}
                                    cx={x}
                                    cy={y}
                                    r="10"
                                    fill="#00ff00"
                                    stroke="#fff"
                                    strokeWidth="2"
                                />
                            );
                        })}
                    </>
                )}

                {detailLevel === 'rooms' && (
                    <>
                        {/* Show individual rooms - only for visible zones */}
                        {filteredZones.map(([zoneName, zone]) => {
                            if (!worldData || !worldData.Zones) return null;
                            const zoneData = worldData.Zones[zoneName];
                            if (!zoneData) return null;
                            
                            const roomBounds = calculateRoomBounds(zoneData.Rooms);
                            const zoneBounds = getZoneBounds(zone.gridX, zone.gridY, roomBounds);
                            
                            // Viewport culling - only render zones in viewport
                            if (!isInViewport(zoneBounds, viewport)) return null;
                            
                            return renderZoneRooms(zoneName, zone);
                        })}
                    </>
                )}
            </svg>
        );
    };

    const currentZoneData = worldMapData.locations[currentZone];
    const regionData = currentZoneData ? worldMapData.regions[currentZoneData.region] : null;

    // Show loading state
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
                    <div>Loading World Data...</div>
                    <div style={{ fontSize: '0.6em', color: '#888', marginTop: '10px' }}>
                        Stitching together all zone rooms...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="unified-world-map-container" style={{ display: 'flex', height: '100%', position: 'relative' }}>
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
                zIndex: 999,
                transition: 'width 0.3s ease, padding 0.3s ease'
            }}>
                {/* Toggle Button */}
                {isLeftSidebarOpen ? (
                    <button
                        onClick={() => setIsLeftSidebarOpen(false)}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            background: '#ff6600',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontFamily: 'VT323, monospace',
                            fontSize: '1em',
                            fontWeight: 'bold',
                            zIndex: 1
                        }}
                        title="Collapse sidebar"
                    >
                        ◀
                    </button>
                ) : (
                    <button
                        onClick={() => setIsLeftSidebarOpen(true)}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '10px',
                            transform: 'translateX(-50%)',
                            background: '#00ff00',
                            color: '#000',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '15px 10px',
                            cursor: 'pointer',
                            fontFamily: 'VT323, monospace',
                            fontSize: '1.5em',
                            fontWeight: 'bold',
                            zIndex: 1,
                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                        }}
                        title="Expand sidebar"
                    >
                        ▶
                    </button>
                )}

                {/* Content - only show when expanded */}
                {isLeftSidebarOpen && (
                    <>
                        {/* Zoom Level Indicator */}
                        <div style={{
                    background: '#2a2a2a',
                    border: '2px solid #00ff00',
                    borderRadius: '5px',
                    padding: '15px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#00ff00', fontSize: '0.9em', marginBottom: '5px' }}>
                        Zoom Level
                    </div>
                    <div style={{ color: '#ffff00', fontSize: '1.8em', fontWeight: 'bold' }}>
                        {zoomLevel.toFixed(1)}x
                    </div>
                    <div style={{ color: '#888', fontSize: '0.85em', marginTop: '5px' }}>
                        Detail: {detailLevel === 'world' ? '🌍 World' : detailLevel === 'zones' ? '🗺️ Zones' : '🏘️ Rooms'}
                    </div>
                    {detailLevel === 'rooms' && (
                        <div style={{ color: '#888', fontSize: '0.85em', marginTop: '5px' }}>
                            Floor: {currentFloor}
                        </div>
                    )}
                </div>

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

                {/* Region Filter */}
                <div className="region-filter" style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>Filter by Region:</h4>
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            color: '#00ff00',
                            fontSize: '1em',
                            fontFamily: 'VT323, monospace',
                            cursor: 'pointer',
                            borderRadius: '3px'
                        }}
                    >
                        <option value="all">All Regions</option>
                        {Object.entries(worldMapData.regions).map(([key, region]) => (
                            <option key={key} value={key}>{region.name}</option>
                        ))}
                    </select>
                </div>

                {/* City Name Font Size Control */}
                <div className="font-size-control" style={{ 
                    marginBottom: '20px',
                    background: '#2a2a2a',
                    border: '2px solid #00ff00',
                    borderRadius: '5px',
                    padding: '15px'
                }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>City Name Size:</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#888', fontSize: '0.9em', minWidth: '35px' }}>
                            {cityNameFontSize}px
                        </span>
                        <input
                            type="range"
                            min="8"
                            max="32"
                            value={cityNameFontSize}
                            onChange={(e) => setCityNameFontSize(parseInt(e.target.value))}
                            style={{
                                flex: 1,
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        fontSize: '0.75em',
                        color: '#666'
                    }}>
                        <span>Small</span>
                        <span>Large</span>
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
                        <div>🖱️ Mouse Wheel - Zoom In/Out</div>
                        <div>🖱️ Click + Drag - Pan</div>
                        <div>⌨️ +/- Keys - Zoom</div>
                        <div>⬆⬇ Page Up/Down - Change Floor</div>
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
                        <strong>View:</strong> {detailLevel}
                    </div>
                </div>
                    </>
                )}
            </div>

            {/* Map Canvas */}
            <div className="world-map-canvas" style={{
                position: 'fixed',
                left: isLeftSidebarOpen ? '320px' : '50px',
                right: isRightSidebarOpen ? '400px' : '50px',
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
                width: isRightSidebarOpen ? '400px' : '50px',
                zIndex: 999,
                transition: 'width 0.3s ease, padding 0.3s ease',
                background: '#1a1a1a',
                borderLeft: '3px solid #00ff00',
                padding: isRightSidebarOpen ? '20px' : '10px',
                overflowY: isRightSidebarOpen ? 'auto' : 'hidden',
                overflowX: 'hidden'
            }}>
                {/* Toggle Button */}
                {isRightSidebarOpen ? (
                    <button
                        onClick={() => setIsRightSidebarOpen(false)}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '10px',
                            background: '#ff6600',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontFamily: 'VT323, monospace',
                            fontSize: '1em',
                            fontWeight: 'bold',
                            zIndex: 1
                        }}
                        title="Collapse sidebar"
                    >
                        ▶
                    </button>
                ) : (
                    <button
                        onClick={() => setIsRightSidebarOpen(true)}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '10px',
                            transform: 'translateX(-50%)',
                            background: '#00ff00',
                            color: '#000',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '15px 10px',
                            cursor: 'pointer',
                            fontFamily: 'VT323, monospace',
                            fontSize: '1.5em',
                            fontWeight: 'bold',
                            zIndex: 1,
                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                        }}
                        title="Expand sidebar"
                    >
                        ◀
                    </button>
                )}

                {/* Zone Details Content - only show when expanded */}
                {isRightSidebarOpen && (
                <div style={{ marginTop: '40px' }}>
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

                    {/* Available Exits */}
                    {currentZoneData?.exits && (
                        <div style={{
                            background: '#2a2a2a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#00ff00', marginBottom: '10px' }}>Available Exits:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {currentZoneData.exits.north && (
                                    <div style={{ 
                                        background: '#1a1a1a', 
                                        padding: '8px', 
                                        borderRadius: '3px',
                                        border: '1px solid #333'
                                    }}>
                                        <span style={{ color: '#00ff00' }}>⬆ North:</span>{' '}
                                        <span style={{ color: '#ccc', fontSize: '0.9em' }}>
                                            {worldMapData.locations[currentZoneData.exits.north]?.displayName}
                                        </span>
                                    </div>
                                )}
                                {currentZoneData.exits.south && (
                                    <div style={{ 
                                        background: '#1a1a1a', 
                                        padding: '8px', 
                                        borderRadius: '3px',
                                        border: '1px solid #333'
                                    }}>
                                        <span style={{ color: '#00ff00' }}>⬇ South:</span>{' '}
                                        <span style={{ color: '#ccc', fontSize: '0.9em' }}>
                                            {worldMapData.locations[currentZoneData.exits.south]?.displayName}
                                        </span>
                                    </div>
                                )}
                                {currentZoneData.exits.east && (
                                    <div style={{ 
                                        background: '#1a1a1a', 
                                        padding: '8px', 
                                        borderRadius: '3px',
                                        border: '1px solid #333'
                                    }}>
                                        <span style={{ color: '#00ff00' }}>➡ East:</span>{' '}
                                        <span style={{ color: '#ccc', fontSize: '0.9em' }}>
                                            {worldMapData.locations[currentZoneData.exits.east]?.displayName}
                                        </span>
                                    </div>
                                )}
                                {currentZoneData.exits.west && (
                                    <div style={{ 
                                        background: '#1a1a1a', 
                                        padding: '8px', 
                                        borderRadius: '3px',
                                        border: '1px solid #333'
                                    }}>
                                        <span style={{ color: '#00ff00' }}>⬅ West:</span>{' '}
                                        <span style={{ color: '#ccc', fontSize: '0.9em' }}>
                                            {worldMapData.locations[currentZoneData.exits.west]?.displayName}
                                        </span>
                                    </div>
                                )}
                            </div>
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

export default UnifiedWorldMap;

