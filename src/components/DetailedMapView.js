import React, { useState, useEffect, useRef } from 'react';
import { loadWorldData, findZoneByLocationName, convertRoomDataForDisplay, getTerrainColor } from '../utils/worldDataLoader';
import WikiSidebar from './WikiSidebar';
import navigationData from '../navigationMapData.json';
import { useGameData } from '../contexts/DataContext';

function DetailedMapView({ location, onClose, onNavigateToZone, onHighlightZones, onClearHighlight, onNavigateToMob, highlightedMobName }) {
    const { mobs: loadedMobs } = useGameData();
    const [zoom, setZoom] = useState(1);
    const [zoneData, setZoneData] = useState(null);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isWikiOpen, setIsWikiOpen] = useState(() => {
        const saved = localStorage.getItem('revelationMapIsWikiOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('revelationMapIsLeftSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [connectedZones, setConnectedZones] = useState([]); // Track zone exits
    const [showZoneInfo, setShowZoneInfo] = useState(() => {
        const saved = localStorage.getItem('revelationMapShowZoneInfo');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [iconSize, setIconSize] = useState(1); // Icon size multiplier (1 = normal, 1.5 = 150%, 2 = 200%)
    
    // Drag to pan state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Ref for the map canvas
    const mapCanvasRef = useRef(null);
    
    // Mob highlighting state
    const [highlightedMob, setHighlightedMob] = useState(highlightedMobName || null); // Name of mob to highlight
    const [highlightedRooms, setHighlightedRooms] = useState(new Set()); // Room IDs with this mob
    
    // Stairs/Exit highlighting state
    const [highlightedExitZone, setHighlightedExitZone] = useState(null); // Name of zone exit to highlight
    
    // Info panel collapse state
    const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(() => {
        const saved = localStorage.getItem('revelationMapIsInfoPanelCollapsed');
        return saved !== null ? JSON.parse(saved) : false;
    });
    
    // Hover state for rooms
    const [hoveredRoom, setHoveredRoom] = useState(null); // Room being hovered over
    
    // Room focus mode - dims other rooms when one is selected
    const [roomFocusMode, setRoomFocusMode] = useState(() => {
        const saved = localStorage.getItem('revelationMapRoomFocusMode');
        return saved !== null ? JSON.parse(saved) : true;
    });
    
    // Left sidebar tab selection
    const [leftSidebarTab, setLeftSidebarTab] = useState(() => {
        const saved = localStorage.getItem('revelationMapLeftSidebarTab');
        return saved !== null ? saved : 'zone';
    });

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
                background: #00ffaa;
                box-shadow: 0 0 15px rgba(0, 255, 170, 1);
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
                background: #00ffaa;
                box-shadow: 0 0 15px rgba(0, 255, 170, 1);
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

    // Save collapsible section states to localStorage
    useEffect(() => {
        localStorage.setItem('revelationMapIsWikiOpen', JSON.stringify(isWikiOpen));
    }, [isWikiOpen]);

    useEffect(() => {
        localStorage.setItem('revelationMapIsLeftSidebarOpen', JSON.stringify(isLeftSidebarOpen));
    }, [isLeftSidebarOpen]);

    useEffect(() => {
        localStorage.setItem('revelationMapShowZoneInfo', JSON.stringify(showZoneInfo));
    }, [showZoneInfo]);

    useEffect(() => {
        localStorage.setItem('revelationMapIsInfoPanelCollapsed', JSON.stringify(isInfoPanelCollapsed));
    }, [isInfoPanelCollapsed]);

    useEffect(() => {
        localStorage.setItem('revelationMapRoomFocusMode', JSON.stringify(roomFocusMode));
    }, [roomFocusMode]);

    useEffect(() => {
        localStorage.setItem('revelationMapLeftSidebarTab', leftSidebarTab);
    }, [leftSidebarTab]);

    // Load real MUD data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const worldData = await loadWorldData();
                if (!worldData) {
                    throw new Error('Failed to load world data');
                }

                const zone = findZoneByLocationName(worldData, location.name);
                if (!zone) {
                    throw new Error(`Zone not found for location: ${location.name}`);
                }

                const processedData = convertRoomDataForDisplay(zone.data);
                setZoneData(processedData);
                
                // Set default floor level to 0 (ground level) for all zones
                setCurrentLevel(0);
                
                // Find all connected zones (zone exits) with directions
                const zoneExitsMap = new Map(); // Map of zone name -> direction
                
                // Check navigation data for this zone's exits
                const navLocation = navigationData.locations[location.name];
                if (navLocation && navLocation.exits) {
                    Object.entries(navLocation.exits).forEach(([direction, targetZone]) => {
                        zoneExitsMap.set(targetZone, direction.toUpperCase());
                    });
                }
                
                // Also collect from room data (in case there are exits not in nav data)
                processedData.rooms.forEach(room => {
                    if (room.isZoneExit && room.exitToZone) {
                        if (!zoneExitsMap.has(room.exitToZone)) {
                            zoneExitsMap.set(room.exitToZone, '?'); // Unknown direction
                        }
                    }
                });
                
                // Convert to array of objects with zone name and direction
                const zoneExitsArray = Array.from(zoneExitsMap.entries()).map(([zoneName, direction]) => ({
                    name: zoneName,
                    direction: direction
                }));
                
                setConnectedZones(zoneExitsArray);
            } catch (err) {
                console.error('Error loading zone data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [location]);

    // Center the map canvas when data loads (but NOT on zoom changes to avoid jitter)
    useEffect(() => {
        if (mapCanvasRef.current && zoneData) {
            const canvas = mapCanvasRef.current;
            // Center the scrollable area only on initial load
            canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) / 2;
            canvas.scrollTop = (canvas.scrollHeight - canvas.clientHeight) / 2;
        }
    }, [zoneData]); // Removed 'zoom' to prevent re-centering on every zoom change

    // Auto-highlight mob when navigating from MobsPage
    useEffect(() => {
        if (highlightedMobName && zoneData && !loading) {
            // Small delay to ensure the map is rendered
            setTimeout(() => {
                handleHighlightMob(highlightedMobName);
            }, 300);
        }
    }, [highlightedMobName, zoneData, loading]);

    // Keyboard shortcut: Escape to close
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

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'PageUp' && zoneData && currentLevel < zoneData.gridSize.levels - 1) {
                setCurrentLevel(prev => prev + 1);
                e.preventDefault(); // Prevent page scroll
            } else if (e.key === 'PageDown' && currentLevel > 0) {
                setCurrentLevel(prev => prev - 1);
                e.preventDefault(); // Prevent page scroll
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onClose, zoneData, currentLevel]);

    if (!location) return null;
    if (loading) {
        return (
            <div className="detailed-map-overlay">
                <div className="detailed-map-container">
                    <div className="detailed-map-header">
                        <h2>Loading {location.name}...</h2>
                        <button className="close-button" onClick={onClose}>✕</button>
                    </div>
                    <div style={{ padding: '50px', textAlign: 'center', color: '#00ff00' }}>
                        <p>Loading real MUD room data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detailed-map-overlay">
                <div className="detailed-map-container">
                    <div className="detailed-map-header">
                        <h2>{location.name}</h2>
                        <button className="close-button" onClick={onClose}>✕</button>
                    </div>
                    <div style={{ padding: '50px', textAlign: 'center', color: '#ff0000' }}>
                        <p>Error: {error}</p>
                        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#888' }}>
                            This location may not have detailed map data available.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!zoneData) return null;

    const cellSize = 60;
    const currentLevelRooms = zoneData.rooms.filter(room => room.position.z === currentLevel);
    
    // Calculate total NPCs in the zone
    const totalNpcs = zoneData.rooms.reduce((sum, room) => sum + room.npcs.length, 0);

    // Navigate to adjacent room based on direction
    const navigateToRoom = (direction) => {
        if (!selectedRoom) return;

        let targetRoom = null;
        const { x, y, z } = selectedRoom.position;

        switch (direction) {
            case 'north':
                targetRoom = zoneData.rooms.find(r => r.position.x === x && r.position.y === y - 1 && r.position.z === z);
                break;
            case 'south':
                targetRoom = zoneData.rooms.find(r => r.position.x === x && r.position.y === y + 1 && r.position.z === z);
                break;
            case 'east':
                targetRoom = zoneData.rooms.find(r => r.position.x === x + 1 && r.position.y === y && r.position.z === z);
                break;
            case 'west':
                targetRoom = zoneData.rooms.find(r => r.position.x === x - 1 && r.position.y === y && r.position.z === z);
                break;
            case 'up':
                targetRoom = zoneData.rooms.find(r => r.position.x === x && r.position.y === y && r.position.z === z + 1);
                break;
            case 'down':
                targetRoom = zoneData.rooms.find(r => r.position.x === x && r.position.y === y && r.position.z === z - 1);
                break;
            default:
                return;
        }

        if (targetRoom) {
            setSelectedRoom(targetRoom);
            // Change level if moving up/down
            if (direction === 'up' || direction === 'down') {
                setCurrentLevel(targetRoom.position.z);
            }
        }
    };

    // Pan handlers - for click and drag to move map
    const handleMouseDown = (e) => {
        // Only start panning with left mouse button
        if (e.button !== 0) return;
        
        // Don't set isPanning yet - wait for movement
        // This allows clicks to work properly
        setIsDragging(false);
        setHoveredRoom(null); // Clear hover state when starting to pan
        setPanStart({ x: e.clientX, y: e.clientY });
        setScrollStart({ 
            x: e.currentTarget.scrollLeft, 
            y: e.currentTarget.scrollTop 
        });
    };

    const handleMouseMove = (e) => {
        // Check if we have a pan start position (mousedown occurred)
        if (panStart.x === 0 && panStart.y === 0) return;

        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved more than 5px, start panning/dragging
        if (distance > 5) {
            if (!isPanning) {
                setIsPanning(true);
                setIsDragging(true);
                e.currentTarget.style.cursor = 'grabbing';
            }
        }

        // Only actually pan if we're panning
        if (isPanning) {
            // Update scroll position
            e.currentTarget.scrollLeft = scrollStart.x - dx;
            e.currentTarget.scrollTop = scrollStart.y - dy;
        }
    };

    const handleMouseUp = (e) => {
        if (isPanning) {
            setIsPanning(false);
            e.currentTarget.style.cursor = 'grab';
            // Reset dragging flag after a brief delay to allow click events to check it first
            setTimeout(() => setIsDragging(false), 10);
        }
        // Reset pan start position
        setPanStart({ x: 0, y: 0 });
    };

    const handleMouseLeave = (e) => {
        if (isPanning) {
            setIsPanning(false);
            setIsDragging(false);
            e.currentTarget.style.cursor = 'grab';
        }
        // Reset pan start position
        setPanStart({ x: 0, y: 0 });
    };

    // Handle room click - only if not dragging
    const handleRoomClick = (room) => {
        // Don't select room if we were dragging
        if (isDragging) {
            setIsDragging(false);
            return;
        }
        setSelectedRoom(room);
        
        // Auto-switch to Room tab when a room is clicked
        setLeftSidebarTab('room');
        
        // Auto-center on the selected room
        if (mapCanvasRef.current) {
            const cellSize = 60;
            const canvas = mapCanvasRef.current;
            
            // Calculate the room's position on the canvas (accounting for flipped Y-axis)
            const roomX = room.position.x * cellSize * zoom;
            const roomY = (zoneData.gridSize.height - 1 - room.position.y) * cellSize * zoom;
            
            // Calculate the center of the room
            const roomCenterX = roomX + (cellSize * zoom / 2);
            const roomCenterY = roomY + (cellSize * zoom / 2);
            
            // Calculate scroll position to center the room in the viewport
            const targetScrollLeft = roomCenterX - (canvas.clientWidth / 2);
            const targetScrollTop = roomCenterY - (canvas.clientHeight / 2);
            
            // Smooth scroll to center the room
            canvas.scrollTo({
                left: Math.max(0, targetScrollLeft),
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }
    };

    // Highlight rooms containing a specific mob
    const handleHighlightMob = (mobName) => {
        if (!zoneData) return;
        
        setHighlightedMob(mobName);
        
        // Find all rooms that contain this mob
        const roomsWithMob = new Set();
        let firstRoomWithMob = null;
        
        zoneData.rooms.forEach(room => {
            const hasThisMob = room.npcs.some(npc => 
                npc.name.toLowerCase() === mobName.toLowerCase()
            );
            if (hasThisMob) {
                roomsWithMob.add(room.id);
                if (!firstRoomWithMob) {
                    firstRoomWithMob = room;
                }
            }
        });
        
        setHighlightedRooms(roomsWithMob);
        
        // If no rooms found, show a message
        if (roomsWithMob.size === 0) {
            console.warn(`No rooms found with mob: ${mobName}`);
        } else {
            console.log(`Highlighting ${roomsWithMob.size} rooms with ${mobName}`);
            
            // Auto-pan to the first room containing this mob
            if (firstRoomWithMob && mapCanvasRef.current) {
                const cellSize = 60;
                const canvas = mapCanvasRef.current;
                
                // Calculate the room's position on the canvas
                const roomX = firstRoomWithMob.position.x * cellSize * zoom;
                const roomY = (zoneData.gridSize.height - 1 - firstRoomWithMob.position.y) * cellSize * zoom;
                
                // Calculate the center of the room
                const roomCenterX = roomX + (cellSize * zoom / 2);
                const roomCenterY = roomY + (cellSize * zoom / 2);
                
                // Calculate scroll position to center the room in the viewport
                const targetScrollLeft = roomCenterX - (canvas.clientWidth / 2);
                const targetScrollTop = roomCenterY - (canvas.clientHeight / 2);
                
                // Smooth scroll to the target position
                canvas.scrollTo({
                    left: Math.max(0, targetScrollLeft),
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth'
                });
                
                // Switch to the floor level of the first room with the mob
                if (firstRoomWithMob.position.z !== currentLevel) {
                    setCurrentLevel(firstRoomWithMob.position.z);
                }
            }
        }
    };

    // Clear mob highlighting
    const handleClearHighlight = () => {
        setHighlightedMob(null);
        setHighlightedRooms(new Set());
        setHighlightedExitZone(null);
    };

    // Show path to reach a mob's floor
    const handleShowMobPath = (mobName, mobFloors) => {
        if (!zoneData || !mobFloors || mobFloors.length === 0) return;
        
        // Sort floors to find the closest one
        const sortedFloors = [...mobFloors].sort((a, b) => {
            const distA = Math.abs(a - currentLevel);
            const distB = Math.abs(b - currentLevel);
            return distA - distB;
        });
        
        const targetFloor = sortedFloors[0];
        
        // If we're already on a floor with this mob, just highlight the mob
        if (mobFloors.includes(currentLevel)) {
            handleHighlightMob(mobName);
            return;
        }
        
        // Determine direction we need to go
        const needToGoUp = targetFloor > currentLevel;
        const needToGoDown = targetFloor < currentLevel;
        
        // Find stairs/exits that go in the right direction on the current floor
        const stairRooms = new Set();
        let firstStairRoom = null;
        
        zoneData.rooms.forEach(room => {
            if (room.position.z !== currentLevel) return;
            
            // Check if exits object exists and has up/down properties
            const hasUpExit = room.exits && room.exits.up;
            const hasDownExit = room.exits && room.exits.down;
            
            if ((needToGoUp && hasUpExit) || (needToGoDown && hasDownExit)) {
                stairRooms.add(room.id);
                if (!firstStairRoom) {
                    firstStairRoom = room;
                }
            }
        });
        
        setHighlightedRooms(stairRooms);
        setHighlightedMob(`${mobName} (Path)`);
        
        // Auto-pan to the first stair room
        if (firstStairRoom && mapCanvasRef.current) {
            const cellSize = 60;
            const canvas = mapCanvasRef.current;
            
            const roomX = firstStairRoom.position.x * cellSize * zoom;
            const roomY = (zoneData.gridSize.height - 1 - firstStairRoom.position.y) * cellSize * zoom;
            
            const roomCenterX = roomX + (cellSize * zoom / 2);
            const roomCenterY = roomY + (cellSize * zoom / 2);
            
            const targetScrollLeft = roomCenterX - (canvas.clientWidth / 2);
            const targetScrollTop = roomCenterY - (canvas.clientHeight / 2);
            
            canvas.scrollTo({
                left: Math.max(0, targetScrollLeft),
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }
    };

    // Highlight stairs/exits to a specific zone
    const handleHighlightExit = (zoneName) => {
        if (!zoneData) return;
        
        setHighlightedExitZone(zoneName);
        setHighlightedMob(null); // Clear mob highlighting
        
        // Find all rooms that are zone exits to this zone
        const exitRooms = new Set();
        let firstExitRoom = null;
        
        zoneData.rooms.forEach(room => {
            if (room.isZoneExit && room.exitToZone === zoneName) {
                exitRooms.add(room.id);
                if (!firstExitRoom) {
                    firstExitRoom = room;
                }
            }
        });
        
        setHighlightedRooms(exitRooms);
        
        // If no rooms found, show a message
        if (exitRooms.size === 0) {
            console.warn(`No exit rooms found to zone: ${zoneName}`);
        } else {
            console.log(`Highlighting ${exitRooms.size} exit rooms to ${zoneName}`);
            
            // Auto-pan to the first exit room
            if (firstExitRoom && mapCanvasRef.current) {
                const cellSize = 60;
                const canvas = mapCanvasRef.current;
                
                // Calculate the room's position on the canvas
                const roomX = firstExitRoom.position.x * cellSize * zoom;
                const roomY = (zoneData.gridSize.height - 1 - firstExitRoom.position.y) * cellSize * zoom;
                
                // Calculate the center of the room
                const roomCenterX = roomX + (cellSize * zoom / 2);
                const roomCenterY = roomY + (cellSize * zoom / 2);
                
                // Calculate scroll position to center the room in the viewport
                const targetScrollLeft = roomCenterX - (canvas.clientWidth / 2);
                const targetScrollTop = roomCenterY - (canvas.clientHeight / 2);
                
                // Smooth scroll to the target position
                canvas.scrollTo({
                    left: Math.max(0, targetScrollLeft),
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth'
                });
                
                // Switch to the appropriate floor level
                if (firstExitRoom.position.z !== currentLevel) {
                    setCurrentLevel(firstExitRoom.position.z);
                }
            }
        }
    };

    const renderGrid = () => {
        const gridWidth = zoneData.gridSize.width * cellSize;
        const gridHeight = zoneData.gridSize.height * cellSize;

        return (
            <svg 
                viewBox={`0 0 ${gridWidth} ${gridHeight}`}
                style={{ 
                    width: '100%', 
                    height: '100%',
                    display: 'block'
                }}
            >
                {/* Grid background */}
                <rect 
                    x={0} 
                    y={0} 
                    width={gridWidth} 
                    height={gridHeight} 
                    fill="#0a0a0a"
                />

                {/* Grid lines */}
                {Array.from({ length: zoneData.gridSize.height + 1 }).map((_, i) => (
                    <line
                        key={`h-${i}`}
                        x1={0}
                        y1={i * cellSize}
                        x2={gridWidth}
                        y2={i * cellSize}
                        stroke="#1a1a1a"
                        strokeWidth="1"
                    />
                ))}
                {Array.from({ length: zoneData.gridSize.width + 1 }).map((_, i) => (
                    <line
                        key={`v-${i}`}
                        x1={i * cellSize}
                        y1={0}
                        x2={i * cellSize}
                        y2={gridHeight}
                        stroke="#1a1a1a"
                        strokeWidth="1"
                    />
                ))}

                {/* Rooms */}
                {currentLevelRooms.map(room => {
                    const x = room.position.x * cellSize;
                    // Flip Y-axis so north is up and south is down (invert Y coordinate)
                    const y = (zoneData.gridSize.height - 1 - room.position.y) * cellSize;
                    const isSelected = selectedRoom && selectedRoom.id === room.id;
                    const isHovered = hoveredRoom && hoveredRoom.id === room.id;
                    const isHighlighted = highlightedRooms.has(room.id);
                    const roomColor = getTerrainColor(room.terrainColor);
                    const hasNpcs = room.npcs.length > 0;
                    
                    // Check if this room should be dimmed (when focus mode is on and another room is selected)
                    const shouldDim = roomFocusMode && selectedRoom && !isSelected && !isHovered;

                    return (
                        <g key={room.id}>
                            {/* Highlight glow for rooms with target mob */}
                            {isHighlighted && (
                                <>
                                    {/* Outer glow */}
                                    <rect
                                        x={x - 4}
                                        y={y - 4}
                                        width={cellSize + 8}
                                        height={cellSize + 8}
                                        fill="none"
                                        stroke="#FF00FF"
                                        strokeWidth="8"
                                        opacity="0.6"
                                        pointerEvents="none"
                                    >
                                        <animate
                                            attributeName="stroke-opacity"
                                            values="0.6;0.2;0.6"
                                            dur="1.5s"
                                            repeatCount="indefinite"
                                        />
                                    </rect>
                                    {/* Inner border */}
                                    <rect
                                        x={x - 1}
                                        y={y - 1}
                                        width={cellSize + 2}
                                        height={cellSize + 2}
                                        fill="none"
                                        stroke="#FF00FF"
                                        strokeWidth="3"
                                        opacity="1"
                                        pointerEvents="none"
                                    />
                                </>
                            )}
                            
                            {/* Hover glow effect */}
                            {isHovered && !isSelected && (
                                <rect
                                    x={x - 2}
                                    y={y - 2}
                                    width={cellSize + 4}
                                    height={cellSize + 4}
                                    fill="none"
                                    stroke="#00FFFF"
                                    strokeWidth="3"
                                    opacity="0.8"
                                    pointerEvents="none"
                                />
                            )}
                            
                            {/* Dim overlay for focus mode */}
                            {shouldDim && (
                                <rect
                                    x={x + 2}
                                    y={y + 2}
                                    width={cellSize - 4}
                                    height={cellSize - 4}
                                    fill="#000000"
                                    fillOpacity={0.7}
                                    pointerEvents="none"
                                />
                            )}
                            
                            {/* Room cell - ALWAYS show terrain color */}
                            <rect
                                x={x + 2}
                                y={y + 2}
                                width={cellSize - 4}
                                height={cellSize - 4}
                                fill={roomColor}
                                fillOpacity={shouldDim ? 0.4 : 1}
                                stroke={isSelected ? '#FFD700' : (isHovered ? '#00FFFF' : (isHighlighted ? '#FF00FF' : '#333333'))}
                                strokeWidth={isSelected ? 4 : (isHovered ? 3 : (isHighlighted ? 2 : 1))}
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRoomClick(room);
                                }}
                                onMouseEnter={(e) => {
                                    if (!isPanning) {
                                        setHoveredRoom(room);
                                    }
                                }}
                                onMouseLeave={() => {
                                    setHoveredRoom(null);
                                }}
                            />
                            
                            {/* Selection highlight overlay */}
                            {isSelected && (
                                <rect
                                    x={x + 2}
                                    y={y + 2}
                                    width={cellSize - 4}
                                    height={cellSize - 4}
                                    fill="#FFD700"
                                    fillOpacity={0.3}
                                    pointerEvents="none"
                                />
                            )}
                            
                            {/* Hover highlight overlay */}
                            {isHovered && !isSelected && (
                                <rect
                                    x={x + 2}
                                    y={y + 2}
                                    width={cellSize - 4}
                                    height={cellSize - 4}
                                    fill="#00FFFF"
                                    fillOpacity={0.2}
                                    pointerEvents="none"
                                />
                            )}
                            
                            {/* Room ID - show more clearly on hover or selection */}
                            <text
                                x={x + cellSize / 2}
                                y={y + cellSize / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={isSelected ? '#FFD700' : (isHovered ? '#00FFFF' : '#000000')}
                                fontSize="10"
                                fontWeight="bold"
                                opacity={shouldDim ? 0.2 : (isSelected || isHovered ? 1 : 0.6)}
                                pointerEvents="none"
                            >
                                {room.id}
                            </text>

                            {/* NPC indicator - small red dot in corner */}
                            {hasNpcs && (
                                <circle
                                    cx={x + cellSize - 8}
                                    cy={y + 8}
                                    r={4 * iconSize}
                                    fill="#FF0000"
                                    stroke="#FFFFFF"
                                    strokeWidth={1 * iconSize}
                                    opacity={shouldDim ? 0.3 : 1}
                                />
                            )}

                            {/* Zone exit indicator - small door */}
                            {room.isZoneExit && (
                                <rect
                                    x={x + 4}
                                    y={y + 4}
                                    width={6 * iconSize}
                                    height={8 * iconSize}
                                    fill="#00FFFF"
                                    stroke="#FFFFFF"
                                    strokeWidth={1 * iconSize}
                                    opacity={shouldDim ? 0.3 : 1}
                                />
                            )}
                            
                            {/* Focus Lock Indicator - shows when room is selected and focus mode is on */}
                            {isSelected && roomFocusMode && (
                                <g>
                                    {/* Lock icon background */}
                                    <circle
                                        cx={x + 12}
                                        cy={y + cellSize - 12}
                                        r="8"
                                        fill="#000000"
                                        opacity="0.9"
                                    />
                                    {/* Lock icon */}
                                    <text
                                        x={x + 12}
                                        y={y + cellSize - 8}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="12"
                                        fill="#FFD700"
                                    >
                                        🔒
                                    </text>
                                </g>
                            )}

                            {/* Exit indicators - clickable navigation arrows */}
                            {isSelected && (
                                <>
                                    {room.exits.north && (
                                        <g 
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigateToRoom('north');
                                            }}
                                        >
                                            <line
                                                x1={x + cellSize / 2}
                                                y1={y + 2}
                                                x2={x + cellSize / 2}
                                                y2={y - (8 * iconSize)}
                                                stroke="#FFFF00"
                                                strokeWidth={3 * iconSize}
                                            />
                                            <polygon
                                                points={`${x + cellSize / 2},${y - (10 * iconSize)} ${x + cellSize / 2 - (5 * iconSize)},${y - (5 * iconSize)} ${x + cellSize / 2 + (5 * iconSize)},${y - (5 * iconSize)}`}
                                                fill="#FFFF00"
                                            />
                                        </g>
                                    )}
                                    {room.exits.south && (
                                        <g 
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigateToRoom('south');
                                            }}
                                        >
                                            <line
                                                x1={x + cellSize / 2}
                                                y1={y + cellSize - 2}
                                                x2={x + cellSize / 2}
                                                y2={y + cellSize + (8 * iconSize)}
                                                stroke="#FFFF00"
                                                strokeWidth={3 * iconSize}
                                            />
                                            <polygon
                                                points={`${x + cellSize / 2},${y + cellSize + (10 * iconSize)} ${x + cellSize / 2 - (5 * iconSize)},${y + cellSize + (5 * iconSize)} ${x + cellSize / 2 + (5 * iconSize)},${y + cellSize + (5 * iconSize)}`}
                                                fill="#FFFF00"
                                            />
                                        </g>
                                    )}
                                    {room.exits.east && (
                                        <g 
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigateToRoom('east');
                                            }}
                                        >
                                            <line
                                                x1={x + cellSize - 2}
                                                y1={y + cellSize / 2}
                                                x2={x + cellSize + (8 * iconSize)}
                                                y2={y + cellSize / 2}
                                                stroke="#FFFF00"
                                                strokeWidth={3 * iconSize}
                                            />
                                            <polygon
                                                points={`${x + cellSize + (10 * iconSize)},${y + cellSize / 2} ${x + cellSize + (5 * iconSize)},${y + cellSize / 2 - (5 * iconSize)} ${x + cellSize + (5 * iconSize)},${y + cellSize / 2 + (5 * iconSize)}`}
                                                fill="#FFFF00"
                                            />
                                        </g>
                                    )}
                                    {room.exits.west && (
                                        <g 
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigateToRoom('west');
                                            }}
                                        >
                                            <line
                                                x1={x + 2}
                                                y1={y + cellSize / 2}
                                                x2={x - (8 * iconSize)}
                                                y2={y + cellSize / 2}
                                                stroke="#FFFF00"
                                                strokeWidth={3 * iconSize}
                                            />
                                            <polygon
                                                points={`${x - (10 * iconSize)},${y + cellSize / 2} ${x - (5 * iconSize)},${y + cellSize / 2 - (5 * iconSize)} ${x - (5 * iconSize)},${y + cellSize / 2 + (5 * iconSize)}`}
                                                fill="#FFFF00"
                                            />
                                        </g>
                                    )}
                                </>
                            )}

                            {/* Up/Down indicators - clickable arrows */}
                            {room.exits.up && (
                                <text
                                    x={x + 6}
                                    y={y + cellSize - 6}
                                    fill="#00FFFF"
                                    fontSize={10 * iconSize}
                                    fontWeight="bold"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSelected) navigateToRoom('up');
                                    }}
                                >
                                    ⬆
                                </text>
                            )}
                            {room.exits.down && (
                                <text
                                    x={x + cellSize - 10}
                                    y={y + cellSize - 6}
                                    fill="#00FFFF"
                                    fontSize={10 * iconSize}
                                    fontWeight="bold"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSelected) navigateToRoom('down');
                                    }}
                                >
                                    ⬇
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        );
    };

    return (
        <div className="detailed-map-overlay">
            {/* Floating Close Button - Positioned over map area, avoiding right sidebar */}
            <button 
                onClick={onClose} 
                title="Close Zone View (ESC)"
                style={{
                    position: 'fixed',
                    top: '100px',
                    right: isWikiOpen ? '420px' : '70px',
                    background: 'rgba(26, 26, 26, 0.95)',
                    border: '2px solid #ff0000',
                    color: '#ff0000',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    borderRadius: '5px',
                    zIndex: 10003,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
                    transition: 'right 0.3s ease, background 0.2s, color 0.2s, transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: "'VT323', monospace"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff0000';
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.borderColor = '#ff6666';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(26, 26, 26, 0.95)';
                    e.currentTarget.style.color = '#ff0000';
                    e.currentTarget.style.borderColor = '#ff0000';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.8)';
                }}
            >
                <span style={{ fontSize: '1.3em' }}>✕</span>
                <span>ESC</span>
            </button>

            {/* Zone Info Badge - Positioned over map area, avoiding left sidebar */}
            <div style={{
                position: 'fixed',
                top: '100px',
                left: isLeftSidebarOpen ? '420px' : '70px',
                background: 'rgba(26, 26, 26, 0.95)',
                border: '2px solid #00ff00',
                borderRadius: '5px',
                padding: '12px 20px',
                zIndex: 10003,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(5px)',
                transition: 'left 0.3s ease'
            }}>
                <div style={{ 
                    color: '#00ff00', 
                    fontSize: '1.3em',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    fontFamily: "'Press Start 2P', monospace",
                    textShadow: '2px 2px 0px #000'
                }}>
                    {zoneData.zoneName}
                </div>
                <div style={{ 
                    color: '#888', 
                    fontSize: '0.9em',
                    fontFamily: "'VT323', monospace"
                }}>
                    {zoneData.totalRooms} Rooms • {zoneData.gridSize.levels} Level{zoneData.gridSize.levels !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Three-column layout */}
            <div style={{ 
                display: 'flex', 
                position: 'fixed',
                top: '80px',
                left: 0,
                right: 0,
                bottom: 0,
                background: '#0a0a0a'
            }}>
                {/* LEFT SIDEBAR - Legend & Stats (Fixed) */}
                <div className="map-info-sidebar" style={{
                    width: isLeftSidebarOpen ? '400px' : '50px',
                    background: '#1a1a1a',
                    borderRight: '3px solid #00ff00',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flexShrink: 0,
                    padding: isLeftSidebarOpen ? '20px' : '0',
                    height: '100%',
                    transition: 'width 0.3s ease, padding 0.3s ease',
                    position: 'relative'
                }}>
                    {/* Collapse/Expand Toggle Button */}
                    {isLeftSidebarOpen ? (
                        <button 
                            onClick={() => setIsLeftSidebarOpen(false)}
                            style={{
                                position: 'fixed',
                                top: '120px',
                                left: '365px',
                                background: '#00ff00',
                                color: '#000',
                                border: '2px solid #000',
                                borderRadius: '5px',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                fontSize: '1.3em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10002,
                                boxShadow: '0 4px 12px rgba(0, 255, 0, 0.6)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 6px 16px rgba(0, 255, 0, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 0, 0.6)';
                            }}
                            title="Collapse sidebar"
                        >
                            ◀
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsLeftSidebarOpen(true)}
                            style={{
                                position: 'fixed',
                                top: '120px',
                                left: '15px',
                                background: '#00ff00',
                                color: '#000',
                                border: '2px solid #000',
                                borderRadius: '5px',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                fontSize: '1.3em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10002,
                                boxShadow: '0 4px 12px rgba(0, 255, 0, 0.6)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 6px 16px rgba(0, 255, 0, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 0, 0.6)';
                            }}
                            title="Expand sidebar"
                        >
                            ▶
                        </button>
                    )}
                    {isLeftSidebarOpen && (
                    <div className="detailed-map-info" style={{ 
                        paddingTop: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}>
                    {/* Tab Switcher */}
                    <div style={{
                        display: 'flex',
                        gap: '5px',
                        marginBottom: '15px',
                        borderBottom: '2px solid #00ff00',
                        paddingBottom: '10px'
                    }}>
                        <button
                            onClick={() => setLeftSidebarTab('zone')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: leftSidebarTab === 'zone' ? 'linear-gradient(135deg, #00ff00, #00aa00)' : '#2a2a2a',
                                border: leftSidebarTab === 'zone' ? '2px solid #00ff00' : '2px solid #555',
                                color: leftSidebarTab === 'zone' ? '#000' : '#888',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9em',
                                fontFamily: 'VT323, monospace',
                                transition: 'all 0.2s',
                                boxShadow: leftSidebarTab === 'zone' ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (leftSidebarTab !== 'zone') {
                                    e.currentTarget.style.background = '#3a3a3a';
                                    e.currentTarget.style.color = '#aaa';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (leftSidebarTab !== 'zone') {
                                    e.currentTarget.style.background = '#2a2a2a';
                                    e.currentTarget.style.color = '#888';
                                }
                            }}
                        >
                            Zone
                        </button>
                        <button
                            onClick={() => setLeftSidebarTab('room')}
                            disabled={!selectedRoom}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: leftSidebarTab === 'room' ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#2a2a2a',
                                border: leftSidebarTab === 'room' ? '2px solid #FFD700' : '2px solid #555',
                                color: leftSidebarTab === 'room' ? '#000' : (selectedRoom ? '#888' : '#444'),
                                borderRadius: '5px',
                                cursor: selectedRoom ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold',
                                fontSize: '0.9em',
                                fontFamily: 'VT323, monospace',
                                transition: 'all 0.2s',
                                boxShadow: leftSidebarTab === 'room' ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
                                opacity: selectedRoom ? 1 : 0.5
                            }}
                            onMouseEnter={(e) => {
                                if (leftSidebarTab !== 'room' && selectedRoom) {
                                    e.currentTarget.style.background = '#3a3a3a';
                                    e.currentTarget.style.color = '#aaa';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (leftSidebarTab !== 'room' && selectedRoom) {
                                    e.currentTarget.style.background = '#2a2a2a';
                                    e.currentTarget.style.color = '#888';
                                }
                            }}
                        >
                            🚪 Room
                        </button>
                        <button
                            onClick={() => setLeftSidebarTab('tools')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: leftSidebarTab === 'tools' ? 'linear-gradient(135deg, #00FFFF, #0088AA)' : '#2a2a2a',
                                border: leftSidebarTab === 'tools' ? '2px solid #00FFFF' : '2px solid #555',
                                color: leftSidebarTab === 'tools' ? '#000' : '#888',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9em',
                                fontFamily: 'VT323, monospace',
                                transition: 'all 0.2s',
                                boxShadow: leftSidebarTab === 'tools' ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (leftSidebarTab !== 'tools') {
                                    e.currentTarget.style.background = '#3a3a3a';
                                    e.currentTarget.style.color = '#aaa';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (leftSidebarTab !== 'tools') {
                                    e.currentTarget.style.background = '#2a2a2a';
                                    e.currentTarget.style.color = '#888';
                                }
                            }}
                        >
                            🔧 Tools
                        </button>
                    </div>

                    {/* ZONE TAB */}
                    {leftSidebarTab === 'zone' && (
                    <>
                    {/* Details Section */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        background: '#0a0a0a',
                        border: '2px solid #00ff00',
                        borderRadius: '5px',
                        flex: '0 0 auto'
                    }}>
                        <h4 style={{ 
                            color: '#00ff00', 
                            marginTop: 0, 
                            marginBottom: '15px',
                            fontSize: '1.1em',
                            borderBottom: '1px solid #00ff00',
                            paddingBottom: '8px',
                            textAlign: 'center'
                        }}>Details:</h4>
                        
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px' 
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '5px 0',
                                borderBottom: '1px solid #333'
                            }}>
                                <span style={{ color: '#888', fontSize: '0.95em' }}>Total Rooms:</span>
                                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{zoneData.totalRooms}</span>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '5px 0',
                                borderBottom: '1px solid #333'
                            }}>
                                <span style={{ color: '#888', fontSize: '0.95em' }}>This Level:</span>
                                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{currentLevelRooms.length}</span>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '5px 0',
                                borderBottom: '1px solid #333'
                            }}>
                                <span style={{ color: '#888', fontSize: '0.95em' }}>Grid Size:</span>
                                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                                    {zoneData.gridSize.width} × {zoneData.gridSize.height}
                                </span>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '5px 0',
                                borderBottom: '1px solid #333'
                            }}>
                                <span style={{ color: '#888', fontSize: '0.95em' }}>Total NPCs:</span>
                                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{totalNpcs}</span>
                            </div>
                            {zoneData.gridSize.levels > 1 && (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    padding: '5px 0'
                                }}>
                                    <span style={{ color: '#888', fontSize: '0.95em' }}>Levels:</span>
                                    <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{zoneData.gridSize.levels}</span>
                                </div>
                            )}
                        </div>
                    </div>

                {/* Zone Navigation */}
                {connectedZones.length > 0 && onNavigateToZone && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        background: 'linear-gradient(135deg, #0a2a2a, #2a1a1a)',
                        border: '2px solid #00ffff',
                        borderRadius: '5px',
                        flex: '1 1 auto',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px'
                        }}>
                            <h4 style={{ 
                                color: '#00ffff', 
                                margin: 0,
                                fontSize: '1em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '1.2em' }}>🚪</span>
                                <span>Connected Zones ({connectedZones.length})</span>
                            </h4>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px',
                            overflowY: 'auto',
                            flex: '1 1 auto',
                            minHeight: 0,
                            paddingRight: '5px'
                        }}>
                                {connectedZones.map(zone => {
                                    // Direction emoji/arrow map
                                    const directionDisplay = {
                                        'NORTH': { emoji: '⬆️', arrow: '↑', label: 'N', color: '#00ffff' },
                                        'SOUTH': { emoji: '⬇️', arrow: '↓', label: 'S', color: '#00ffff' },
                                        'EAST': { emoji: '➡️', arrow: '→', label: 'E', color: '#00ffff' },
                                        'WEST': { emoji: '⬅️', arrow: '←', label: 'W', color: '#00ffff' },
                                        'UP': { emoji: '⏫', arrow: '⇧', label: 'UP', color: '#ffaa00' },
                                        'DOWN': { emoji: '⏬', arrow: '⇩', label: 'DOWN', color: '#ff00ff' },
                                        '?': { emoji: '❓', arrow: '?', label: '?', color: '#888' }
                                    };
                                    
                                    const dirInfo = directionDisplay[zone.direction] || directionDisplay['?'];
                                    const isHighlighted = highlightedExitZone === zone.name;
                                    
                                    // Count exit rooms on current floor
                                    const exitRoomsOnThisFloor = zoneData.rooms.filter(room => 
                                        room.isZoneExit && 
                                        room.exitToZone === zone.name && 
                                        room.position.z === currentLevel
                                    ).length;
                                    
                                    // Count exit rooms on all floors
                                    const totalExitRooms = zoneData.rooms.filter(room => 
                                        room.isZoneExit && 
                                        room.exitToZone === zone.name
                                    ).length;
                                    
                                    // Get unique floor levels with exits to this zone
                                    const exitFloors = [...new Set(
                                        zoneData.rooms
                                            .filter(room => room.isZoneExit && room.exitToZone === zone.name)
                                            .map(room => room.position.z)
                                    )].sort((a, b) => b - a);
                                    
                                    return (
                                        <div key={zone.name} style={{ 
                                            background: isHighlighted ? 'rgba(255, 255, 0, 0.1)' : 'transparent',
                                            border: isHighlighted ? '2px solid #ffff00' : '2px solid transparent',
                                            borderRadius: '5px',
                                            padding: isHighlighted ? '8px' : '0',
                                            marginBottom: '8px',
                                            transition: 'all 0.2s'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: exitFloors.length > 0 ? '8px' : '0'
                                            }}>
                                                <button
                                                    onClick={() => onNavigateToZone(zone.name)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        background: '#0a0a0a',
                                                        border: `2px solid ${dirInfo.color}`,
                                                        color: dirInfo.color,
                                                        fontSize: '0.9em',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        borderRadius: '5px',
                                                        transition: 'all 0.2s',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = dirInfo.color;
                                                        e.currentTarget.style.color = '#000';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#0a0a0a';
                                                        e.currentTarget.style.color = dirInfo.color;
                                                    }}
                                                    title={`Travel ${zone.direction} to ${zone.name}`}
                                                >
                                                    <div style={{
                                                        background: `${dirInfo.color}33`,
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        minWidth: '40px',
                                                        textAlign: 'center',
                                                        fontWeight: 'bold',
                                                        border: `1px solid ${dirInfo.color}`
                                                    }}>
                                                        [{dirInfo.label}]
                                                    </div>
                                                    <span style={{ fontSize: '1.2em' }}>{dirInfo.emoji}</span>
                                                    <span style={{ flex: 1 }}>{zone.name}</span>
                                                </button>
                                                
                                                {totalExitRooms > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            if (highlightedExitZone === zone.name) {
                                                                handleClearHighlight();
                                                            } else {
                                                                handleHighlightExit(zone.name);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '10px 12px',
                                                            background: isHighlighted ? '#ffff00' : '#1a1a1a',
                                                            border: '2px solid #ffff00',
                                                            color: isHighlighted ? '#000' : '#ffff00',
                                                            fontSize: '0.9em',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            borderRadius: '5px',
                                                            transition: 'all 0.2s',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isHighlighted) {
                                                                e.currentTarget.style.background = '#ffff00';
                                                                e.currentTarget.style.color = '#000';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isHighlighted) {
                                                                e.currentTarget.style.background = '#1a1a1a';
                                                                e.currentTarget.style.color = '#ffff00';
                                                            }
                                                        }}
                                                        title={`Show entrance${totalExitRooms > 1 ? 's' : ''} to ${zone.name}`}
                                                    >
                                                        {isHighlighted ? 'Hide' : 'Show'} ({totalExitRooms})
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Floor information for vertical exits */}
                                            {exitFloors.length > 0 && (zone.direction === 'UP' || zone.direction === 'DOWN') && (
                                                <div style={{
                                                    fontSize: '0.85em',
                                                    color: '#888',
                                                    paddingLeft: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <span style={{ color: '#aaa' }}>Exits on floors:</span>
                                                    {exitFloors.map(floorLevel => (
                                                        <button
                                                            key={floorLevel}
                                                            onClick={() => {
                                                                setCurrentLevel(floorLevel);
                                                                handleHighlightExit(zone.name);
                                                            }}
                                                            style={{
                                                                padding: '3px 8px',
                                                                background: currentLevel === floorLevel ? dirInfo.color : '#1a1a1a',
                                                                border: `1px solid ${dirInfo.color}`,
                                                                color: currentLevel === floorLevel ? '#000' : dirInfo.color,
                                                                fontSize: '0.9em',
                                                                fontWeight: currentLevel === floorLevel ? 'bold' : 'normal',
                                                                cursor: 'pointer',
                                                                borderRadius: '3px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (currentLevel !== floorLevel) {
                                                                    e.currentTarget.style.background = `${dirInfo.color}33`;
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (currentLevel !== floorLevel) {
                                                                    e.currentTarget.style.background = '#1a1a1a';
                                                                }
                                                            }}
                                                            title={`Go to floor ${floorLevel} and show entrance`}
                                                        >
                                                            Floor {floorLevel}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Current floor indicator */}
                                            {exitRoomsOnThisFloor > 0 && (
                                                <div style={{
                                                    fontSize: '0.8em',
                                                    color: '#00ff00',
                                                    paddingLeft: '12px',
                                                    marginTop: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    ✓ {exitRoomsOnThisFloor} entrance{exitRoomsOnThisFloor > 1 ? 's' : ''} on current floor
                                                </div>
                                            )}
                                        </div>
                                    );
                                                })}
                        </div>
                    </div>
                )}

                {/* Floor Navigation at bottom */}
                {zoneData.gridSize.levels > 1 && (
                    <div style={{ 
                        marginBottom: '10px',
                        padding: '15px', 
                        backgroundColor: '#0a0a0a', 
                        border: '2px solid #00ff00',
                        borderRadius: '5px',
                        flex: '0 0 auto'
                    }}>
                        <h4 style={{ 
                            color: '#00ff00', 
                            marginTop: 0,
                            marginBottom: '8px', 
                            fontSize: '1.1em',
                            borderBottom: '1px solid #00ff00',
                            paddingBottom: '8px',
                            textAlign: 'center'
                        }}>
                            Floor Navigation:
                        </h4>
                        <div style={{ 
                            fontSize: '0.8em', 
                            color: '#888', 
                            textAlign: 'center',
                            marginBottom: '12px'
                        }}>
                            [PgUp/PgDn]
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <button 
                                onClick={() => setCurrentLevel(Math.min(zoneData.gridSize.levels - 1, currentLevel + 1))}
                                disabled={currentLevel === zoneData.gridSize.levels - 1}
                                style={{ 
                                    padding: '10px 15px',
                                    background: currentLevel === zoneData.gridSize.levels - 1 ? '#333' : '#00ff00',
                                    color: currentLevel === zoneData.gridSize.levels - 1 ? '#666' : '#000',
                                    border: 'none',
                                    borderRadius: '3px',
                                    fontWeight: 'bold',
                                    fontSize: '0.95em',
                                    cursor: currentLevel === zoneData.gridSize.levels - 1 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span>⬆ Up</span>
                                <span style={{ 
                                    fontSize: '0.8em', 
                                    opacity: 0.7,
                                    fontWeight: 'normal'
                                }}>
                                    [PgUp]
                                </span>
                            </button>
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '12px',
                                background: '#1a1a1a',
                                borderRadius: '3px',
                                border: '1px solid #00ff00'
                            }}>
                                <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '1.2em', marginBottom: '5px' }}>
                                    Level: {zoneData.bounds.minZ + currentLevel}
                                </div>
                                <div style={{ fontSize: '0.85em', color: '#888' }}>
                                    {currentLevel === 0 && '(Bottom)'}
                                    {currentLevel === zoneData.gridSize.levels - 1 && '(Top)'}
                                    {currentLevel > 0 && currentLevel < zoneData.gridSize.levels - 1 && '(Middle)'}
                                </div>
                            </div>
                            <button 
                                onClick={() => setCurrentLevel(Math.max(0, currentLevel - 1))}
                                disabled={currentLevel === 0}
                                style={{ 
                                    padding: '10px 15px',
                                    background: currentLevel === 0 ? '#333' : '#00ff00',
                                    color: currentLevel === 0 ? '#666' : '#000',
                                    border: 'none',
                                    borderRadius: '3px',
                                    fontWeight: 'bold',
                                    fontSize: '0.95em',
                                    cursor: currentLevel === 0 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span>⬇ Down</span>
                                <span style={{ 
                                    fontSize: '0.8em', 
                                    opacity: 0.7,
                                    fontWeight: 'normal'
                                }}>
                                    [PgDn]
                                </span>
                            </button>
                        </div>
                    </div>
                )}
                </>
                )}

                {/* ROOM TAB */}
                {leftSidebarTab === 'room' && selectedRoom && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Room Header */}
                        <div style={{
                            padding: '15px',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            border: '2px solid #FFD700',
                            borderRadius: '5px',
                            boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)'
                        }}>
                            <h4 style={{ 
                                color: '#000', 
                                marginTop: 0, 
                                marginBottom: '8px',
                                fontSize: '1.2em'
                            }}>
                                🚪 Room #{selectedRoom.id}
                            </h4>
                            <h3 style={{
                                color: '#000',
                                margin: 0,
                                fontSize: '1.4em',
                                fontWeight: 'bold'
                            }}>
                                {selectedRoom.name}
                            </h3>
                        </div>

                        {/* Room Description */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#00ff00', marginTop: 0, marginBottom: '10px' }}>
                                📖 Description:
                            </h4>
                            <p style={{ 
                                color: '#ccc', 
                                lineHeight: '1.6', 
                                margin: 0 
                            }}>
                                {selectedRoom.description}
                            </p>
                        </div>

                        {/* Room Details */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #00FFFF',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#00FFFF', marginTop: 0, marginBottom: '10px' }}>
                                Details:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95em' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#888' }}>Position:</span>
                                    <span style={{ color: '#00FFFF' }}>
                                        ({selectedRoom.originalPosition.x}, {selectedRoom.originalPosition.y}, {selectedRoom.originalPosition.z})
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#888' }}>Terrain:</span>
                                    <span style={{ color: '#00FFFF' }}>{selectedRoom.terrainColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Zone Exit Info */}
                        {selectedRoom.isZoneExit && (
                            <div style={{
                                padding: '15px',
                                background: 'linear-gradient(135deg, #00FFFF22, #0088AA22)',
                                border: '2px solid #00FFFF',
                                borderRadius: '5px'
                            }}>
                                <h4 style={{ color: '#00FFFF', marginTop: 0, marginBottom: '10px' }}>
                                    🚪 Zone Exit:
                                </h4>
                                <p style={{ color: '#00FFFF', margin: 0, fontSize: '1.1em', fontWeight: 'bold' }}>
                                    → {selectedRoom.exitToZone || 'Unknown destination'}
                                </p>
                            </div>
                        )}

                        {/* NPCs in Room */}
                        {selectedRoom.npcs && selectedRoom.npcs.length > 0 && (
                            <div style={{
                                padding: '15px',
                                background: '#0a0a0a',
                                border: '2px solid #ff6b6b',
                                borderRadius: '5px'
                            }}>
                                <h4 style={{ color: '#ff6b6b', marginTop: 0, marginBottom: '10px' }}>
                                    👹 NPCs in this Room:
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none' }}>
                                    {selectedRoom.npcs.map((npc, idx) => (
                                        <li key={idx} style={{ 
                                            color: '#ff6b6b', 
                                            marginBottom: '8px',
                                            padding: '8px',
                                            background: '#1a1a1a',
                                            borderRadius: '3px',
                                            border: '1px solid #ff6b6b'
                                        }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                👹 {npc.name}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#888' }}>
                                                Respawn: {npc.respawnRate}s
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Room Exits */}
                        {selectedRoom.exits && Object.keys(selectedRoom.exits).length > 0 && (
                            <div style={{
                                padding: '15px',
                                background: '#0a0a0a',
                                border: '2px solid #FFD700',
                                borderRadius: '5px'
                            }}>
                                <h4 style={{ color: '#FFD700', marginTop: 0, marginBottom: '10px' }}>
                                    🧭 Exits:
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                                    {Object.entries(selectedRoom.exits).map(([direction, roomId]) => (
                                        <div key={direction} style={{
                                            padding: '8px 12px',
                                            background: '#1a1a1a',
                                            border: '1px solid #FFD700',
                                            borderRadius: '3px',
                                            textAlign: 'center',
                                            color: '#FFD700',
                                            fontWeight: 'bold'
                                        }}>
                                            {direction.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                                {Object.keys(selectedRoom.exits).length === 0 && (
                                    <p style={{ color: '#888', margin: 0, textAlign: 'center' }}>
                                        No exits available
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TOOLS TAB */}
                {leftSidebarTab === 'tools' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Tools Header */}
                        <div style={{
                            padding: '15px',
                            background: 'linear-gradient(135deg, #00FFFF, #0088AA)',
                            border: '2px solid #00FFFF',
                            borderRadius: '5px',
                            boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)'
                        }}>
                            <h4 style={{ 
                                color: '#000', 
                                margin: 0,
                                fontSize: '1.3em',
                                fontWeight: 'bold'
                            }}>
                                🔧 Tools & Tips
                            </h4>
                        </div>

                        {/* Room Focus Mode Toggle */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #FFD700',
                            borderRadius: '5px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ color: '#FFD700', margin: 0 }}>
                                    🔒 Room Focus Mode:
                                </h4>
                                <label style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    width: '50px',
                                    height: '24px'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={roomFocusMode}
                                        onChange={(e) => setRoomFocusMode(e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: roomFocusMode ? '#FFD700' : '#ccc',
                                        transition: '0.4s',
                                        borderRadius: '24px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '""',
                                            height: '18px',
                                            width: '18px',
                                            left: roomFocusMode ? '29px' : '3px',
                                            bottom: '3px',
                                            background: 'white',
                                            transition: '0.4s',
                                            borderRadius: '50%'
                                        }}></span>
                                    </span>
                                </label>
                            </div>
                            <p style={{ color: '#888', margin: 0, fontSize: '0.85em', lineHeight: '1.5' }}>
                                When enabled, selecting a room will dim all other rooms and lock focus on your selection
                            </p>
                        </div>

                        {/* Icon Size Control */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #FF00FF',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#FF00FF', marginTop: 0, marginBottom: '10px' }}>
                                🎨 Icon Size:
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#888', fontSize: '0.9em' }}>Small</span>
                                <input
                                    type="range"
                                    min="6"
                                    max="12"
                                    value={iconSize}
                                    onChange={(e) => setIconSize(parseInt(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ color: '#888', fontSize: '0.9em' }}>Large</span>
                            </div>
                        </div>

                        {/* Navigation Tips */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#00ff00', marginTop: 0, marginBottom: '10px' }}>
                                Navigation:
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', lineHeight: '1.8' }}>
                                <li>Click any room to view details</li>
                                <li>Use mouse wheel to zoom in/out</li>
                                <li>Click and drag to pan the map</li>
                                <li>Use PageUp/PageDown to change floors</li>
                                <li>Click yellow arrows on selected rooms to navigate</li>
                            </ul>
                        </div>

                        {/* Room Tips */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #FFD700',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#FFD700', marginTop: 0, marginBottom: '10px' }}>
                                🚪 Room Tips:
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', lineHeight: '1.8' }}>
                                <li>Hover over rooms to see quick info</li>
                                <li>Click to lock focus and view details</li>
                                <li>Red dots indicate NPCs/mobs</li>
                                <li>Cyan icons indicate zone exits</li>
                                <li>Room colors represent terrain types</li>
                            </ul>
                        </div>

                        {/* Map Legend */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #00FFFF',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#00FFFF', marginTop: 0, marginBottom: '10px' }}>
                                📋 Legend:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#FFD700', border: '3px solid #FFD700', borderRadius: '2px' }}></div>
                                    <span style={{ color: '#ccc' }}>Selected Room</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '20px', height: '20px', background: 'transparent', border: '3px solid #00FFFF', borderRadius: '2px' }}></div>
                                    <span style={{ color: '#ccc' }}>Hovered Room</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '10px', height: '10px', background: '#FF0000', border: '2px solid #FFF', borderRadius: '50%' }}></div>
                                    <span style={{ color: '#ccc' }}>NPCs/Mobs</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '10px', height: '14px', background: '#00FFFF', border: '1px solid #FFF' }}></div>
                                    <span style={{ color: '#ccc' }}>Zone Exit</span>
                                </div>
                            </div>
                        </div>

                        {/* Keyboard Shortcuts */}
                        <div style={{
                            padding: '15px',
                            background: '#0a0a0a',
                            border: '2px solid #FF00FF',
                            borderRadius: '5px'
                        }}>
                            <h4 style={{ color: '#FF00FF', marginTop: 0, marginBottom: '10px' }}>
                                ⌨️ Keyboard Shortcuts:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9em' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#1a1a1a', borderRadius: '3px' }}>
                                    <span style={{ color: '#888' }}>PageUp</span>
                                    <span style={{ color: '#ccc' }}>Go up one floor</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#1a1a1a', borderRadius: '3px' }}>
                                    <span style={{ color: '#888' }}>PageDown</span>
                                    <span style={{ color: '#ccc' }}>Go down one floor</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#1a1a1a', borderRadius: '3px' }}>
                                    <span style={{ color: '#888' }}>Escape</span>
                                    <span style={{ color: '#ccc' }}>Close map viewer</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
                )}
            </div>

            {/* CENTER - Large Map Canvas */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                position: 'relative',
                height: '100%',
                marginLeft: isLeftSidebarOpen ? '0' : '0',
                marginRight: isWikiOpen ? '400px' : '50px',
                transition: 'margin-left 0.3s ease, margin-right 0.3s ease'
            }}>
                {/* Focus Mode Banner - shows when room is selected and focus mode is on */}
                    {selectedRoom && roomFocusMode && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000,
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            border: '2px solid #FFD700',
                            borderRadius: '5px',
                            padding: '12px 24px',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
                            minWidth: '300px',
                            textAlign: 'center',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            <div style={{
                                color: '#000',
                                fontSize: '1.1em',
                                fontWeight: 'bold',
                                fontFamily: 'VT323, monospace',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '1.3em' }}>🔒</span>
                                <span>FOCUS LOCKED ON ROOM #{selectedRoom.id}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Fixed Hover Tooltip - appears at top center of map */}
                    {hoveredRoom && !selectedRoom && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000,
                            background: 'rgba(0, 0, 0, 0.95)',
                            border: '2px solid #00FFFF',
                            borderRadius: '5px',
                            padding: '12px 20px',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 20px rgba(0, 255, 255, 0.5)',
                            minWidth: '300px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                color: '#00FFFF',
                                fontSize: '1.2em',
                                fontWeight: 'bold',
                                fontFamily: 'VT323, monospace',
                                marginBottom: '4px'
                            }}>
                                Room #{hoveredRoom.id}
                            </div>
                            <div style={{
                                color: '#FFFFFF',
                                fontSize: '1em',
                                fontFamily: 'VT323, monospace'
                            }}>
                                {hoveredRoom.name}
                            </div>
                            {hoveredRoom.npcs && hoveredRoom.npcs.length > 0 && (
                                <div style={{
                                    color: '#ff6b6b',
                                    fontSize: '0.9em',
                                    marginTop: '6px',
                                    fontFamily: 'VT323, monospace'
                                }}>
                                    👹 {hoveredRoom.npcs.length} NPC{hoveredRoom.npcs.length > 1 ? 's' : ''}
                                </div>
                            )}
                            {hoveredRoom.isZoneExit && (
                                <div style={{
                                    color: '#00FFFF',
                                    fontSize: '0.9em',
                                    marginTop: '6px',
                                    fontFamily: 'VT323, monospace'
                                }}>
                                    🚪 Zone Exit
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Map Canvas - takes full available space */}
                    <div 
                        ref={mapCanvasRef}
                        className="detailed-map-canvas" 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            overflow: 'auto',
                            background: '#0a0a0a',
                            cursor: isPanning ? 'grabbing' : 'grab',
                            userSelect: 'none'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onWheel={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const canvas = mapCanvasRef.current;
                            if (!canvas) return;
                            
                            // Get cursor position relative to canvas
                            const rect = canvas.getBoundingClientRect();
                            const cursorX = e.clientX - rect.left;
                            const cursorY = e.clientY - rect.top;
                            
                            // Calculate world coordinates under cursor before zoom
                            const worldX = (canvas.scrollLeft + cursorX) / zoom;
                            const worldY = (canvas.scrollTop + cursorY) / zoom;
                            
                            // Smaller increment for smoother zooming (0.05 instead of 0.1)
                            const delta = e.deltaY > 0 ? -0.05 : 0.05;
                            const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
                            
                            // Calculate new scroll position to keep cursor point fixed
                            const newScrollLeft = worldX * newZoom - cursorX;
                            const newScrollTop = worldY * newZoom - cursorY;
                            
                            setZoom(newZoom);
                            
                            // Apply the new scroll position after a brief delay to ensure zoom is applied
                            requestAnimationFrame(() => {
                                canvas.scrollLeft = newScrollLeft;
                                canvas.scrollTop = newScrollTop;
                            });
                        }}
                    >
                        <div style={{ 
                            // Add padding to ensure there's always scrollable space
                            padding: '50vh 50vw',
                            display: 'inline-block',
                            pointerEvents: isPanning ? 'none' : 'auto'
                        }}>
                            <div style={{
                                width: `${zoneData.gridSize.width * cellSize * zoom}px`,
                                height: `${zoneData.gridSize.height * cellSize * zoom}px`,
                                display: 'inline-block'
                            }}>
                                {renderGrid()}
                            </div>
                        </div>
                    </div>

                {/* Selected room details - Fixed bottom panel */}
                {selectedRoom && !isInfoPanelCollapsed && (
                    <div className="map-description" style={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: 'rgba(26, 26, 26, 0.98)', 
                        borderTop: '2px solid #d4af37',
                        padding: '15px 20px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.5)',
                        zIndex: 100,
                        transition: 'bottom 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <h4 style={{ color: '#d4af37', margin: 0 }}>
                                        Room #{selectedRoom.id}: {selectedRoom.name}
                                    </h4>
                                    {roomFocusMode && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '4px 10px',
                                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                            borderRadius: '3px',
                                            fontSize: '0.75em',
                                            fontWeight: 'bold',
                                            color: '#000',
                                            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                                        }}>
                                            <span>🔒</span>
                                            <span>FOCUSED</span>
                                        </div>
                                    )}
                                </div>
                                <p style={{ 
                                    fontSize: '0.9em', 
                                    lineHeight: '1.6', 
                                    color: '#ccc',
                                    marginBottom: '10px'
                                }}>
                                    {selectedRoom.description}
                                </p>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85em' }}>
                                    <span style={{ color: '#888' }}>
                                        Position: ({selectedRoom.originalPosition.x}, {selectedRoom.originalPosition.y}, {selectedRoom.originalPosition.z})
                                    </span>
                                    <span style={{ color: '#888' }}>
                                        Terrain: {selectedRoom.terrainColor}
                                    </span>
                                </div>
                                {selectedRoom.isZoneExit && (
                                    <div style={{ 
                                        marginTop: '10px', 
                                        padding: '8px', 
                                        backgroundColor: '#0a2a2a',
                                        borderLeft: '3px solid #00ffff',
                                        fontSize: '0.9em'
                                    }}>
                                        🚪 Zone Exit → {selectedRoom.exitToZone || 'Unknown destination'}
                                    </div>
                                )}
                                {selectedRoom.npcs.length > 0 && (
                                    <div style={{ 
                                        marginTop: '10px',
                                        padding: '8px',
                                        backgroundColor: '#2a1a1a',
                                        borderLeft: '3px solid #ff6b6b'
                                    }}>
                                        <strong style={{ color: '#ff6b6b' }}>NPCs in this room:</strong>
                                        <ul style={{ 
                                            margin: '5px 0 0 0', 
                                            paddingLeft: '20px',
                                            listStyle: 'none'
                                        }}>
                                            {selectedRoom.npcs.map((npc, idx) => {
                                                // Clean NPC name to match mob data
                                                const cleanNpcName = (name) => {
                                                    if (!name) return '';
                                                    return name.replace(/\\cf\d+/gi, '').replace(/\\cf\w+/gi, '').trim().replace(/\.$/, '');
                                                };
                                                
                                                const cleanedName = cleanNpcName(npc.name);
                                                const mobData = loadedMobs?.find(m => {
                                                    const cleanMobName = (name) => {
                                                        if (!name) return '';
                                                        return name.replace(/\\cf\d+/gi, '').replace(/\\cf\w+/gi, '').trim().replace(/\.$/, '');
                                                    };
                                                    return cleanMobName(m.Name) === cleanedName;
                                                });
                                                
                                                return (
                                                    <li key={idx} style={{ 
                                                        fontSize: '0.9em', 
                                                        marginTop: '5px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '8px'
                                                    }}>
                                                        <span>👹 {npc.name} (Respawn: {npc.respawnRate}s)</span>
                                                        {mobData && onNavigateToMob && (
                                                            <button
                                                                onClick={() => onNavigateToMob({ Id: mobData.Id })}
                                                                style={{
                                                                    padding: '2px 8px',
                                                                    fontSize: '0.85em',
                                                                    backgroundColor: '#ff6b6b',
                                                                    color: '#fff',
                                                                    border: '1px solid #ff4444',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap',
                                                                    flexShrink: 0
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.backgroundColor = '#ff4444';
                                                                    e.target.style.transform = 'scale(1.05)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.backgroundColor = '#ff6b6b';
                                                                    e.target.style.transform = 'scale(1)';
                                                                }}
                                                                title="View in Mobs page"
                                                            >
                                                                View Mob
                                                            </button>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button 
                                    onClick={() => setIsInfoPanelCollapsed(true)}
                                    style={{ 
                                        padding: '5px 10px',
                                        fontSize: '0.9em',
                                        backgroundColor: '#555',
                                        color: '#fff',
                                        border: '1px solid #777',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                    title="Collapse panel"
                                >
                                    ▼
                                </button>
                                <button 
                                    onClick={() => setSelectedRoom(null)}
                                    style={{ 
                                        padding: '5px 10px',
                                        fontSize: '0.9em',
                                        backgroundColor: '#333',
                                        color: '#fff',
                                        border: '1px solid #555',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Collapsed panel indicator - Only show when room selected and collapsed */}
                {selectedRoom && isInfoPanelCollapsed && (
                    <button
                        onClick={() => setIsInfoPanelCollapsed(false)}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '8px 20px',
                            background: 'rgba(212, 175, 55, 0.95)',
                            border: '2px solid #d4af37',
                            borderBottom: 'none',
                            borderRadius: '8px 8px 0 0',
                            color: '#000',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            zIndex: 100,
                            fontSize: '0.9em',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.5)'
                        }}
                        title="Expand room details"
                    >
                        ▲ Room #{selectedRoom.id}: {selectedRoom.name}
                    </button>
                )}

                {/* Zone info when no room selected - Fixed bottom panel */}
                {!selectedRoom && (
                    <div className="map-description" style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.5)',
                        borderTop: '2px solid #00ff00',
                        zIndex: 100,
                        transition: 'all 0.3s ease'
                    }}>
                        {/* Header with toggle button */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                        onClick={() => setShowZoneInfo(!showZoneInfo)}
                        >
                            <h4 style={{ color: '#00ff00', margin: 0 }}>
                                💡 Zone Information & Tips
                            </h4>
                            <button
                                style={{
                                    background: 'transparent',
                                    border: '2px solid #00ff00',
                                    color: '#00ff00',
                                    padding: '5px 15px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#00ff00';
                                    e.target.style.color = '#000';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = '#00ff00';
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowZoneInfo(!showZoneInfo);
                                }}
                            >
                                {showZoneInfo ? '▼ Hide' : '▲ Show'}
                            </button>
                        </div>
                        
                        {/* Collapsible content */}
                        {showZoneInfo && (
                            <div style={{
                                padding: '15px 20px',
                                borderTop: '1px solid rgba(0, 255, 0, 0.2)',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px'
                            }}>
                                {/* Left Column - Info & Tips */}
                                <div>
                                    <h5 style={{ color: '#00ff00', marginTop: 0, marginBottom: '10px', fontSize: '1em' }}>
                                        📋 Information:
                                    </h5>
                                    <p style={{ 
                                        marginBottom: '10px', 
                                        fontSize: '1em',
                                        padding: '8px 12px',
                                        background: '#1a1a1a',
                                        border: '1px solid #00ff00',
                                        borderRadius: '3px'
                                    }}>
                                        <span style={{ color: '#ffff00', fontWeight: 'bold' }}>Zone Name:</span> 
                                        <span style={{ color: '#00ffff', marginLeft: '8px' }}>{zoneData.zoneName}</span>
                                    </p>
                                    <p style={{ marginBottom: '10px', fontSize: '0.9em' }}>
                                        This is real MUD room data from the game server. 
                                        Click on any room to see detailed information including NPCs, exits, and descriptions.
                                    </p>
                                    {zoneData.gridSize.levels > 1 && (
                                        <p style={{ margin: '10px 0', color: '#00ffff', fontSize: '0.9em' }}>
                                            ⬆ This zone has multiple levels. Use the level selector in the left sidebar.
                                        </p>
                                    )}
                                    <p style={{ margin: '10px 0', color: '#FFD700', fontSize: '0.9em' }}>
                                        💡 <strong>Navigation:</strong> Select a room and click on the yellow exit arrows to move between rooms!
                                    </p>
                                    <p style={{ margin: '10px 0', color: '#00AAFF', fontSize: '0.9em' }}>
                                        🖱️ <strong>Tip:</strong> Click and drag on the map to pan around!
                                    </p>
                                    <p style={{ margin: '10px 0 0 0', color: '#00FFAA', fontSize: '0.9em' }}>
                                        🔍 <strong>Zoom:</strong> Use your mouse scroll wheel to zoom in/out!
                                    </p>
                                    {highlightedMob && (
                                        <p style={{ margin: '10px 0 0 0', color: '#FF00FF', fontWeight: 'bold', fontSize: '0.9em' }}>
                                            🔍 <strong>Highlighting:</strong> {highlightedMob} ({highlightedRooms.size} {highlightedRooms.size === 1 ? 'room' : 'rooms'})
                                        </p>
                                    )}
                                </div>

                                {/* Right Column - Legend */}
                                <div>
                                    <h5 style={{ color: '#00ff00', marginTop: 0, marginBottom: '10px', fontSize: '1em' }}>
                                        Legend:
                                    </h5>
                                    <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            fontSize: '0.85em'
                                        }}>
                                            <span style={{ 
                                                display: 'inline-block',
                                                width: '14px',
                                                height: '14px',
                                                backgroundColor: '#00BB00',
                                                border: '1px solid #00ff00',
                                                flexShrink: 0
                                            }}></span>
                                            <span style={{ color: '#ccc' }}>Room (terrain color)</span>
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            fontSize: '0.85em'
                                        }}>
                                            <span style={{ 
                                                color: '#FF0000', 
                                                fontSize: '1.2em',
                                                width: '14px',
                                                textAlign: 'center',
                                                flexShrink: 0
                                            }}>●</span>
                                            <span style={{ color: '#ccc' }}>NPCs</span>
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            fontSize: '0.85em'
                                        }}>
                                            <span style={{ 
                                                color: '#00FFFF', 
                                                fontSize: '1.2em',
                                                width: '14px',
                                                textAlign: 'center',
                                                flexShrink: 0
                                            }}>▭</span>
                                            <span style={{ color: '#ccc' }}>Zone Exit</span>
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            fontSize: '0.85em'
                                        }}>
                                            <span style={{ 
                                                color: '#FFFF00', 
                                                fontSize: '1.2em',
                                                width: '14px',
                                                textAlign: 'center',
                                                flexShrink: 0
                                            }}>━</span>
                                            <span style={{ color: '#ccc' }}>Exit (on click)</span>
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            fontSize: '0.85em'
                                        }}>
                                            <span style={{ 
                                                color: '#00FFFF', 
                                                fontSize: '1.2em',
                                                width: '14px',
                                                textAlign: 'center',
                                                flexShrink: 0
                                            }}>⬆⬇</span>
                                            <span style={{ color: '#ccc' }}>Up/Down</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Focus Mode Toggle */}
                                <div style={{ 
                                    marginTop: '15px',
                                    paddingTop: '15px',
                                    borderTop: '1px solid #00ff00'
                                }}>
                                    <h5 style={{ color: '#00ff00', marginTop: 0, marginBottom: '10px', fontSize: '1em' }}>
                                        🎯 Room Focus Mode
                                    </h5>
                                    <div
                                        onClick={() => setRoomFocusMode(!roomFocusMode)}
                                        style={{
                                            padding: '12px',
                                            background: roomFocusMode ? 'linear-gradient(135deg, #00ff00, #00aa00)' : '#2a2a2a',
                                            border: roomFocusMode ? '2px solid #00ff00' : '2px solid #555',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: roomFocusMode ? '0 0 15px rgba(0, 255, 0, 0.5)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            fontWeight: 'bold',
                                            fontSize: '0.95em',
                                            color: roomFocusMode ? '#000' : '#666'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!roomFocusMode) {
                                                e.currentTarget.style.background = '#3a3a3a';
                                                e.currentTarget.style.color = '#888';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!roomFocusMode) {
                                                e.currentTarget.style.background = '#2a2a2a';
                                                e.currentTarget.style.color = '#666';
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: '1.3em' }}>
                                            {roomFocusMode ? '🔦' : '💡'}
                                        </span>
                                        <span>
                                            {roomFocusMode ? 'Focus Mode ON' : 'Focus Mode OFF'}
                                        </span>
                                    </div>
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '8px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '3px',
                                        color: '#888',
                                        fontSize: '0.85em',
                                        textAlign: 'center'
                                    }}>
                                        {roomFocusMode 
                                            ? '✓ Dims other rooms when one is selected' 
                                            : '○ All rooms stay fully visible'}
                                    </div>
                                </div>

                                {/* Icon Size Control Section */}
                                <div style={{ 
                                    marginTop: '15px',
                                    paddingTop: '15px',
                                    borderTop: '1px solid #00ff00'
                                }}>
                                    <h5 style={{ color: '#00ff00', marginTop: 0, marginBottom: '10px', fontSize: '1em' }}>
                                        🔍 Icon Size: {Math.round(iconSize * 100)}%
                                    </h5>
                                    
                                    {/* Range Slider */}
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
                                            left: '0',
                                            width: `${((iconSize - 0.5) / 2.5) * 100}%`,
                                            height: '8px',
                                            background: 'linear-gradient(90deg, #00ff00, #00ffaa)',
                                            border: '2px solid #00ff00',
                                            borderRadius: '5px',
                                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                                        }} />
                                        
                                        {/* Icon Size Slider */}
                                        <input
                                            type="range"
                                            className="dual-range"
                                            min="0.5"
                                            max="3"
                                            step="0.25"
                                            value={iconSize}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setIconSize(parseFloat(e.target.value));
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
                                                cursor: 'pointer',
                                                zIndex: 5
                                            }}
                                            title="Adjust icon size"
                                        />
                                    </div>
                                    
                                    {/* Size Labels */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.9em',
                                        color: '#888',
                                        marginBottom: '10px'
                                    }}>
                                        <span>50%</span>
                                        <span>100%</span>
                                        <span>150%</span>
                                        <span>200%</span>
                                        <span>250%</span>
                                        <span>300%</span>
                                    </div>

                                    {/* Reset Button - Only shown when not default */}
                                    {iconSize !== 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIconSize(1);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 16px',
                                                background: '#ff6600',
                                                border: '2px solid #ff8800',
                                                color: '#000',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '0.9em',
                                                fontWeight: 'bold',
                                                transition: 'all 0.2s',
                                                marginBottom: '8px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#ff8800';
                                                e.target.style.boxShadow = '0 0 10px rgba(255, 102, 0, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#ff6600';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                            title="Reset to default size (100%)"
                                        >
                                            🔄 Reset to Default
                                        </button>
                                    )}
                                    
                                    <div style={{ 
                                        fontSize: '0.8em', 
                                        color: '#888', 
                                        textAlign: 'center'
                                    }}>
                                        Adjust the size of NPC and exit icons on the map
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Wiki Sidebar - Collapsible */}
            <div style={{
                position: 'fixed',
                right: '0',
                top: '80px',
                bottom: 0,
                width: isWikiOpen ? '400px' : '50px',
                zIndex: 10000,
                transition: 'width 0.3s ease',
                background: '#1a1a1a',
                borderLeft: '3px solid #00ff00',
                overflowX: 'hidden'
            }}>
                {/* Toggle Button - Positioned at sidebar edge */}
                {isWikiOpen ? (
                    <button
                        onClick={() => setIsWikiOpen(false)}
                        style={{
                            position: 'fixed',
                            right: '400px',
                            top: '110px',
                            background: '#00ff00',
                            color: '#000',
                            border: '2px solid #000',
                            borderRadius: '5px 0 0 5px',
                            width: '35px',
                            height: '50px',
                            cursor: 'pointer',
                            fontSize: '1.2em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10002,
                            boxShadow: '-2px 0 8px rgba(0, 255, 0, 0.5)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateX(-3px)';
                            e.target.style.boxShadow = '-4px 0 12px rgba(0, 255, 0, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateX(0)';
                            e.target.style.boxShadow = '-2px 0 8px rgba(0, 255, 0, 0.5)';
                        }}
                        title="Collapse sidebar"
                    >
                        ▶
                    </button>
                ) : (
                    <button
                        onClick={() => setIsWikiOpen(true)}
                        style={{
                            position: 'fixed',
                            right: '0',
                            top: '110px',
                            background: '#00ff00',
                            color: '#000',
                            border: '2px solid #000',
                            borderRadius: '5px 0 0 5px',
                            width: '35px',
                            height: '50px',
                            cursor: 'pointer',
                            fontSize: '1.2em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10002,
                            boxShadow: '-2px 0 8px rgba(0, 255, 0, 0.5)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateX(-3px)';
                            e.target.style.boxShadow = '-4px 0 12px rgba(0, 255, 0, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateX(0)';
                            e.target.style.boxShadow = '-2px 0 8px rgba(0, 255, 0, 0.5)';
                        }}
                        title="Expand sidebar"
                    >
                        ◀
                    </button>
                )}

                <WikiSidebar
                    zoneName={zoneData.zoneName}
                    zoneData={zoneData}
                    roomNpcs={selectedRoom ? selectedRoom.npcs : []}
                    isVisible={isWikiOpen}
                    onClose={() => setIsWikiOpen(false)}
                    onHighlightMob={handleHighlightMob}
                    onClearHighlight={handleClearHighlight}
                    onShowMobPath={handleShowMobPath}
                    onNavigateToMob={onNavigateToMob}
                    highlightedMob={highlightedMob}
                    currentFloor={currentLevel}
                />
            </div>
        </div>
        </div>
    );
}

export default DetailedMapView;

