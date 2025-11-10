import React, { useState, useEffect, useRef } from 'react';
import { useGameData } from '../contexts/DataContext';

const GlobalSearch = ({ onNavigate }) => {
    const { mobs, items, quests, guides, worldData } = useGameData();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchRef = useRef(null);
    const resultsRef = useRef(null);

    // Fuzzy search function
    const fuzzyMatch = (text, query) => {
        if (!text || !query) return { matches: false, score: 0 };
        
        text = text.toLowerCase();
        query = query.toLowerCase();
        
        // Exact match gets highest score
        if (text.includes(query)) {
            return { matches: true, score: 1000 - text.indexOf(query) };
        }
        
        // Fuzzy match - check if all query characters appear in order
        let queryIndex = 0;
        let lastMatchIndex = -1;
        let score = 0;
        
        for (let i = 0; i < text.length && queryIndex < query.length; i++) {
            if (text[i] === query[queryIndex]) {
                // Bonus for consecutive matches
                if (i === lastMatchIndex + 1) {
                    score += 10;
                } else {
                    score += 5;
                }
                lastMatchIndex = i;
                queryIndex++;
            }
        }
        
        if (queryIndex === query.length) {
            return { matches: true, score };
        }
        
        return { matches: false, score: 0 };
    };

    // Search across all data types
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const searchResults = [];

        // Search Mobs
        if (mobs && mobs.length > 0) {
            mobs.forEach(mob => {
                const nameMatch = fuzzyMatch(mob.Name, searchQuery);
                if (nameMatch.matches) {
                    searchResults.push({
                        type: 'mob',
                        id: mob.Id,
                        name: mob.Name,
                        subtitle: mob.Zone || 'Unknown Zone',
                        icon: '🐉',
                        score: nameMatch.score,
                        data: mob
                    });
                }
            });
        }

        // Search Items
        if (items && items.length > 0) {
            items.forEach(item => {
                const nameMatch = fuzzyMatch(item.Name, searchQuery);
                if (nameMatch.matches) {
                    searchResults.push({
                        type: 'item',
                        id: item.Id,
                        name: item.Name,
                        subtitle: item.Type || 'Item',
                        icon: '⚔️',
                        score: nameMatch.score,
                        data: item
                    });
                }
            });
        }

        // Search Zones
        if (worldData && worldData.Zones) {
            Object.keys(worldData.Zones).forEach(zoneKey => {
                const zone = worldData.Zones[zoneKey];
                const nameMatch = fuzzyMatch(zone.ZoneName, searchQuery);
                if (nameMatch.matches) {
                    searchResults.push({
                        type: 'zone',
                        id: zoneKey,
                        name: zone.ZoneName,
                        subtitle: `${zone.TotalRooms} rooms`,
                        icon: '🗺️',
                        score: nameMatch.score,
                        data: zone
                    });
                }
            });
        }

        // Search Quests
        if (quests && quests.length > 0) {
            quests.forEach(quest => {
                const nameMatch = fuzzyMatch(quest.Name, searchQuery);
                if (nameMatch.matches) {
                    searchResults.push({
                        type: 'quest',
                        id: quest.Id,
                        name: quest.Name,
                        subtitle: quest.Zone || 'Quest',
                        icon: '📜',
                        score: nameMatch.score,
                        data: quest
                    });
                }
            });
        }

        // Search Guides
        if (guides && guides.guides && guides.guides.length > 0) {
            guides.guides.forEach((guide, index) => {
                const titleMatch = fuzzyMatch(guide.title, searchQuery);
                const categoryMatch = fuzzyMatch(guide.category, searchQuery);
                
                if (titleMatch.matches || categoryMatch.matches) {
                    searchResults.push({
                        type: 'guide',
                        id: index,
                        name: guide.title,
                        subtitle: guide.category,
                        icon: '📖',
                        score: Math.max(titleMatch.score, categoryMatch.score),
                        data: guide
                    });
                }
            });
        }

        // Sort by score (highest first) and limit results
        searchResults.sort((a, b) => b.score - a.score);
        setResults(searchResults.slice(0, 50)); // Limit to 50 results
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(0);

    }, [searchQuery, mobs, items, quests, guides, worldData]);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen || results.length === 0) {
            if (e.key === 'Escape') {
                setSearchQuery('');
                setIsOpen(false);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleResultClick(results[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setSearchQuery('');
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    // Auto-scroll selected item into view
    useEffect(() => {
        if (resultsRef.current && isOpen) {
            const selectedElement = resultsRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedIndex, isOpen]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result) => {
        setSearchQuery('');
        setIsOpen(false);
        
        if (onNavigate) {
            onNavigate(result);
        }
    };

    return (
        <div className="global-search" ref={searchRef}>
            <div className="global-search-input-wrapper">
                <span className="global-search-icon">🔍</span>
                <input
                    type="text"
                    className="global-search-input"
                    placeholder="Search mobs, items, zones, quests, guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(searchQuery.trim() !== '' && results.length > 0)}
                />
                {searchQuery && (
                    <button
                        className="global-search-clear"
                        onClick={() => {
                            setSearchQuery('');
                            setIsOpen(false);
                        }}
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="global-search-results" ref={resultsRef}>
                    {results.map((result, index) => (
                        <div
                            key={`${result.type}-${result.id}-${index}`}
                            className={`global-search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleResultClick(result)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <span className="result-icon">{result.icon}</span>
                            <div className="result-content">
                                <div className="result-name">{result.name}</div>
                                <div className="result-subtitle">
                                    <span className="result-type">{result.type}</span>
                                    {result.subtitle && <span className="result-separator">•</span>}
                                    <span className="result-info">{result.subtitle}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;

