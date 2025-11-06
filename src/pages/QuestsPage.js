import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function QuestsPage() {
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
            
            /* Markdown styling for quest details */
            .quest-markdown {
                color: #ccc;
                line-height: 2;
            }
            
            .quest-markdown p {
                margin: 1em 0;
            }
            
            .quest-markdown strong, .quest-markdown b {
                color: #ffff00;
                font-weight: bold;
            }
            
            .quest-markdown em, .quest-markdown i {
                color: #00aaff;
                font-style: italic;
            }
            
            .quest-markdown ul, .quest-markdown ol {
                padding-left: 25px;
                margin: 1em 0;
            }
            
            .quest-markdown li {
                margin: 0.6em 0;
            }
            
            .quest-markdown code {
                background: #2a2a2a;
                padding: 3px 8px;
                border-radius: 4px;
                color: #ff6600;
                font-family: 'VT323', monospace;
                font-size: 1.1em;
            }
            
            .quest-markdown h1, .quest-markdown h2, .quest-markdown h3 {
                color: #00ff00;
                margin: 1.2em 0 0.6em 0;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const [quests, setQuests] = useState([]);
    const [filteredQuests, setFilteredQuests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedFactions, setSelectedFactions] = useState([]);
    const [selectedNPCs, setSelectedNPCs] = useState([]);
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [minLevel, setMinLevel] = useState(0);
    const [maxLevel, setMaxLevel] = useState(150);
    const [showClasses, setShowClasses] = useState(false);
    const [showFactions, setShowFactions] = useState(false);
    const [showNPCs, setShowNPCs] = useState(false);
    const [hideChainQuests, setHideChainQuests] = useState(false);
    const [showQuestDialogue, setShowQuestDialogue] = useState(false);
    const itemsPerPage = 50;

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
                const mouseValue = mousePercent * 150;
                
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

    // Load quests data
    useEffect(() => {
        fetch('/GameData/Quests.json')
            .then(response => response.json())
            .then(data => {
                setQuests(data);
                setFilteredQuests(data);
                
                // Set all classes as selected by default
                const allClasses = [...new Set(
                    data.flatMap(quest => {
                        if (!quest.RequiredClass) return [];
                        return quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
                    })
                )].sort();
                setSelectedClasses(allClasses);
                
                // Set all factions as selected by default
                const allFactions = [...new Set(
                    data.map(quest => quest.RequiredClassFaction).filter(f => f && f.trim() !== '')
                )].sort();
                setSelectedFactions(allFactions);
                
                // Set all NPCs as selected by default
                const allNPCs = [...new Set(
                    data.map(quest => quest.NpcQuestGiver).filter(n => n && n.trim() !== '')
                )].sort();
                setSelectedNPCs(allNPCs);
                
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading quests:', error);
                setIsLoading(false);
            });
    }, []);

    // Filter and sort quests
    useEffect(() => {
        let filtered = [...quests];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(quest => {
                return quest.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    quest.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    quest.NpcQuestGiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    quest.RequiredClassFaction?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Class filter
        if (selectedClasses.length > 0) {
            const allClasses = [...new Set(
                quests.flatMap(quest => {
                    if (!quest.RequiredClass) return [];
                    return quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
                })
            )];
            if (selectedClasses.length < allClasses.length) {
                filtered = filtered.filter(quest => {
                    if (!quest.RequiredClass || quest.RequiredClass.trim() === '') return true;
                    const questClasses = quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
                    return questClasses.some(c => selectedClasses.includes(c));
                });
            }
        }

        // Faction filter
        if (selectedFactions.length > 0) {
            const allFactions = [...new Set(
                quests.map(quest => quest.RequiredClassFaction).filter(f => f && f.trim() !== '')
            )];
            if (selectedFactions.length < allFactions.length) {
                filtered = filtered.filter(quest => 
                    !quest.RequiredClassFaction || 
                    quest.RequiredClassFaction.trim() === '' ||
                    selectedFactions.includes(quest.RequiredClassFaction)
                );
            }
        }

        // NPC filter
        if (selectedNPCs.length > 0) {
            const allNPCs = [...new Set(
                quests.map(quest => quest.NpcQuestGiver).filter(n => n && n.trim() !== '')
            )];
            if (selectedNPCs.length < allNPCs.length) {
                filtered = filtered.filter(quest => 
                    !quest.NpcQuestGiver || 
                    quest.NpcQuestGiver.trim() === '' ||
                    selectedNPCs.includes(quest.NpcQuestGiver)
                );
            }
        }

        // Level filter
        filtered = filtered.filter(quest => {
            const questLevel = quest.Level || 0;
            return questLevel >= minLevel && questLevel <= maxLevel;
        });

        // Chain quest filter
        if (hideChainQuests) {
            filtered = filtered.filter(quest => 
                !quest.RequiredQuest || quest.RequiredQuest.trim() === ''
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.Name || '').localeCompare(b.Name || '');
                case 'level':
                    return (b.Level || 0) - (a.Level || 0);
                case 'experience':
                    return (b.Experience || 0) - (a.Experience || 0);
                case 'gold':
                    return (b.Gold || 0) - (a.Gold || 0);
                default:
                    return 0;
            }
        });

        setFilteredQuests(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedClasses, selectedFactions, selectedNPCs, sortBy, minLevel, maxLevel, hideChainQuests, quests]);

    // Get unique classes, factions, and NPCs
    const questClasses = [...new Set(
        quests.flatMap(quest => {
            if (!quest.RequiredClass) return [];
            return quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
        })
    )].sort();
    
    const questFactions = [...new Set(
        quests.map(quest => quest.RequiredClassFaction).filter(f => f && f.trim() !== '')
    )].sort();
    
    const questNPCs = [...new Set(
        quests.map(quest => quest.NpcQuestGiver).filter(n => n && n.trim() !== '')
    )].sort();
    
    // Toggle class selection
    const toggleClass = (className) => {
        setSelectedClasses(prev => {
            if (prev.includes(className)) {
                return prev.filter(c => c !== className);
            } else {
                return [...prev, className];
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

    // Toggle NPC selection
    const toggleNPC = (npc) => {
        setSelectedNPCs(prev => {
            if (prev.includes(npc)) {
                return prev.filter(n => n !== npc);
            } else {
                return [...prev, npc];
            }
        });
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentQuests = filteredQuests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQuests.length / itemsPerPage);

    // Get quest icon based on type/properties
    const getQuestIcon = (quest) => {
        if (quest.RequiredQuest && quest.RequiredQuest.trim() !== '') return '⛓️';
        if (quest.RequiredClassFaction) return '🛡️';
        if (quest.RequiredClass) return '🎓';
        if (quest.Gold > 1000) return '💰';
        if (quest.Experience > 10000) return '⭐';
        return '📜';
    };

    // Get rarity color based on rewards/level
    const getRarityColor = (quest) => {
        if (quest.Experience > 50000) return '#ff00ff'; // Epic
        if (quest.Gold > 5000) return '#ffaa00'; // Legendary
        if (quest.Level >= 100) return '#00aaff'; // High Level
        if (quest.RequiredQuest) return '#ff6666'; // Chain Quest
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
                    <div>Loading Quests Database...</div>
                    <div style={{ fontSize: '0.6em', color: '#888', marginTop: '10px' }}>
                        {quests.length > 0 ? `Loaded ${quests.length} quests` : 'Please wait...'}
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
                    📜 Quests
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
                        placeholder="Search quests..."
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

                {/* Class Filter - Collapsible */}
                {questClasses.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div 
                            onClick={() => setShowClasses(!showClasses)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '12px',
                                background: '#2a2a2a',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginBottom: showClasses ? '12px' : '0',
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
                                🎓 Classes
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedClasses.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showClasses ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {showClasses && (
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
                                        background: selectedClasses.length === questClasses.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedClasses.length === questClasses.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedClasses.length === questClasses.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedClasses.length === questClasses.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedClasses.length === questClasses.length}
                                        onChange={() => {
                                            if (selectedClasses.length === questClasses.length) {
                                                setSelectedClasses([]);
                                            } else {
                                                setSelectedClasses([...questClasses]);
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
                                        color: selectedClasses.length === questClasses.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Class Checkboxes */}
                                {questClasses.map(className => (
                                    <label
                                        key={className}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            marginBottom: '4px',
                                            background: selectedClasses.includes(className) ? '#00ff0020' : 'transparent',
                                            border: `1px solid ${selectedClasses.includes(className) ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.1em'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedClasses.includes(className)) {
                                                e.currentTarget.style.background = '#00ff0010';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedClasses.includes(className)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedClasses.includes(className)}
                                            onChange={() => toggleClass(className)}
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
                                            color: selectedClasses.includes(className) ? '#00ff00' : '#aaa'
                                        }}>
                                            {className}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.9em',
                                            color: '#888',
                                            marginLeft: '8px'
                                        }}>
                                            ({quests.filter(q => q.RequiredClass?.includes(className)).length})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Faction Filter - Collapsible */}
                {questFactions.length > 0 && (
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
                                        background: selectedFactions.length === questFactions.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedFactions.length === questFactions.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedFactions.length === questFactions.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedFactions.length === questFactions.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFactions.length === questFactions.length}
                                        onChange={() => {
                                            if (selectedFactions.length === questFactions.length) {
                                                setSelectedFactions([]);
                                            } else {
                                                setSelectedFactions([...questFactions]);
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
                                        color: selectedFactions.length === questFactions.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual Faction Checkboxes */}
                                {questFactions.map(faction => (
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
                                            ({quests.filter(q => q.RequiredClassFaction === faction).length})
                                        </span>
                                    </label>
                                ))}
                    </div>
                        )}
                </div>
                )}

                {/* NPC Filter - Collapsible */}
                {questNPCs.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <div 
                            onClick={() => setShowNPCs(!showNPCs)}
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
                                👤 Quest Givers
                                <span style={{ color: '#ffff00', marginLeft: '8px' }}>
                                    ({selectedNPCs.length} selected)
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.5em',
                                transition: 'transform 0.2s',
                                transform: showNPCs ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                            }}>
                                ▼
                            </span>
                        </div>

                        {showNPCs && (
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
                                        background: selectedNPCs.length === questNPCs.length ? '#00ff0030' : '#1a1a1a',
                                        border: `2px solid ${selectedNPCs.length === questNPCs.length ? '#00ff00' : '#555'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '1.2em',
                                        fontWeight: 'bold'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = selectedNPCs.length === questNPCs.length ? '#00ff0030' : '#00ff0015';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = selectedNPCs.length === questNPCs.length ? '#00ff0030' : '#1a1a1a';
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedNPCs.length === questNPCs.length}
                                        onChange={() => {
                                            if (selectedNPCs.length === questNPCs.length) {
                                                setSelectedNPCs([]);
                                            } else {
                                                setSelectedNPCs([...questNPCs]);
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
                                        color: selectedNPCs.length === questNPCs.length ? '#00ff00' : '#aaa'
                                    }}>
                                        Select All
                                    </span>
                                </label>

                                {/* Individual NPC Checkboxes */}
                                {questNPCs.map(npc => (
                                    <label
                                        key={npc}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            marginBottom: '4px',
                                            background: selectedNPCs.includes(npc) ? '#00ff0020' : 'transparent',
                                            border: `1px solid ${selectedNPCs.includes(npc) ? '#00ff00' : '#555'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '1.1em'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedNPCs.includes(npc)) {
                                                e.currentTarget.style.background = '#00ff0010';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedNPCs.includes(npc)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedNPCs.includes(npc)}
                                            onChange={() => toggleNPC(npc)}
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
                                            color: selectedNPCs.includes(npc) ? '#00ff00' : '#aaa'
                                        }}>
                                            {npc}
                                        </span>
                                        <span style={{ 
                                            fontSize: '0.9em',
                                            color: '#888',
                                            marginLeft: '8px'
                                        }}>
                                            ({quests.filter(q => q.NpcQuestGiver === npc).length})
                                        </span>
                                    </label>
                                ))}
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
                                        setMinLevel(Math.max(0, Math.min(150, numValue)));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setMinLevel(Math.max(0, Math.min(150, value)));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max="150"
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
                                        setMaxLevel(Math.max(0, Math.min(150, numValue)));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setMaxLevel(Math.max(0, Math.min(150, value)));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            }}
                            onDoubleClick={(e) => e.target.select()}
                            onFocus={(e) => e.target.select()}
                            min="0"
                            max="150"
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
                            left: `${(minLevel / 150) * 100}%`,
                            width: `${((maxLevel - minLevel) / 150) * 100}%`,
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
                            max="150"
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
                            max="150"
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
                    </div>
                </div>

                {/* Hide Chain Quests Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            background: hideChainQuests ? '#ff666620' : '#2a2a2a',
                            border: `2px solid ${hideChainQuests ? '#ff6666' : '#00ff00'}`,
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '1.2em'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={hideChainQuests}
                            onChange={() => setHideChainQuests(!hideChainQuests)}
                            style={{
                                width: '20px',
                                height: '20px',
                                marginRight: '12px',
                                cursor: 'pointer',
                                accentColor: '#ff6666'
                            }}
                        />
                        <span style={{ 
                            flex: 1,
                            color: hideChainQuests ? '#ff6666' : '#00ff00'
                        }}>
                            ⛓️ Hide Chain Quests
                        </span>
                    </label>
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
                        <option value="experience">Experience (High-Low)</option>
                        <option value="gold">Gold (High-Low)</option>
                    </select>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={() => {
                        setSearchTerm('');
                        setSelectedClasses([...questClasses]);
                        setSelectedFactions([...questFactions]);
                        setSelectedNPCs([...questNPCs]);
                        setSortBy('name');
                        setMinLevel(0);
                        setMaxLevel(150);
                        setHideChainQuests(false);
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

            {/* Main Content - Quest Grid */}
            <div style={{
                flex: selectedQuest ? '0 0 450px' : 1,
                minWidth: selectedQuest ? '450px' : 'auto',
                padding: '20px',
                overflowY: 'auto',
                transition: 'all 0.3s ease'
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
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredQuests.length)} of {filteredQuests.length}
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

                {/* Quest Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '15px'
                }}>
                    {currentQuests.map(quest => (
                        <div
                            key={quest.Id}
                            onClick={() => setSelectedQuest(quest)}
                            style={{
                                background: '#1a1a1a',
                                border: `2px solid ${getRarityColor(quest)}`,
                            borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 20px ${getRarityColor(quest)}80`;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '2em', marginRight: '10px' }}>
                                    {getQuestIcon(quest)}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '1.3em',
                                        fontWeight: 'bold',
                                        color: getRarityColor(quest),
                                        marginBottom: '3px'
                                    }}>
                                        {quest.Name || 'Unknown Quest'}
                            </div>
                                    {quest.NpcQuestGiver && (
                                        <div style={{ fontSize: '0.9em', color: '#888' }}>
                                            👤 {quest.NpcQuestGiver}
                            </div>
                                    )}
                            </div>
                            </div>

                            <div style={{ fontSize: '1.1em', color: '#aaa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {quest.Level > 0 && (
                                    <div>Level: <span style={{ color: '#ffff00' }}>{quest.Level}</span></div>
                                )}
                                {quest.Experience > 0 && (
                                    <div>EXP: <span style={{ color: '#00aaff' }}>{quest.Experience.toLocaleString()}</span></div>
                                )}
                                {quest.Gold > 0 && (
                                    <div>Gold: <span style={{ color: '#ffaa00' }}>{quest.Gold.toLocaleString()}</span></div>
                                )}
                                {quest.RequiredClassFaction && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        🛡️ <span style={{ color: '#00ff00' }}>{quest.RequiredClassFaction}</span>
                                    </div>
                                )}
                            </div>

                            {quest.RequiredQuest && quest.RequiredQuest.trim() !== '' && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '6px 10px',
                                    background: '#ff666620',
                                    border: '1px solid #ff6666',
                                    borderRadius: '3px',
                                    fontSize: '0.9em',
                                    color: '#ff6666'
                                }}>
                                    ⛓️ Chain Quest
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredQuests.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: '1.5em',
                        color: '#888',
                        marginTop: '50px'
                    }}>
                        No quests found matching your filters.
            </div>
                )}
            </div>

            {/* Right Panel - Quest Details */}
            {selectedQuest && (
                <div style={{
                    flex: 1,
                    background: '#0a0a0a',
                    borderLeft: `4px solid ${getRarityColor(selectedQuest)}`,
                    padding: '30px 50px',
                    overflowY: 'auto',
                    boxShadow: `-5px 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px ${getRarityColor(selectedQuest)}20`
                }}>
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedQuest(null)}
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

                    {/* Quest Header */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '30px',
                        paddingBottom: '25px',
                        borderBottom: `3px solid ${getRarityColor(selectedQuest)}`
                    }}>
                        <div style={{ 
                            fontSize: '5em', 
                            marginBottom: '15px',
                            filter: `drop-shadow(0 0 15px ${getRarityColor(selectedQuest)})`
                        }}>
                            {getQuestIcon(selectedQuest)}
                        </div>
                        <h2 style={{
                            fontSize: '2.5em',
                            color: getRarityColor(selectedQuest),
                            marginBottom: '12px',
                            textShadow: `0 0 15px ${getRarityColor(selectedQuest)}80`,
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                        }}>
                            {selectedQuest.Name}
                        </h2>
                        {selectedQuest.NpcQuestGiver && (
                            <div style={{ 
                                color: '#888', 
                                fontSize: '1.5em',
                                marginTop: '12px'
                            }}>
                                👤 {selectedQuest.NpcQuestGiver}
                            </div>
                        )}
                    </div>

                    {/* Basic Info Section */}
                    <div style={{
                        background: '#1a1a1a',
                        border: '3px solid #00ff00',
                        borderRadius: '5px',
                        padding: '15px 20px',
                        marginBottom: '15px',
                        boxShadow: 'inset 0 0 20px rgba(0, 255, 0, 0.1)'
                    }}>
                        <h3 style={{ 
                            color: '#00ff00', 
                            marginBottom: '18px', 
                            fontSize: '2em',
                            borderBottom: '2px solid #00ff0040',
                            paddingBottom: '12px'
                        }}>
                            Quest Info:
                        </h3>
                        <div style={{ fontSize: '1.5em', lineHeight: '2.2', color: '#aaa' }}>
                            {selectedQuest.Level > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Level:</span>
                                    <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{selectedQuest.Level}</span>
                                </div>
                            )}
                            {selectedQuest.RequiredLevel > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Required Level:</span>
                                    <span style={{ color: '#ff6600', fontWeight: 'bold' }}>{selectedQuest.RequiredLevel}</span>
                                </div>
                            )}
                            {selectedQuest.Experience > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Experience:</span>
                                    <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{selectedQuest.Experience.toLocaleString()}</span>
                                </div>
                            )}
                            {selectedQuest.Gold > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Gold:</span>
                                    <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{selectedQuest.Gold.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requirements Section */}
                    {(selectedQuest.RequiredClass || selectedQuest.RequiredClassFaction || selectedQuest.RequiredQuest) && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '3px solid #ff6600',
                            borderRadius: '5px',
                            padding: '15px 20px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(255, 102, 0, 0.1)'
                        }}>
                            <h3 style={{ 
                                color: '#ff6600', 
                                marginBottom: '18px', 
                                fontSize: '2em',
                                borderBottom: '2px solid #ff660040',
                                paddingBottom: '12px'
                            }}>
                                Requirements:
                            </h3>
                            <div style={{ fontSize: '1.4em', lineHeight: '2', color: '#ccc' }}>
                                {selectedQuest.RequiredClass && selectedQuest.RequiredClass.trim() !== '' && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <span style={{ color: '#888' }}>Classes:</span> <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{selectedQuest.RequiredClass}</span>
                                    </div>
                                )}
                                {selectedQuest.RequiredClassFaction && selectedQuest.RequiredClassFaction.trim() !== '' && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <span style={{ color: '#888' }}>Faction:</span> <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{selectedQuest.RequiredClassFaction}</span>
                                    </div>
                                )}
                                {selectedQuest.RequiredQuest && selectedQuest.RequiredQuest.trim() !== '' && (
                                    <div style={{
                                        padding: '15px',
                                        background: '#ff666620',
                                        border: '2px solid #ff6666',
                                        borderRadius: '5px',
                                        marginTop: '12px'
                                    }}>
                                        <span style={{ color: '#ff6666', fontSize: '1.1em' }}>⛓️ Requires Quest:</span>
                                        <div style={{ color: '#ffff00', marginTop: '8px', fontWeight: 'bold' }}>{selectedQuest.RequiredQuest}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description Section */}
                    {selectedQuest.Description && selectedQuest.Description.trim() !== '' && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '3px solid #666',
                            borderRadius: '5px',
                            padding: '15px 20px',
                            marginBottom: '15px',
                            fontSize: '1.4em',
                            color: '#ccc',
                            lineHeight: '2',
                            fontStyle: 'italic'
                        }}>
                            <div style={{ 
                                color: '#888', 
                                fontSize: '1em', 
                                marginBottom: '15px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                fontWeight: 'bold'
                            }}>
                                Description:
                            </div>
                            <ReactMarkdown 
                                className="quest-markdown"
                                remarkPlugins={[remarkGfm]}
                            >
                                {selectedQuest.Description}
                            </ReactMarkdown>
                        </div>
                    )}

                    {/* Objectives Section - Collapsible */}
                    {selectedQuest.Objectives && selectedQuest.Objectives.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '3px solid #00aaff',
                            borderRadius: '5px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(0, 170, 255, 0.1)'
                        }}>
                            <div 
                                onClick={() => setShowQuestDialogue(!showQuestDialogue)}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '15px 20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#00aaff20';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <h3 style={{ 
                                    color: '#00aaff', 
                                    margin: 0,
                                    fontSize: '2em'
                                }}>
                                    📖 Quest Dialogue
                                </h3>
                                <span style={{ 
                                    fontSize: '1.5em',
                                    color: '#00aaff',
                                    transition: 'transform 0.2s',
                                    transform: showQuestDialogue ? 'rotate(180deg)' : 'rotate(0deg)',
                                    display: 'inline-block'
                                }}>
                                    ▼
                                </span>
                            </div>
                            
                            {showQuestDialogue && (
                                <div style={{ padding: '0 20px 15px 20px' }}>
                                    <div className="quest-markdown" style={{ fontSize: '1.3em', lineHeight: '2' }}>
                                        {selectedQuest.Objectives.map((objective, idx) => (
                                            <div key={idx} style={{
                                                padding: '12px',
                                                background: idx % 2 === 0 ? '#0a0a0a' : '#1a1a1a',
                                                borderRadius: '5px',
                                                marginBottom: '10px',
                                                border: '2px solid #00aaff40',
                                                color: '#ccc'
                                            }}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {objective}
                                                </ReactMarkdown>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Steps Section */}
                    {selectedQuest.Steps && selectedQuest.Steps.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '3px solid #ffff00',
                            borderRadius: '5px',
                            padding: '15px 20px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(255, 255, 0, 0.1)'
                        }}>
                            <h3 style={{ 
                                color: '#ffff00', 
                                marginBottom: '18px', 
                                fontSize: '2em',
                                borderBottom: '2px solid #ffff0040',
                                paddingBottom: '12px'
                            }}>
                                ✓ Quest Steps:
                            </h3>
                            <div className="quest-markdown" style={{ fontSize: '1.3em', lineHeight: '2' }}>
                                {selectedQuest.Steps.map((step, idx) => (
                                    <div key={idx} style={{
                                        padding: '12px',
                                        background: '#0a0a0a',
                                        borderRadius: '5px',
                                        marginBottom: '10px',
                                        border: '2px solid #ffff0040',
                                        display: 'flex',
                                        alignItems: 'flex-start'
                                    }}>
                                        <span style={{ 
                                            color: '#ffff00', 
                                            marginRight: '15px',
                                            fontWeight: 'bold',
                                            minWidth: '40px',
                                            fontSize: '1.2em'
                                        }}>
                                            {idx + 1}.
                                        </span>
                                        <div style={{ flex: 1, color: '#ccc' }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {step}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rewards Section */}
                    {selectedQuest.Rewards && selectedQuest.Rewards.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '3px solid #ffaa00',
                            borderRadius: '5px',
                            padding: '15px 20px',
                            marginBottom: '15px',
                            boxShadow: 'inset 0 0 20px rgba(255, 170, 0, 0.1)'
                        }}>
                            <h3 style={{ 
                                color: '#ffaa00', 
                                marginBottom: '18px', 
                                fontSize: '2em',
                                borderBottom: '2px solid #ffaa0040',
                                paddingBottom: '12px'
                            }}>
                                🎁 Rewards:
                            </h3>
                            <div style={{ fontSize: '1.3em', lineHeight: '2' }}>
                                {selectedQuest.Rewards.map((reward, idx) => (
                                    <div key={idx} style={{
                                        padding: '12px',
                                        background: '#0a0a0a',
                                        borderRadius: '5px',
                                        marginBottom: '10px',
                                        border: '2px solid #ffaa0040',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ color: '#ccc' }}>
                                            <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{reward.Type}:</span>{' '}
                                            {reward.Name}
                                        </div>
                                        <div style={{ 
                                            color: '#00ff00',
                                            fontWeight: 'bold',
                                            fontSize: '1.4em'
                                        }}>
                                            {reward.Quantity > 1 ? `×${reward.Quantity}` : '✓'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default QuestsPage;
