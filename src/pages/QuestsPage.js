import React, { useState, useEffect, useMemo } from 'react';
import { useGameData } from '../contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function QuestsPage({ isActive }) {
    const { quests: loadedQuests } = useGameData();
    // Add CSS for range slider thumbs and markdown styling
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
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedFactions, setSelectedFactions] = useState([]);
    const [selectedNPCs, setSelectedNPCs] = useState([]);
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [minLevel, setMinLevel] = useState(0);
    const [maxLevel, setMaxLevel] = useState(150);
    const [showClasses, setShowClasses] = useState(() => {
        const saved = localStorage.getItem('revelationQuestsShowClasses');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showFactions, setShowFactions] = useState(() => {
        const saved = localStorage.getItem('revelationQuestsShowFactions');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [showNPCs, setShowNPCs] = useState(() => {
        const saved = localStorage.getItem('revelationQuestsShowNPCs');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [hideChainQuests, setHideChainQuests] = useState(false);
    const [completedQuests, setCompletedQuests] = useState({});
    const [hideCompletedQuests, setHideCompletedQuests] = useState(false);
    const [requiredQuestModal, setRequiredQuestModal] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [shareNotification, setShareNotification] = useState(false);

    // Handle slider z-index for LEVEL slider
    useEffect(() => {
        const minSlider = document.querySelector('.dual-range-min-level');
        const maxSlider = document.querySelector('.dual-range-max-level');
        
        if (!minSlider || !maxSlider) return;

        const updateZIndex = (e) => {
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

    // Load completed quests from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('revelationCompletedQuests');
            if (saved) {
                setCompletedQuests(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading completed quests from localStorage:', error);
        }
    }, []);

    // Save collapsible section states to localStorage
    useEffect(() => {
        localStorage.setItem('revelationQuestsShowClasses', JSON.stringify(showClasses));
    }, [showClasses]);

    useEffect(() => {
        localStorage.setItem('revelationQuestsShowFactions', JSON.stringify(showFactions));
    }, [showFactions]);

    useEffect(() => {
        localStorage.setItem('revelationQuestsShowNPCs', JSON.stringify(showNPCs));
    }, [showNPCs]);

    // Initialize quests from context
    useEffect(() => {
        if (loadedQuests && loadedQuests.length > 0) {
            console.log(`[QuestsPage] Using ${loadedQuests.length} quests from context`);
            setQuests(loadedQuests);
            
            // No filters selected by default - show all results
            // const allClasses = [...new Set(
            //     loadedQuests.flatMap(quest => {
            //         if (!quest.RequiredClass) return [];
            //         return quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
            //     })
            // )].sort();
            setSelectedClasses([]);
            
            // const allFactions = [...new Set(
            //     loadedQuests.map(quest => quest.RequiredClassFaction).filter(f => f && f.trim() !== '')
            // )].sort();
            setSelectedFactions([]);
            
            // const allNPCs = [...new Set(
            //     loadedQuests.map(quest => quest.NpcQuestGiver).filter(n => n && n.trim() !== '')
            // )].sort();
            setSelectedNPCs([]);
        }
    }, [loadedQuests]);

    // Handle URL parameters for direct quest linking
    useEffect(() => {
        if (!isActive || quests.length === 0 || typeof window === 'undefined') return;
        
        const url = new URL(window.location);
        const questId = url.searchParams.get('quest');
        
        if (questId) {
            // Convert questId to number if possible
            const questIdNum = parseInt(questId, 10);
            const quest = quests.find(q => q.Id === questIdNum || q.Id === questId);
            
            if (quest && selectedQuest?.Id !== quest.Id) {
                console.log(`[QuestsPage] Opening quest from URL: ${quest.Title || quest.Name}`);
                setSelectedQuest(quest);
                setViewMode('detail');
            }
        }
    }, [isActive, quests, selectedQuest]);

    // Toggle quest completion
    const toggleQuestCompletion = (questId, e) => {
        if (e) {
            e.stopPropagation(); // Prevent quest click
        }
        setCompletedQuests(prev => {
            const updated = { ...prev };
            if (updated[questId]) {
                delete updated[questId];
            } else {
                updated[questId] = true;
            }
            // Save to localStorage
            try {
                localStorage.setItem('revelationCompletedQuests', JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving completed quests to localStorage:', error);
            }
            return updated;
        });
    };

    // Get unique classes, factions, and NPCs
    const questClasses = useMemo(() => 
        [...new Set(
            quests.flatMap(quest => {
                if (!quest.RequiredClass) return [];
                return quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
            })
        )].sort(), 
    [quests]);
    
    const questFactions = useMemo(() => 
        [...new Set(
            quests.map(quest => quest.RequiredClassFaction).filter(f => f && f.trim() !== '')
        )].sort(), 
    [quests]);
    
    const questNPCs = useMemo(() => 
        [...new Set(
            quests.map(quest => quest.NpcQuestGiver).filter(n => n && n.trim() !== '')
        )].sort(), 
    [quests]);

    // Filter and sort quests
    const filteredQuests = useMemo(() => {
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
        if (selectedClasses.length > 0 && selectedClasses.length < questClasses.length) {
            filtered = filtered.filter(quest => {
                if (!quest.RequiredClass || quest.RequiredClass.trim() === '') return true;
                const questClassList = quest.RequiredClass.split(' ').filter(c => c.trim() !== '');
                return questClassList.some(c => selectedClasses.includes(c));
            });
        }

        // Faction filter
        if (selectedFactions.length > 0 && selectedFactions.length < questFactions.length) {
            filtered = filtered.filter(quest => 
                !quest.RequiredClassFaction || 
                quest.RequiredClassFaction.trim() === '' ||
                selectedFactions.includes(quest.RequiredClassFaction)
            );
        }

        // NPC filter
        if (selectedNPCs.length > 0 && selectedNPCs.length < questNPCs.length) {
            filtered = filtered.filter(quest => 
                !quest.NpcQuestGiver || 
                quest.NpcQuestGiver.trim() === '' ||
                selectedNPCs.includes(quest.NpcQuestGiver)
            );
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

        // Completed quest filter
        if (hideCompletedQuests) {
            filtered = filtered.filter(quest => !completedQuests[quest.Id]);
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

        return filtered;
    }, [searchTerm, selectedClasses, selectedFactions, selectedNPCs, sortBy, minLevel, maxLevel, 
        hideChainQuests, hideCompletedQuests, completedQuests, quests, questClasses.length, 
        questFactions.length, questNPCs.length]);

    // Helper functions
    const getQuestIcon = (quest) => {
        if (quest.RequiredQuest && quest.RequiredQuest.trim() !== '') return '⛓️';
        if (quest.RequiredClassFaction) return '🛡️';
        if (quest.RequiredClass) return '🎓';
        if (quest.Gold > 1000) return '💰';
        if (quest.Experience > 10000) return '⭐';
        return '📜';
    };

    const getRarityColor = (quest) => {
        if (quest.Experience > 50000) return '#ff00ff'; // Epic
        if (quest.Gold > 5000) return '#ffaa00'; // Legendary
        if (quest.Level >= 100) return '#00aaff'; // High Level
        if (quest.RequiredQuest) return '#ff6666'; // Chain Quest
        return '#aaaaaa'; // Normal
    };

    // Find quest by name
    const findQuestByName = (questName) => {
        return quests.find(q => q.Name === questName);
    };

    // Get required quest chain
    const getRequiredQuestChain = (questName) => {
        const chain = [];
        let currentQuestName = questName;
        let depth = 0;
        const maxDepth = 20;

        while (currentQuestName && depth < maxDepth) {
            const quest = findQuestByName(currentQuestName);
            if (!quest) break;
            
            chain.push(quest);
            currentQuestName = quest.RequiredQuest;
            depth++;
        }

        return chain;
    };

    // Handle quest click to view details
    const handleQuestClick = (quest) => {
        if (!quest) return;
        setSelectedQuest(quest);
        setViewMode('detail');
        
        // Update URL with quest ID for shareable links (clean URL with only quest parameter)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('quest', quest.Id);
            window.history.pushState({}, '', url);
        }
    };

    // Handle back to list
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedQuest(null);
        
        // Remove quest param from URL (create clean URL with no parameters)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.origin + window.location.pathname);
            window.history.pushState({}, '', url);
        }
    };

    // Handle share quest
    const handleShareQuest = () => {
        if (!selectedQuest || typeof window === 'undefined') return;
        
        // Create a clean URL with only the quest parameter
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('quest', selectedQuest.Id);
        const shareUrl = url.toString();
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            setShareNotification(true);
            setTimeout(() => setShareNotification(false), 3000);
        }).catch(err => {
            console.error('Failed to copy link:', err);
            // Fallback: show the URL in an alert
            alert(`Copy this link to share:\n${shareUrl}`);
        });
    };

    // Handle required quest click
    const handleRequiredQuestClick = (questName, e) => {
        if (e) {
            e.stopPropagation(); // Prevent parent click
        }
        const foundQuest = findQuestByName(questName);
        if (foundQuest) {
            setRequiredQuestModal(foundQuest);
        }
    };

    // Navigate to required quest (from modal)
    const navigateToRequiredQuest = (quest) => {
        setRequiredQuestModal(null);
        setSelectedQuest(quest);
        setViewMode('detail');
    };

    // Loading screen
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

    // Render list content (table view)
    const renderListContent = () => (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <div style={{
                flex: 1,
                padding: '0',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0'
            }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0'
            }}>
                <div style={{
                    flex: '1 1 260px',
                    minWidth: '220px',
                    background: '#1a1a1a',
                    border: '2px solid #00ff00',
                    borderRadius: '0',
                    borderTop: 'none',
                    borderLeft: 'none',
                    padding: '16px',
                    boxShadow: '0 0 15px rgba(0, 255, 0, 0.15)'
                }}>
                    <div style={{ fontSize: '1.4em', marginBottom: '6px', color: '#00ff00' }}>
                        Quest Summary
                    </div>
                    <div style={{ color: '#ccc', fontSize: '1.1em' }}>
                        Showing <span style={{ color: '#00ff00' }}>{filteredQuests.length}</span> of{' '}
                        <span style={{ color: '#ffff00' }}>{quests.length}</span> quests
                    </div>
                </div>

                <div style={{
                    flex: '1 1 260px',
                    minWidth: '220px',
                    background: '#1a1a1a',
                    border: '2px solid #ffaa00',
                    borderRadius: '0',
                    borderTop: 'none',
                    borderRight: 'none',
                    padding: '16px',
                    boxShadow: '0 0 15px rgba(255, 170, 0, 0.18)'
                }}>
                    <div style={{ fontSize: '1.4em', marginBottom: '6px', color: '#ffaa00' }}>
                        ✓ Completed Quests
                    </div>
                    <div style={{ color: '#ccc', fontSize: '1.1em' }}>
                        {Object.keys(completedQuests).length} quests completed
                    </div>
                </div>
            </div>

            <div style={{
                background: '#101010',
                border: '2px solid #00ff00',
                borderRadius: '0',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
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
                            <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>✓</th>
                            <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}></th>
                            <th style={{ padding: '12px 14px', width: '35%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Quest Name</th>
                            <th style={{ padding: '12px 14px', width: '20%', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>NPC</th>
                            <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>Level</th>
                            <th style={{ padding: '12px 14px', width: '120px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>XP</th>
                            <th style={{ padding: '12px 14px', width: '120px', textAlign: 'right', borderBottom: '2px solid #00ff00' }}>Gold</th>
                            <th style={{ padding: '12px 14px', width: '100px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuests.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{
                                    padding: '32px 20px',
                                    textAlign: 'center',
                                    color: '#888',
                                    fontSize: '1.2em'
                                }}>
                                    No quests found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredQuests.map(quest => {
                                const isCompleted = completedQuests[quest.Id];
                                const isSelected = selectedQuest?.Id === quest.Id;
                                const baseRowBackground = isSelected ? '#00ff0015' : (isCompleted ? '#00ff0010' : 'transparent');

                                return (
                                    <tr
                                        key={quest.Id}
                                        onClick={() => handleQuestClick(quest)}
                                        style={{
                                            cursor: 'pointer',
                                            background: baseRowBackground,
                                            borderBottom: '1px solid #00ff0020',
                                            transition: 'all 0.2s ease',
                                            boxShadow: 'none',
                                            transform: 'translateY(0)',
                                            opacity: isCompleted ? 0.7 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = isCompleted ? '#00ff0020' : '#1a1a1a';
                                            }
                                            e.currentTarget.style.boxShadow = `0 0 16px ${getRarityColor(quest)}40`;
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.opacity = 1;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = baseRowBackground;
                                            }
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.opacity = isCompleted ? 0.7 : 1;
                                        }}
                                    >
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <div
                                                onClick={(e) => toggleQuestCompletion(quest.Id, e)}
                                                style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    background: isCompleted ? '#00ff00' : '#2a2a2a',
                                                    border: `3px solid ${isCompleted ? '#00ff00' : '#555'}`,
                                                    borderRadius: '5px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '1.2em',
                                                    fontWeight: 'bold',
                                                    color: isCompleted ? '#000' : '#555',
                                                    margin: '0 auto',
                                                    boxShadow: isCompleted ? '0 0 10px rgba(0, 255, 0, 0.6)' : 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.stopPropagation();
                                                    if (!isCompleted) {
                                                        e.currentTarget.style.borderColor = '#00ff00';
                                                        e.currentTarget.style.color = '#00ff00';
                                                    }
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.stopPropagation();
                                                    if (!isCompleted) {
                                                        e.currentTarget.style.borderColor = '#555';
                                                        e.currentTarget.style.color = '#555';
                                                    }
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                {isCompleted ? '✓' : ''}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '1.8em' }}>
                                            {getQuestIcon(quest)}
                                        </td>
                                        <td style={{ 
                                            padding: '14px', 
                                            color: getRarityColor(quest), 
                                            fontWeight: 'bold',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {quest.Name || 'Unnamed Quest'}
                                        </td>
                                        <td style={{ 
                                            padding: '14px', 
                                            color: '#ccc',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {quest.NpcQuestGiver || '—'}
                                        </td>
                                        <td style={{ padding: '14px', textAlign: 'center', color: '#ffff00', fontWeight: 'bold' }}>
                                            {quest.Level || 0}
                                        </td>
                                        <td style={{ 
                                            padding: '14px', 
                                            textAlign: 'right', 
                                            color: '#00aaff',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {quest.Experience > 0 ? quest.Experience.toLocaleString() : '—'}
                                        </td>
                                        <td style={{ 
                                            padding: '14px', 
                                            textAlign: 'right', 
                                            color: '#ffaa00',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {quest.Gold > 0 ? quest.Gold.toLocaleString() : '—'}
                                        </td>
                                        <td style={{ 
                                            padding: '14px', 
                                            color: '#ccc',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {quest.RequiredQuest ? 'Chain' : 
                                             quest.RequiredClassFaction ? 'Faction' : 
                                             quest.RequiredClass ? 'Class' : 'General'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            </div>
        </div>
    );

    // Render detail view
    const renderDetailView = () => {
        if (!selectedQuest) {
            return (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888',
                    fontSize: '1.5em',
                    padding: '40px'
                }}>
                    Select a quest from the table to view full details.
                </div>
            );
        }

        const isCompleted = completedQuests[selectedQuest.Id];
        const requiredQuestChain = selectedQuest.RequiredQuest ? 
            getRequiredQuestChain(selectedQuest.RequiredQuest) : [];

        return (
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#0a0a0a',
                color: '#00ff00',
                fontFamily: 'VT323, monospace',
                padding: '30px 40px',
                overflow: 'hidden',
                minWidth: 0
            }}>
                {/* Header with back button */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '20px'
                }}>
                    <button
                        onClick={handleBackToList}
                        style={{
                            padding: '10px 18px',
                            background: 'transparent',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            color: '#00ff00',
                            fontSize: '1.1em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#00ff00';
                            e.currentTarget.style.color = '#000';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#00ff00';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        ← Back to Quests
                    </button>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleShareQuest}
                            style={{
                                padding: '10px 18px',
                                background: shareNotification ? '#00ff00' : 'transparent',
                                border: '2px solid #00aaff',
                                borderRadius: '5px',
                                color: shareNotification ? '#000' : '#00aaff',
                                fontSize: '1.1em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: shareNotification ? '0 0 20px rgba(0, 255, 0, 0.5)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!shareNotification) {
                                    e.currentTarget.style.background = '#00aaff';
                                    e.currentTarget.style.color = '#000';
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 170, 255, 0.6)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!shareNotification) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#00aaff';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {shareNotification ? '✓ Link Copied!' : '🔗 Share Quest'}
                        </button>

                        <button
                            onClick={(e) => toggleQuestCompletion(selectedQuest.Id, e)}
                            style={{
                                padding: '10px 18px',
                                background: isCompleted ? '#00ff00' : 'transparent',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                color: isCompleted ? '#000' : '#00ff00',
                                fontSize: '1.1em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: 'bold',
                                boxShadow: isCompleted ? '0 0 20px rgba(0, 255, 0, 0.4)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00ff00';
                                e.currentTarget.style.color = '#000';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isCompleted ? '#00ff00' : 'transparent';
                                e.currentTarget.style.color = isCompleted ? '#000' : '#00ff00';
                                e.currentTarget.style.boxShadow = isCompleted ? '0 0 20px rgba(0, 255, 0, 0.4)' : 'none';
                            }}
                        >
                            {isCompleted ? '✓ Completed' : 'Mark Complete'}
                        </button>
                    </div>
                </div>

                {/* Quest content - scrollable */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '10px',
                    minHeight: 0
                }}>
                    {/* Sticky Quest Header */}
                    <div style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: '#0a0a0a',
                        paddingBottom: '20px',
                        marginBottom: '10px'
                    }}>
                        {/* Quest Header */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '20px',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                            border: `3px solid ${getRarityColor(selectedQuest)}`,
                            borderRadius: '10px',
                            boxShadow: `0 0 30px ${getRarityColor(selectedQuest)}40`
                        }}>
                            <div style={{ 
                                fontSize: '4em', 
                                marginBottom: '15px',
                                filter: `drop-shadow(0 0 15px ${getRarityColor(selectedQuest)})`
                            }}>
                                {getQuestIcon(selectedQuest)}
                            </div>
                            <h1 style={{
                                fontSize: '2.5em',
                                color: getRarityColor(selectedQuest),
                                marginBottom: '10px',
                                textShadow: `0 0 20px ${getRarityColor(selectedQuest)}80`,
                                fontWeight: 'bold'
                            }}>
                                {selectedQuest.Name}
                            </h1>
                            {selectedQuest.NpcQuestGiver && (
                                <div style={{ 
                                    color: '#888', 
                                    fontSize: '1.4em',
                                    marginTop: '10px'
                                }}>
                                    👤 Quest Giver: {selectedQuest.NpcQuestGiver}
                                </div>
                            )}
                            {selectedQuest.Type && (
                                <div style={{ 
                                    color: '#00aaff', 
                                    fontSize: '1.3em',
                                    marginTop: '8px',
                                    fontStyle: 'italic'
                                }}>
                                    📜 {selectedQuest.Type}
                                </div>
                            )}
                        </div>

                        {/* Quest Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            <div style={{
                                background: '#1a1a1a',
                                border: '2px solid #ffff00',
                                borderRadius: '8px',
                                padding: '15px',
                                textAlign: 'center'
                            }}>
                                <div style={{ color: '#888', fontSize: '1.1em', marginBottom: '5px' }}>Level</div>
                                <div style={{ color: '#ffff00', fontSize: '1.8em', fontWeight: 'bold' }}>
                                    {selectedQuest.Level || 0}
                                </div>
                            </div>

                            {selectedQuest.Experience > 0 && (
                                <div style={{
                                    background: '#1a1a1a',
                                    border: '2px solid #00aaff',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ color: '#888', fontSize: '1.1em', marginBottom: '5px' }}>Experience</div>
                                    <div style={{ color: '#00aaff', fontSize: '1.8em', fontWeight: 'bold' }}>
                                        {selectedQuest.Experience.toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {selectedQuest.Gold > 0 && (
                                <div style={{
                                    background: '#1a1a1a',
                                    border: '2px solid #ffaa00',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ color: '#888', fontSize: '1.1em', marginBottom: '5px' }}>Gold</div>
                                    <div style={{ color: '#ffaa00', fontSize: '1.8em', fontWeight: 'bold' }}>
                                        {selectedQuest.Gold.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requirements */}
                    {(selectedQuest.RequiredLevel > 0 || selectedQuest.RequiredClass || selectedQuest.RequiredClassFaction) && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #ff6666',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#ff6666', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #ff666640',
                                paddingBottom: '10px'
                            }}>
                                📋 Requirements
                            </h3>
                            <div style={{ fontSize: '1.3em', lineHeight: '2', color: '#ccc' }}>
                                {selectedQuest.RequiredLevel > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ color: '#888' }}>Minimum Level:</span>{' '}
                                        <span style={{ color: '#ffff00', fontWeight: 'bold' }}>
                                            {selectedQuest.RequiredLevel}
                                        </span>
                                    </div>
                                )}
                                {selectedQuest.RequiredClass && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ color: '#888' }}>Required Class:</span>{' '}
                                        <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                                            {selectedQuest.RequiredClass}
                                        </span>
                                    </div>
                                )}
                                {selectedQuest.RequiredClassFaction && (
                                    <div>
                                        <span style={{ color: '#888' }}>Required Faction:</span>{' '}
                                        <span style={{ color: '#00aaff', fontWeight: 'bold' }}>
                                            {selectedQuest.RequiredClassFaction}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Required Quest Chain */}
                    {requiredQuestChain.length > 0 && (
                        <div style={{
                            background: '#ff666620',
                            border: '2px solid #ff6666',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#ff6666', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #ff666640',
                                paddingBottom: '10px'
                            }}>
                                ⛓️ Prerequisite Quest Chain
                            </h3>
                            <div style={{ 
                                maxHeight: '300px',
                                overflowY: 'auto',
                                fontSize: '1.1em'
                            }}>
                                {requiredQuestChain.map((quest, index) => {
                                    const chainQuestCompleted = completedQuests[quest.Id];
                                    return (
                                        <div 
                                            key={quest.Id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuestClick(quest);
                                            }}
                                            style={{
                                                padding: '12px 15px',
                                                background: chainQuestCompleted ? '#00ff0015' : (index % 2 === 0 ? '#1a1a1a' : '#2a2a2a'),
                                                borderRadius: '5px',
                                                marginBottom: '10px',
                                                cursor: 'pointer',
                                                border: `2px solid ${chainQuestCompleted ? '#00ff0060' : '#ff666640'}`,
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#ff666630';
                                                e.currentTarget.style.borderColor = '#ff6666';
                                                e.currentTarget.style.transform = 'translateX(5px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = chainQuestCompleted ? '#00ff0015' : (index % 2 === 0 ? '#1a1a1a' : '#2a2a2a');
                                                e.currentTarget.style.borderColor = chainQuestCompleted ? '#00ff0060' : '#ff666640';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            {chainQuestCompleted && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    width: '24px',
                                                    height: '24px',
                                                    background: '#00ff00',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8em',
                                                    fontWeight: 'bold',
                                                    color: '#000',
                                                    boxShadow: '0 0 10px rgba(0, 255, 0, 0.6)'
                                                }}>
                                                    ✓
                                                </div>
                                            )}
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '5px',
                                                paddingRight: chainQuestCompleted ? '30px' : '0'
                                            }}>
                                                <span style={{ 
                                                    color: '#ffff00', 
                                                    fontWeight: 'bold',
                                                    fontSize: '1.2em'
                                                }}>
                                                    {index + 1}. {quest.Name}
                                                </span>
                                                {quest.Level > 0 && (
                                                    <span style={{ 
                                                        color: '#ffff00',
                                                        fontSize: '1em',
                                                        background: '#ffff0020',
                                                        padding: '4px 10px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ffff0060'
                                                    }}>
                                                        Lvl {quest.Level}
                                                    </span>
                                                )}
                                            </div>
                                            {quest.NpcQuestGiver && (
                                                <div style={{ 
                                                    color: '#888', 
                                                    fontSize: '1em'
                                                }}>
                                                    👤 {quest.NpcQuestGiver}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {selectedQuest.Description && selectedQuest.Description.trim() !== '' && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #666',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#00ff00', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #00ff0040',
                                paddingBottom: '10px'
                            }}>
                                📖 Description
                            </h3>
                            <div className="quest-markdown" style={{
                                fontSize: '1.2em',
                                lineHeight: '1.8'
                            }}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {selectedQuest.Description}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Objectives */}
                    {selectedQuest.Objectives && selectedQuest.Objectives.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #00aaff',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#00aaff', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #00aaff40',
                                paddingBottom: '10px'
                            }}>
                                🎯 Objectives
                            </h3>
                            <div style={{ fontSize: '1.2em', lineHeight: '2', color: '#ccc' }}>
                                {selectedQuest.Objectives.map((obj, index) => (
                                    <div key={index} className="quest-markdown" style={{ 
                                        marginBottom: '10px',
                                        paddingLeft: '20px',
                                        position: 'relative'
                                    }}>
                                        <span style={{ 
                                            position: 'absolute',
                                            left: '0',
                                            color: '#00aaff',
                                            fontWeight: 'bold'
                                        }}>
                                            {index + 1}.
                                        </span>
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {obj}
                                        </ReactMarkdown>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Steps */}
                    {selectedQuest.Steps && selectedQuest.Steps.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #ffaa00',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#ffaa00', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #ffaa0040',
                                paddingBottom: '10px'
                            }}>
                                📝 Steps
                            </h3>
                            <div style={{ fontSize: '1.2em', lineHeight: '2', color: '#ccc' }}>
                                {selectedQuest.Steps.map((step, index) => (
                                    <div key={index} style={{ 
                                        marginBottom: '10px',
                                        paddingLeft: '20px',
                                        position: 'relative'
                                    }}>
                                        <span style={{ 
                                            position: 'absolute',
                                            left: '0',
                                            color: '#ffaa00',
                                            fontWeight: 'bold'
                                        }}>
                                            {index + 1}.
                                        </span>
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rewards */}
                    {selectedQuest.Rewards && selectedQuest.Rewards.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #ff00ff',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#ff00ff', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #ff00ff40',
                                paddingBottom: '10px'
                            }}>
                                🎁 Rewards
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px'
                            }}>
                                {selectedQuest.Rewards.map((reward, index) => (
                                    <div key={index} style={{
                                        background: '#2a2a2a',
                                        border: '2px solid #ff00ff40',
                                        borderRadius: '5px',
                                        padding: '15px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ 
                                            color: '#888', 
                                            fontSize: '1em', 
                                            marginBottom: '5px' 
                                        }}>
                                            {reward.Type}
                                        </div>
                                        <div style={{ 
                                            color: '#ff00ff', 
                                            fontSize: '1.3em', 
                                            fontWeight: 'bold',
                                            marginBottom: '3px'
                                        }}>
                                            {reward.Name}
                                        </div>
                                        {reward.Quantity > 1 && (
                                            <div style={{ 
                                                color: '#ffff00', 
                                                fontSize: '1.1em' 
                                            }}>
                                                x{reward.Quantity}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Requirements (items/other) */}
                    {selectedQuest.Requirements && selectedQuest.Requirements.length > 0 && (
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #ff6666',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '25px'
                        }}>
                            <h3 style={{ 
                                color: '#ff6666', 
                                fontSize: '1.6em', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #ff666640',
                                paddingBottom: '10px'
                            }}>
                                📦 Required Items
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px'
                            }}>
                                {selectedQuest.Requirements.map((req, index) => (
                                    <div key={index} style={{
                                        background: '#2a2a2a',
                                        border: '2px solid #ff666640',
                                        borderRadius: '5px',
                                        padding: '15px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ 
                                            color: '#ff6666', 
                                            fontSize: '1.3em', 
                                            fontWeight: 'bold',
                                            marginBottom: '5px'
                                        }}>
                                            {req.Name || req}
                                        </div>
                                        {req.Quantity && (
                                            <div style={{ 
                                                color: '#ffff00', 
                                                fontSize: '1.1em' 
                                            }}>
                                                x{req.Quantity}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Main render
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
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                borderRight: '3px solid #00ff00',
                padding: '10px',
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
                                            onChange={() => {
                                                setSelectedClasses(prev => 
                                                    prev.includes(className)
                                                        ? prev.filter(c => c !== className)
                                                        : [...prev, className]
                                                );
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
                                            color: selectedClasses.includes(className) ? '#00ff00' : '#aaa'
                                        }}>
                                            {className}
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
                                marginBottom: showFactions ? '12px' : '0',
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
                                            onChange={() => {
                                                setSelectedFactions(prev => 
                                                    prev.includes(faction)
                                                        ? prev.filter(f => f !== faction)
                                                        : [...prev, faction]
                                                );
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
                                            color: selectedFactions.includes(faction) ? '#00ff00' : '#aaa'
                                        }}>
                                            {faction}
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
                                marginBottom: showNPCs ? '12px' : '0',
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
                                👤 NPCs
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
                                            onChange={() => {
                                                setSelectedNPCs(prev => 
                                                    prev.includes(npc)
                                                        ? prev.filter(n => n !== npc)
                                                        : [...prev, npc]
                                                );
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
                                            color: selectedNPCs.includes(npc) ? '#00ff00' : '#aaa'
                                        }}>
                                            {npc}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Level Range Slider */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2em' }}>
                        🎚️ Level Range: 
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
                    <div style={{ 
                        position: 'relative', 
                        height: '40px',
                        marginBottom: '10px'
                    }}>
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
                <div style={{ marginBottom: '15px' }}>
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

                {/* Hide Completed Quests Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            background: hideCompletedQuests ? '#00ff0020' : '#2a2a2a',
                            border: `2px solid ${hideCompletedQuests ? '#00ff00' : '#00ff00'}`,
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
                            checked={hideCompletedQuests}
                            onChange={() => setHideCompletedQuests(!hideCompletedQuests)}
                            style={{
                                width: '20px',
                                height: '20px',
                                marginRight: '12px',
                                cursor: 'pointer',
                                accentColor: '#00ff00'
                            }}
                        />
                        <span style={{ 
                            flex: 1,
                            color: '#00ff00'
                        }}>
                            ✓ Hide Completed ({Object.keys(completedQuests).length})
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
                        setSelectedClasses([]);
                        setSelectedFactions([]);
                        setSelectedNPCs([]);
                        setMinLevel(0);
                        setMaxLevel(150);
                        setHideChainQuests(false);
                        setHideCompletedQuests(false);
                        setSortBy('name');
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#ff6666',
                        border: '2px solid #ff6666',
                        color: '#000',
                        fontSize: '1.2em',
                        fontFamily: 'VT323, monospace',
                        cursor: 'pointer',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ff3333';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 102, 102, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ff6666';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    Clear Filters
                </button>
            </div>

            {/* Main Content - List or Detail View */}
            {viewMode === 'list' ? renderListContent() : renderDetailView()}

            {/* Required Quest Modal */}
            {requiredQuestModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setRequiredQuestModal(null)}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                            border: `3px solid ${getRarityColor(requiredQuestModal)}`,
                            borderRadius: '12px',
                            padding: '30px',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: `0 0 50px ${getRarityColor(requiredQuestModal)}60`,
                            fontFamily: 'VT323, monospace',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setRequiredQuestModal(null)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'transparent',
                                border: '2px solid #ff0000',
                                color: '#ff0000',
                                width: '40px',
                                height: '40px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1.5em',
                                fontFamily: 'VT323, monospace',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff0000';
                                e.currentTarget.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#ff0000';
                            }}
                        >
                            ✕
                        </button>

                        {/* Modal Header */}
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ 
                                color: '#ff6666', 
                                fontSize: '1.2em', 
                                marginBottom: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}>
                                ⛓️ Required Quest
                            </div>
                            <div style={{ 
                                fontSize: '4em', 
                                marginBottom: '15px',
                                filter: `drop-shadow(0 0 15px ${getRarityColor(requiredQuestModal)})`
                            }}>
                                {getQuestIcon(requiredQuestModal)}
                            </div>
                            <h2 style={{
                                fontSize: '2.2em',
                                color: getRarityColor(requiredQuestModal),
                                marginBottom: '10px',
                                textShadow: `0 0 15px ${getRarityColor(requiredQuestModal)}80`,
                                fontWeight: 'bold'
                            }}>
                                {requiredQuestModal.Name}
                            </h2>
                            {requiredQuestModal.NpcQuestGiver && (
                                <div style={{ 
                                    color: '#888', 
                                    fontSize: '1.3em',
                                    marginTop: '10px'
                                }}>
                                    👤 {requiredQuestModal.NpcQuestGiver}
                                </div>
                            )}
                        </div>

                        {/* Quest Info */}
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            padding: '15px',
                            marginBottom: '15px'
                        }}>
                            <div style={{ fontSize: '1.3em', lineHeight: '2', color: '#aaa' }}>
                                {requiredQuestModal.Level > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Level:</span>
                                        <span style={{ color: '#ffff00', fontWeight: 'bold' }}>{requiredQuestModal.Level}</span>
                                    </div>
                                )}
                                {requiredQuestModal.Experience > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Experience:</span>
                                        <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{requiredQuestModal.Experience.toLocaleString()}</span>
                                    </div>
                                )}
                                {requiredQuestModal.Gold > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>Gold:</span>
                                        <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{requiredQuestModal.Gold.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {requiredQuestModal.Description && requiredQuestModal.Description.trim() !== '' && (
                            <div className="quest-markdown" style={{
                                background: '#1a1a1a',
                                border: '2px solid #666',
                                borderRadius: '5px',
                                padding: '15px',
                                marginBottom: '15px',
                                fontSize: '1.2em',
                                color: '#ccc',
                                lineHeight: '1.8',
                                fontStyle: 'italic',
                                maxHeight: '150px',
                                overflowY: 'auto'
                            }}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {requiredQuestModal.Description}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Navigate Button */}
                        <button
                            onClick={() => navigateToRequiredQuest(requiredQuestModal)}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: '#00ff00',
                                border: '3px solid #00ff00',
                                color: '#000',
                                fontSize: '1.5em',
                                fontFamily: 'VT323, monospace',
                                cursor: 'pointer',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s',
                                boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#ffff00';
                                e.target.style.borderColor = '#ffff00';
                                e.target.style.boxShadow = '0 0 30px rgba(255, 255, 0, 0.8)';
                                e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#00ff00';
                                e.target.style.borderColor = '#00ff00';
                                e.target.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            📖 View Quest Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuestsPage;
