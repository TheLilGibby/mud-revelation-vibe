import React, { useState, useEffect, useMemo } from 'react';
import { useGameData } from '../contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GuideSubmissionForm from '../components/GuideSubmissionForm';

function GuidesPage({ onNavigateToItems, isActive }) {
    const { items: loadedItems, guides: loadedGuides } = useGameData();
    const [guidesData, setGuidesData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedBuildTypes, setSelectedBuildTypes] = useState([]);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [selectedItemData, setSelectedItemData] = useState(null);
    const [itemsDatabase, setItemsDatabase] = useState([]);
    const [showSubmissionForm, setShowSubmissionForm] = useState(() => {
        const saved = localStorage.getItem('revelationGuidesShowSubmissionForm');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [editingGuide, setEditingGuide] = useState(null);
    const [userGuides, setUserGuides] = useState([]);
    const [showUserGuidesOnly, setShowUserGuidesOnly] = useState(() => {
        const saved = localStorage.getItem('revelationGuidesShowUserGuidesOnly');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [viewMode, setViewMode] = useState('list');
    const [pinnedGuideIds, setPinnedGuideIds] = useState([]);
    const [shareNotification, setShareNotification] = useState(false);

    const getGuideId = (guide) => {
        if (!guide) return '';
        if (guide.id) return guide.id;

        const titlePart = guide.title ? guide.title.toLowerCase().replace(/\s+/g, '-') : 'guide';
        const authorPart = guide.author ? guide.author.toLowerCase().replace(/\s+/g, '-') : 'anonymous';
        return `fallback-${titlePart}-${authorPart}`;
    };

    const handleItemClick = (itemName) => {
        if (!itemName || !itemsDatabase.length) return;

        const foundItem = itemsDatabase.find(item =>
            item.Name?.toLowerCase() === itemName.toLowerCase()
        );

        if (foundItem) {
            setSelectedItemData(foundItem);
            setItemModalOpen(true);
        } else if (onNavigateToItems) {
            onNavigateToItems({ searchItem: itemName });
        }
    };

    const renderEquipmentLink = (itemName) => {
        if (!itemName) return null;

        return (
            <div
                style={{
                    color: '#ffaa00',
                    fontWeight: 'bold',
                    fontSize: '1.05em',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    transition: 'color 0.2s',
                    textAlign: 'center'
                }}
                onClick={() => handleItemClick(itemName)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffdd00';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ffaa00';
                }}
                title="Click to view item details"
            >
                {itemName}
            </div>
        );
    };

    useEffect(() => {
        const savedGuides = localStorage.getItem('userSubmittedGuides');
        if (!savedGuides) return;

        try {
            const parsed = JSON.parse(savedGuides);
            if (Array.isArray(parsed)) {
                setUserGuides(parsed);
            }
        } catch (error) {
            console.error('Error loading user guides:', error);
        }
    }, []);

    useEffect(() => {
        if (userGuides.length > 0) {
            localStorage.setItem('userSubmittedGuides', JSON.stringify(userGuides));
        } else {
            localStorage.removeItem('userSubmittedGuides');
        }
    }, [userGuides]);

    useEffect(() => {
        const savedPins = localStorage.getItem('pinnedGuideIds');
        if (!savedPins) return;

        try {
            const parsed = JSON.parse(savedPins);
            if (Array.isArray(parsed)) {
                setPinnedGuideIds(parsed);
            }
        } catch (error) {
            console.error('Error loading pinned guides:', error);
        }
    }, []);

    useEffect(() => {
        if (pinnedGuideIds.length > 0) {
            localStorage.setItem('pinnedGuideIds', JSON.stringify(pinnedGuideIds));
        } else {
            localStorage.removeItem('pinnedGuideIds');
        }
    }, [pinnedGuideIds]);

    // Save collapsible section states to localStorage
    useEffect(() => {
        localStorage.setItem('revelationGuidesShowSubmissionForm', JSON.stringify(showSubmissionForm));
    }, [showSubmissionForm]);

    useEffect(() => {
        localStorage.setItem('revelationGuidesShowUserGuidesOnly', JSON.stringify(showUserGuidesOnly));
    }, [showUserGuidesOnly]);

    // Initialize items from context
    useEffect(() => {
        if (loadedItems && loadedItems.length > 0) {
            console.log(`[GuidesPage] Using ${loadedItems.length} items from context`);
            setItemsDatabase(loadedItems);
        }
    }, [loadedItems]);

    // Initialize guides from context
    useEffect(() => {
        if (loadedGuides) {
            console.log(`[GuidesPage] Using guides from context`);
            setGuidesData(loadedGuides);

            const combined = [...(loadedGuides.guides || []), ...userGuides];

            // No filters selected by default - show all results
            // const allClasses = [...new Set(combined.map(guide => guide.characterClass).filter(Boolean))].sort();
            setSelectedClasses([]);

            // const allBuildTypes = [...new Set(combined.map(guide => guide.buildType).filter(Boolean))].sort();
            setSelectedBuildTypes([]);
        }
    }, [loadedGuides, userGuides]);

    // Handle URL parameters for direct guide links
    useEffect(() => {
        if (isLoading || !guidesData) return;
        
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const guideIdFromUrl = params.get('guide');
            
            if (guideIdFromUrl && !selectedGuide) {
                const combined = [...(guidesData.guides || []), ...userGuides];
                const guide = combined.find(g => getGuideId(g) === guideIdFromUrl);
                
                if (guide) {
                    setSelectedGuide(guide);
                    setViewMode('detail');
                }
            }
        }
    }, [isLoading, guidesData, userGuides, selectedGuide]);

    const combinedGuides = useMemo(() => {
        const officialGuides = guidesData?.guides || [];
        return [...officialGuides, ...userGuides];
    }, [guidesData, userGuides]);

    const guideClasses = useMemo(() => {
        return [...new Set(combinedGuides.map(guide => guide.characterClass).filter(Boolean))].sort();
    }, [combinedGuides]);

    const guideBuildTypes = useMemo(() => {
        return [...new Set(combinedGuides.map(guide => guide.buildType).filter(Boolean))].sort();
    }, [combinedGuides]);

    const filteredGuides = useMemo(() => {
        const baseGuides = showUserGuidesOnly ? userGuides : combinedGuides;
        if (!baseGuides || baseGuides.length === 0) return [];

        let result = [...baseGuides];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(guide => (
                guide.title?.toLowerCase().includes(term) ||
                guide.author?.toLowerCase().includes(term) ||
                guide.characterClass?.toLowerCase().includes(term) ||
                guide.buildType?.toLowerCase().includes(term)
            ));
        }

        if (selectedClasses.length > 0) {
            const availableClasses = [...new Set(baseGuides.map(guide => guide.characterClass).filter(Boolean))];
            if (selectedClasses.length < availableClasses.length) {
                result = result.filter(guide =>
                    guide.characterClass ? selectedClasses.includes(guide.characterClass) : false
                );
            }
        }

        if (selectedBuildTypes.length > 0) {
            const availableBuildTypes = [...new Set(baseGuides.map(guide => guide.buildType).filter(Boolean))];
            if (selectedBuildTypes.length < availableBuildTypes.length) {
                result = result.filter(guide =>
                    guide.buildType ? selectedBuildTypes.includes(guide.buildType) : false
                );
            }
        }

        const pinnedSet = new Set(pinnedGuideIds);
        const pinned = [];
        const unpinned = [];

        result.forEach(guide => {
            const guideId = getGuideId(guide);
            if (guideId && pinnedSet.has(guideId)) {
                pinned.push(guide);
            } else {
                unpinned.push(guide);
            }
        });

        return [...pinned, ...unpinned];
    }, [showUserGuidesOnly, userGuides, combinedGuides, searchTerm, selectedClasses, selectedBuildTypes, pinnedGuideIds]);

    const pinnedWithinFilterCount = useMemo(() => {
        if (!filteredGuides || filteredGuides.length === 0) return 0;
        return filteredGuides.reduce((count, guide) => {
            const guideId = getGuideId(guide);
            return guideId && pinnedGuideIds.includes(guideId) ? count + 1 : count;
        }, 0);
    }, [filteredGuides, pinnedGuideIds]);

    useEffect(() => {
        if (pinnedGuideIds.length === 0) return;
        const validIds = new Set(combinedGuides.map(guide => getGuideId(guide)).filter(Boolean));
        if (pinnedGuideIds.some(id => !validIds.has(id))) {
            setPinnedGuideIds(prev => prev.filter(id => validIds.has(id)));
        }
    }, [combinedGuides, pinnedGuideIds]);

    const toggleClass = (className) => {
        setSelectedClasses(prev => prev.includes(className)
            ? prev.filter(c => c !== className)
            : [...prev, className]
        );
    };

    const toggleBuildType = (buildType) => {
        setSelectedBuildTypes(prev => prev.includes(buildType)
            ? prev.filter(b => b !== buildType)
            : [...prev, buildType]
        );
    };

    const isGuidePinned = (guideId) => {
        if (!guideId) return false;
        return pinnedGuideIds.includes(guideId);
    };

    const handleTogglePin = (guideId) => {
        if (!guideId) return;
        setPinnedGuideIds(prev => prev.includes(guideId)
            ? prev.filter(id => id !== guideId)
            : [guideId, ...prev]
        );
    };

    const handleGuideClick = (guide) => {
        if (!guide) return;
        const guideId = getGuideId(guide);
        setSelectedGuide(guide);
        setViewMode('detail');
        
        // Update URL with guide ID for shareable links
        if (typeof window !== 'undefined') {
            if (guideId) {
                const url = new URL(window.location);
                url.searchParams.set('guide', guideId);
                window.history.pushState({}, '', url);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedGuide(null);
        
        // Clear URL parameters when going back to list
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('guide');
            window.history.pushState({}, '', url);
        }
    };

    const handleShareGuide = () => {
        if (!selectedGuide || typeof window === 'undefined') return;
        
        const guideId = getGuideId(selectedGuide);
        const url = new URL(window.location);
        url.searchParams.set('guide', guideId);
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

    const handleGuideSubmit = (guide) => {
        if (editingGuide) {
            setUserGuides(prev => prev.map(g => g.id === guide.id ? guide : g));
            setEditingGuide(null);
        } else {
            setUserGuides(prev => [...prev, guide]);
        }
        setShowSubmissionForm(false);
        setSelectedGuide(null);
        setViewMode('list');
    };

    const handleGuideEdit = (guide) => {
        if (!guide.userSubmitted) {
            alert('You can only edit user-submitted guides!');
            return;
        }
        setEditingGuide(guide);
        setShowSubmissionForm(true);
    };

    const handleGuideDelete = (guideId) => {
        const guide = userGuides.find(g => g.id === guideId);
        if (!guide) {
            alert('Only user-submitted guides can be deleted!');
            return;
        }

        if (window.confirm('Are you sure you want to delete this guide? This action cannot be undone.')) {
            setUserGuides(prev => prev.filter(g => g.id !== guideId));
            setPinnedGuideIds(prev => prev.filter(id => id !== guideId));
            if (selectedGuide?.id === guideId) {
                setSelectedGuide(null);
                setViewMode('list');
            }
        }
    };

    const handleExportGuides = () => {
        if (userGuides.length === 0) {
            alert('No user guides to export!');
            return;
        }

        const dataStr = JSON.stringify(userGuides, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revelation-user-guides-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportGuides = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (!Array.isArray(imported)) {
                        alert('Invalid guide file format!');
                        return;
                    }

                    const importedGuides = imported.map(guide => ({
                        ...guide,
                        id: `user-guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        userSubmitted: true,
                        lastUpdated: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                    }));

                    setUserGuides(prev => [...prev, ...importedGuides]);
                    alert(`Successfully imported ${importedGuides.length} guide(s)!`);
                } catch (error) {
                    console.error('Error importing guides:', error);
                    alert('Error importing guides. Please check the file format.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const renderSidebar = () => (
        <div style={{
            width: '350px',
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
                📍– Guides
            </h2>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em' }}>
                    📍 Search:
                </label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search guides..."
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

            {guideClasses.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em' }}>
                        🎓 Class:
                    </label>
                    <div style={{
                        background: '#2a2a2a',
                        border: '2px solid #00ff00',
                        borderRadius: '3px',
                        padding: '10px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {guideClasses.map(className => (
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
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {guideBuildTypes.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em' }}>
                        âš”ï¸ Build Type:
                    </label>
                    <div style={{
                        background: '#2a2a2a',
                        border: '2px solid #00ff00',
                        borderRadius: '3px',
                        padding: '10px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {guideBuildTypes.map(buildType => (
                            <label
                                key={buildType}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: selectedBuildTypes.includes(buildType) ? '#00ff0020' : 'transparent',
                                    border: `1px solid ${selectedBuildTypes.includes(buildType) ? '#00ff00' : '#555'}`,
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '1.1em'
                                }}
                                onMouseEnter={(e) => {
                                    if (!selectedBuildTypes.includes(buildType)) {
                                        e.currentTarget.style.background = '#00ff0010';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!selectedBuildTypes.includes(buildType)) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedBuildTypes.includes(buildType)}
                                    onChange={() => toggleBuildType(buildType)}
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
                                    color: selectedBuildTypes.includes(buildType) ? '#00ff00' : '#aaa'
                                }}>
                                    {buildType}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '15px' }}>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: showUserGuidesOnly ? '#00ff0020' : '#2a2a2a',
                        border: `2px solid ${showUserGuidesOnly ? '#00ff00' : '#666'}`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '1.1em'
                    }}
                >
                    <input
                        type="checkbox"
                        checked={showUserGuidesOnly}
                        onChange={(e) => setShowUserGuidesOnly(e.target.checked)}
                        style={{
                            width: '18px',
                            height: '18px',
                            marginRight: '10px',
                            cursor: 'pointer',
                            accentColor: '#00ff00'
                        }}
                    />
                    <span style={{ color: showUserGuidesOnly ? '#00ff00' : '#aaa' }}>
                        👤 Show User Guides Only ({userGuides.length})
                    </span>
                </label>
            </div>

            <button
                onClick={() => setShowSubmissionForm(true)}
                style={{
                    width: '100%',
                    padding: '15px',
                    background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
                    border: '2px solid #00ff00',
                    color: '#000',
                    fontSize: '1.3em',
                    fontFamily: 'VT323, monospace',
                    cursor: 'pointer',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    marginBottom: '15px',
                    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.3)';
                }}
            >
                📍 Submit Your Guide
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <button
                    onClick={handleImportGuides}
                    style={{
                        padding: '10px',
                        background: '#2a2a2a',
                        border: '2px solid #00aaff',
                        color: '#00aaff',
                        fontSize: '1.1em',
                        fontFamily: 'VT323, monospace',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#00aaff';
                        e.target.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#2a2a2a';
                        e.target.style.color = '#00aaff';
                    }}
                    title="Import guides from JSON file"
                >
                    📍¥ Import
                </button>
                <button
                    onClick={handleExportGuides}
                    style={{
                        padding: '10px',
                        background: '#2a2a2a',
                        border: '2px solid #00aaff',
                        color: '#00aaff',
                        fontSize: '1.1em',
                        fontFamily: 'VT323, monospace',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#00aaff';
                        e.target.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#2a2a2a';
                        e.target.style.color = '#00aaff';
                    }}
                    title="Export your guides to JSON file"
                >
                    📍¤ Export
                </button>
            </div>

            <button
                onClick={() => {
                    setSearchTerm('');
                    setSelectedClasses([]);
                    setSelectedBuildTypes([]);
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
    );

    const renderListContent = () => (
        <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div style={{
                    flex: '1 1 260px',
                    minWidth: '220px',
                    background: '#1a1a1a',
                    border: '2px solid #00ff00',
                    borderRadius: '6px',
                    padding: '16px',
                    boxShadow: '0 0 15px rgba(0, 255, 0, 0.15)'
                }}>
                    <div style={{ fontSize: '1.4em', marginBottom: '6px', color: '#00ff00' }}>
                        Guide Summary
                    </div>
                    <div style={{ color: '#ccc', fontSize: '1.1em' }}>
                        Showing <span style={{ color: '#00ff00' }}>{filteredGuides.length}</span> of{' '}
                        <span style={{ color: '#ffff00' }}>{totalAvailableGuides}</span> guides
                    </div>
                </div>

                <div style={{
                    flex: '1 1 260px',
                    minWidth: '220px',
                    background: '#1a1a1a',
                    border: '2px solid #ffaa00',
                    borderRadius: '6px',
                    padding: '16px',
                    boxShadow: '0 0 15px rgba(255, 170, 0, 0.18)'
                }}>
                    <div style={{ fontSize: '1.4em', marginBottom: '6px', color: '#ffaa00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📌 Pinned Guides
                    </div>
                    <div style={{ color: '#ccc', fontSize: '1.1em' }}>
                        {pinnedWithinFilterCount} pinned in view
                        {pinnedTotal > 0 && (
                            <span style={{ color: '#ffaa00' }}> ({pinnedTotal} saved locally)</span>
                        )}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.95em', marginTop: '6px', lineHeight: 1.4 }}>
                        Use the pin icon in the table's top-left column to keep favorite guides at the top.
                        Pins stay on this device only.
                    </div>
                </div>
            </div>

            <div style={{
                background: '#101010',
                border: '2px solid #00ff00',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 0 25px rgba(0, 255, 0, 0.15)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.1em' }}>
                    <thead>
                        <tr style={{
                            background: '#00ff0025',
                            color: '#00ff00',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center', borderBottom: '2px solid #00ff00' }}>📌</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Guide</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Author</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Class</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Build Type</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Updated</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #00ff00' }}>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGuides.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{
                                    padding: '32px 20px',
                                    textAlign: 'center',
                                    color: '#888',
                                    fontSize: '1.2em'
                                }}>
                                    No guides found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredGuides.map(guide => {
                                const guideId = getGuideId(guide);
                                const pinned = isGuidePinned(guideId);
                                const baseRowBackground = pinned ? '#112a11' : 'transparent';

                                return (
                                    <tr
                                        key={guideId}
                                        onClick={() => handleGuideClick(guide)}
                                        style={{
                                            cursor: 'pointer',
                                            background: baseRowBackground,
                                            borderBottom: '1px solid #00ff0020',
                                            transition: 'all 0.2s ease',
                                            boxShadow: 'none',
                                            transform: 'translateY(0)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = pinned ? '#1b3b1b' : '#1a1a1a';
                                            e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 255, 0, 0.18)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = baseRowBackground;
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleTogglePin(guideId);
                                                }}
                                                style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '6px',
                                                    border: `2px solid ${pinned ? '#ffaa00' : '#444'}`,
                                                    background: pinned ? '#ffaa0020' : 'transparent',
                                                    color: pinned ? '#ffaa00' : '#888',
                                                    cursor: 'pointer',
                                                    fontSize: '1.2em',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = pinned ? '#ffaa0040' : '#222';
                                                    e.currentTarget.style.color = '#ffdd55';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = pinned ? '#ffaa0020' : 'transparent';
                                                    e.currentTarget.style.color = pinned ? '#ffaa00' : '#888';
                                                }}
                                                title={pinned ? 'Unpin guide' : 'Pin guide to top'}
                                            >
                                                {pinned ? '📌' : '📍'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '14px', color: '#fff', fontWeight: 'bold' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ color: guide.userSubmitted ? '#00ff00' : '#00aaff' }}>
                                                    {guide.title || 'Untitled Guide'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9em', color: '#888' }}>
                                                    {guide.version && <span>v{guide.version}</span>}
                                                    {pinned && <span style={{ color: '#ffaa00' }}>Pinned</span>}
                                                    {guide.userSubmitted && <span style={{ color: '#00ff00' }}>User submitted</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px', color: '#ccc' }}>{guide.author || 'Unknown'}</td>
                                        <td style={{ padding: '14px', color: '#ccc' }}>{guide.characterClass || '—'}</td>
                                        <td style={{ padding: '14px', color: '#ccc' }}>{guide.buildType || '—'}</td>
                                        <td style={{ padding: '14px', color: '#ccc' }}>{guide.lastUpdated || '—'}</td>
                                        <td style={{ padding: '14px', color: guide.userSubmitted ? '#00ff00' : '#00aaff' }}>
                                            {guide.userSubmitted ? 'User' : 'Official'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDetailView = () => {
        if (!selectedGuide) {
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
                    Select a guide from the table to view the full write-up.
                </div>
            );
        }

        const guideId = getGuideId(selectedGuide);
        const pinned = isGuidePinned(guideId);

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
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                            â† Back to Guides
                        </button>
                        <button
                            onClick={() => handleTogglePin(guideId)}
                            style={{
                                padding: '10px 18px',
                                background: pinned ? '#ffaa00' : 'transparent',
                                border: `2px solid ${pinned ? '#ffaa00' : '#ffaa00'}`,
                                borderRadius: '5px',
                                color: pinned ? '#000' : '#ffaa00',
                                fontSize: '1.1em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: pinned ? '0 0 20px rgba(255, 170, 0, 0.4)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ffaa00';
                                e.currentTarget.style.color = '#000';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 170, 0, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = pinned ? '#ffaa00' : 'transparent';
                                e.currentTarget.style.color = pinned ? '#000' : '#ffaa00';
                                e.currentTarget.style.boxShadow = pinned ? '0 0 20px rgba(255, 170, 0, 0.4)' : 'none';
                            }}
                        >
                            {pinned ? '📌 Pinned' : '📍 Pin Guide'}
                        </button>
                        <button
                            onClick={handleShareGuide}
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
                            {shareNotification ? '✓ Link Copied!' : '🔗 Share Guide'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {selectedGuide.userSubmitted && (
                            <>
                                <button
                                    onClick={() => handleGuideEdit(selectedGuide)}
                                    style={{
                                        padding: '10px 16px',
                                        background: 'transparent',
                                        border: '2px solid #00aaff',
                                        borderRadius: '5px',
                                        color: '#00aaff',
                                        fontSize: '1.1em',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#00aaff';
                                        e.currentTarget.style.color = '#000';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 170, 255, 0.6)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#00aaff';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    âœï¸ Edit
                                </button>
                                <button
                                    onClick={() => handleGuideDelete(selectedGuide.id)}
                                    style={{
                                        padding: '10px 16px',
                                        background: 'transparent',
                                        border: '2px solid #ff6600',
                                        borderRadius: '5px',
                                        color: '#ff6600',
                                        fontSize: '1.1em',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ff6600';
                                        e.currentTarget.style.color = '#000';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 102, 0, 0.6)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#ff6600';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    🗑️ Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div style={{
                    flex: '1 1 auto',
                    overflowY: 'auto',
                    background: '#0a0a0a',
                    border: `4px solid ${selectedGuide.userSubmitted ? '#00ff00' : '#00aaff'}`,
                    borderRadius: '8px',
                    padding: '30px 40px',
                    boxShadow: `0 0 30px rgba(${selectedGuide.userSubmitted ? '0, 255, 0' : '0, 170, 255'}, 0.18)`
                }}>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        paddingBottom: '25px',
                        borderBottom: `3px solid ${selectedGuide.userSubmitted ? '#00ff00' : '#00aaff'}`
                    }}>
                        {(selectedGuide.userSubmitted || pinned) && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                marginBottom: '15px'
                            }}>
                                {selectedGuide.userSubmitted && (
                                    <div style={{
                                        background: '#00ff00',
                                        color: '#000',
                                        padding: '6px 12px',
                                        borderRadius: '3px',
                                        fontSize: '1.1em',
                                        fontWeight: 'bold'
                                    }}>
                                        👤 USER SUBMITTED GUIDE
                                    </div>
                                )}
                                {pinned && (
                                    <div style={{
                                        background: '#ffaa00',
                                        color: '#000',
                                        padding: '6px 12px',
                                        borderRadius: '3px',
                                        fontSize: '1.1em',
                                        fontWeight: 'bold'
                                    }}>
                                        📌 PINNED GUIDE
                                    </div>
                                )}
                            </div>
                        )}

                        <h2 style={{
                            fontSize: '2.5em',
                            color: selectedGuide.userSubmitted ? '#00ff00' : '#00aaff',
                            marginBottom: '12px',
                            textShadow: `0 0 15px rgba(${selectedGuide.userSubmitted ? '0, 255, 0' : '0, 170, 255'}, 0.8)`
                        }}>
                            {selectedGuide.title}
                        </h2>
                        <div style={{ color: '#888', fontSize: '1.3em', marginBottom: '10px' }}>
                            by {selectedGuide.author}
                        </div>
                        {selectedGuide.contact && (
                            <div style={{ color: '#666', fontSize: '1.1em', marginBottom: '10px' }}>
                                {selectedGuide.contact}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px', flexWrap: 'wrap' }}>
                            <div style={{
                                padding: '8px 16px',
                                background: '#00ff0020',
                                border: '2px solid #00ff00',
                                borderRadius: '5px',
                                color: '#00ff00'
                            }}>
                                🎓 {selectedGuide.characterClass}
                            </div>
                            <div style={{
                                padding: '8px 16px',
                                background: '#ffaa0020',
                                border: '2px solid #ffaa00',
                                borderRadius: '5px',
                                color: '#ffaa00'
                            }}>
                                âš”ï¸ {selectedGuide.buildType}
                            </div>
                        </div>
                    </div>

                    {/* Guide Content */}
                    {selectedGuide.markdownContent ? (
                        /* New markdown-based guides */
                        <div style={{
                            background: '#1a1a1a',
                            border: '2px solid #00aaff',
                            borderRadius: '8px',
                            padding: '30px',
                            marginBottom: '20px',
                            color: '#ccc',
                            fontSize: '1.2em',
                            lineHeight: '1.8'
                        }}>
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({node, ...props}) => <h1 style={{ color: '#00ff00', fontSize: '2.5em', marginTop: '30px', marginBottom: '15px', borderBottom: '3px solid #00ff0040', paddingBottom: '10px' }} {...props} />,
                                    h2: ({node, ...props}) => <h2 style={{ color: '#00aaff', fontSize: '2em', marginTop: '25px', marginBottom: '12px', borderBottom: '2px solid #00aaff40', paddingBottom: '8px' }} {...props} />,
                                    h3: ({node, ...props}) => <h3 style={{ color: '#ffaa00', fontSize: '1.6em', marginTop: '20px', marginBottom: '10px' }} {...props} />,
                                    p: ({node, ...props}) => <p style={{ marginBottom: '15px' }} {...props} />,
                                    ul: ({node, ...props}) => <ul style={{ marginLeft: '25px', marginBottom: '15px' }} {...props} />,
                                    ol: ({node, ...props}) => <ol style={{ marginLeft: '25px', marginBottom: '15px' }} {...props} />,
                                    li: ({node, ...props}) => <li style={{ marginBottom: '8px' }} {...props} />,
                                    code: ({node, inline, ...props}) => inline ? 
                                        <code style={{ background: '#0a0a0a', padding: '2px 6px', borderRadius: '3px', color: '#00ff00', fontFamily: 'monospace' }} {...props} /> :
                                        <code style={{ display: 'block', background: '#0a0a0a', padding: '15px', borderRadius: '5px', overflowX: 'auto', color: '#00ff00', fontFamily: 'monospace', border: '1px solid #00ff0040' }} {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid #00aaff', paddingLeft: '20px', marginLeft: '0', fontStyle: 'italic', color: '#aaa' }} {...props} />,
                                    a: ({node, ...props}) => <a style={{ color: '#00aaff', textDecoration: 'underline' }} {...props} />,
                                    strong: ({node, ...props}) => <strong style={{ color: '#ffaa00' }} {...props} />,
                                    table: ({node, ...props}) => <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '15px' }} {...props} />,
                                    th: ({node, ...props}) => <th style={{ border: '1px solid #00ff0040', padding: '10px', background: '#0a0a0a', color: '#00ff00' }} {...props} />,
                                    td: ({node, ...props}) => <td style={{ border: '1px solid #00ff0040', padding: '10px' }} {...props} />,
                                }}
                            >
                                {selectedGuide.markdownContent}
                            </ReactMarkdown>
                        </div>
                    ) : selectedGuide.sections && selectedGuide.sections.map((section, idx) => (
                        /* Legacy section-based guides */
                        <div key={idx} style={{
                            background: '#1a1a1a',
                            border: '2px solid #00aaff',
                            borderRadius: '5px',
                            padding: '20px',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                color: '#00aaff',
                                fontSize: '1.8em',
                                marginBottom: '15px',
                                borderBottom: '2px solid #00aaff40',
                                paddingBottom: '10px'
                            }}>
                                {section.title}
                            </h3>
                            <div style={{
                                color: '#ccc',
                                fontSize: '1.2em',
                                lineHeight: '1.8',
                                whiteSpace: 'pre-wrap'
                            }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {section.content}
                                </ReactMarkdown>
                            </div>

                            {section.skills && section.skills.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    {section.skills.map((skill, skillIdx) => (
                                        <div key={skillIdx} style={{
                                            background: '#0a0a0a',
                                            border: '1px solid #00ff0040',
                                            borderRadius: '3px',
                                            padding: '10px',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                                                {skill.name} {skill.maxLevel && `(Max: ${skill.maxLevel})`}
                                            </div>
                                            {skill.description && (
                                                <div style={{ color: '#aaa', fontSize: '0.95em', marginTop: '5px' }}>
                                                    {skill.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {section.spells && section.spells.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    {section.spells.map((spell, spellIdx) => (
                                        <div key={spellIdx} style={{
                                            background: '#0a0a0a',
                                            border: '1px solid #00aaff40',
                                            borderRadius: '3px',
                                            padding: '10px',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ color: '#00aaff', fontWeight: 'bold' }}>
                                                {spell.name} {spell.level && `(Lvl ${spell.level})`}
                                            </div>
                                            {spell.description && (
                                                <div style={{ color: '#aaa', fontSize: '0.95em', marginTop: '5px' }}>
                                                    {spell.description}
                                                </div>
                                            )}
                                    	</div>
                                    ))}
                                </div>
                            )}

                            {section.slots && (
                                <div style={{ marginTop: '15px' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                                        border: '3px solid #ffaa00',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        marginBottom: '20px',
                                        boxShadow: '0 0 20px rgba(255, 170, 0, 0.3), inset 0 0 30px rgba(255, 170, 0, 0.1)'
                                    }}>
                                        <h4 style={{
                                            color: '#ffaa00',
                                            fontSize: '1.5em',
                                            marginBottom: '20px',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px'
                                        }}>
                                            âš”ï¸ Recommended Equipment âš”ï¸
                                        </h4>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 2fr 1fr',
                                            gridTemplateRows: 'auto auto auto auto auto auto',
                                            gap: '12px',
                                            maxWidth: '600px',
                                            margin: '0 auto'
                                        }}>
                                            {section.slots.head && (
                                                <div style={{ gridColumn: '2', gridRow: '1', textAlign: 'center' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>HEAD</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.head) ? section.slots.head[0] : section.slots.head)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.neck && (
                                                <div style={{ gridColumn: '2', gridRow: '2', textAlign: 'center' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>NECK</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.neck) ? section.slots.neck[0] : section.slots.neck)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots['main hand'] && (
                                                <div style={{ gridColumn: '1', gridRow: '3' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '90px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>MAIN HAND</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots['main hand']) ? section.slots['main hand'][0] : section.slots['main hand'])}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.chest && (
                                                <div style={{ gridColumn: '2', gridRow: '3' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '90px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>CHEST</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.chest) ? section.slots.chest[0] : section.slots.chest)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots['off hand'] && (
                                                <div style={{ gridColumn: '3', gridRow: '3' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '90px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>OFF HAND</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots['off hand']) ? section.slots['off hand'][0] : section.slots['off hand'])}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.wrist && (
                                                <div style={{ gridColumn: '1', gridRow: '4' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>WRIST</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.wrist) ? section.slots.wrist[0] : section.slots.wrist)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.hands && (
                                                <div style={{ gridColumn: '2', gridRow: '4' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>HANDS</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.hands) ? section.slots.hands[0] : section.slots.hands)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.finger && (
                                                <div style={{ gridColumn: '3', gridRow: '4' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>FINGER</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.finger) ? section.slots.finger[0] : section.slots.finger)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.legs && (
                                                <div style={{ gridColumn: '2', gridRow: '5' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>LEGS</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.legs) ? section.slots.legs[0] : section.slots.legs)}
                                                    </div>
                                                </div>
                                            )}

                                            {section.slots.feet && (
                                                <div style={{ gridColumn: '2', gridRow: '6' }}>
                                                    <div style={{
                                                        background: '#2a2a2a',
                                                        border: '2px solid #ffaa00',
                                                        borderRadius: '5px',
                                                        padding: '12px',
                                                        minHeight: '75px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ color: '#888', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>FEET</div>
                                                        {renderEquipmentLink(Array.isArray(section.slots.feet) ? section.slots.feet[0] : section.slots.feet)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '20px', padding: '15px', background: '#0a0a0a', borderRadius: '5px', border: '1px solid #ffaa0040' }}>
                                            <div style={{ color: '#ffaa00', fontSize: '1.2em', marginBottom: '10px', fontWeight: 'bold' }}>
                                                📍‹ All Equipment Slots:
                                            </div>
                                            {Object.entries(section.slots).map(([slotName, items], slotIdx) => (
                                                <div key={slotIdx} style={{
                                                    padding: '8px',
                                                    marginBottom: '5px',
                                                    background: '#1a1a1a',
                                                    borderRadius: '3px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{
                                                        color: '#ffaa00',
                                                        fontWeight: 'bold',
                                                        textTransform: 'capitalize',
                                                        minWidth: '100px'
                                                    }}>
                                                        {slotName}:
                                                    </div>
                                                    <div style={{ color: '#ccc', flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                                        {Array.isArray(items) ? (
                                                            items.map((item, itemIdx) => (
                                                                <React.Fragment key={itemIdx}>
                                                                    <span
                                                                        style={{
                                                                            color: '#ffaa00',
                                                                            cursor: 'pointer',
                                                                            textDecoration: 'underline',
                                                                            transition: 'color 0.2s'
                                                                        }}
                                                                        onClick={() => handleItemClick(item)}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.color = '#ffdd00';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.color = '#ffaa00';
                                                                        }}
                                                                        title="Click to view item details"
                                                                    >
                                                                        {item}
                                                                    </span>
                                                                    {itemIdx < items.length - 1 && <span style={{ color: '#666' }}>,</span>}
                                                                </React.Fragment>
                                                            ))
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    color: '#ffaa00',
                                                                    cursor: 'pointer',
                                                                    textDecoration: 'underline',
                                                                    transition: 'color 0.2s'
                                                                }}
                                                                onClick={() => handleItemClick(items)}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.color = '#ffdd00';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.color = '#ffaa00';
                                                                }}
                                                                title="Click to view item details"
                                                            >
                                                                {items}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {section.notes && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '12px',
                                    background: '#0a0a0a',
                                    border: '1px solid #666',
                                    borderRadius: '3px',
                                    color: '#aaa',
                                    fontSize: '1.05em',
                                    fontStyle: 'italic'
                                }}>
                                    â„¹ï¸ {section.notes}
                                </div>
                            )}

                            {section.recommendations && typeof section.recommendations === 'string' && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '12px',
                                    background: '#0a0a0a',
                                    border: '1px solid #00ff0040',
                                    borderRadius: '3px',
                                    color: '#aaa',
                                    fontSize: '1.05em'
                                }}>
                                    💡 {section.recommendations}
                                </div>
                            )}

                            {section.spellLines && section.spellLines.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    {section.spellLines.map((spellLine, lineIdx) => (
                                        <div key={lineIdx} style={{
                                            marginBottom: '15px',
                                            background: '#0a0a0a',
                                            border: '1px solid #00aaff40',
                                            borderRadius: '3px',
                                            padding: '12px'
                                        }}>
                                            <div style={{
                                                color: '#00aaff',
                                                fontWeight: 'bold',
                                                fontSize: '1.15em',
                                                marginBottom: '10px',
                                                borderBottom: '1px solid #00aaff20',
                                                paddingBottom: '5px'
                                            }}>
                                                {spellLine.line}
                                            </div>
                                            {spellLine.spells && spellLine.spells.map((spell, spellIdx) => (
                                                <div key={spellIdx} style={{
                                                    padding: '8px',
                                                    marginBottom: '8px',
                                                    background: '#151515',
                                                    borderLeft: '3px solid #00aaff',
                                                    paddingLeft: '12px'
                                                }}>
                                                    <div style={{ color: '#00aaff', fontWeight: 'bold' }}>
                                                        {spell.name} {spell.level && `(Level ${spell.level})`}
                                                    </div>
                                                    {spell.effects && (
                                                        <div style={{ color: '#aaa', fontSize: '0.95em', marginTop: '5px' }}>
                                                            {Object.entries(spell.effects).map(([key, value]) => (
                                                                <div key={key} style={{ marginLeft: '10px' }}>
                                                                    • {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{
                        textAlign: 'center',
                        padding: '15px',
                        background: '#1a1a1a',
                        border: '2px solid #666',
                        borderRadius: '5px',
                        color: '#888',
                        fontSize: '1.1em'
                    }}>
                        {selectedGuide.lastUpdated && (
                            <div style={{ marginBottom: '8px' }}>
                                Last Updated: {selectedGuide.lastUpdated}
                            </div>
                        )}
                        {selectedGuide.version && (
                            <div style={{ color: '#00aaff' }}>
                                Guide Version: {selectedGuide.version}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const totalAvailableGuides = showUserGuidesOnly ? userGuides.length : combinedGuides.length;
    const pinnedTotal = pinnedGuideIds.length;

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
                    <div style={{ marginBottom: '20px' }}>â³</div>
                    <div>Loading Guides...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: '#0a0a0a',
            color: '#00ff00',
            display: 'flex',
            fontFamily: 'VT323, monospace',
            overflow: 'hidden',
            position: 'relative',
            flex: '1 1 auto',
            width: '100%',
            minHeight: 0
        }}>
            {renderSidebar()}
            {viewMode === 'list' ? renderListContent() : renderDetailView()}

            {itemModalOpen && selectedItemData && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setItemModalOpen(false)}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                            border: '3px solid #00aaff',
                            borderRadius: '10px',
                            padding: '30px',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 0 40px rgba(0, 170, 255, 0.6), inset 0 0 30px rgba(0, 170, 255, 0.1)',
                            fontFamily: 'VT323, monospace'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setItemModalOpen(false)}
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
                            âœ•
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '25px', paddingRight: '40px' }}>
                            <h2 style={{
                                fontSize: '2.2em',
                                color: '#00aaff',
                                marginBottom: '10px',
                                textShadow: '0 0 15px rgba(0, 170, 255, 0.8)'
                            }}>
                                {selectedItemData.Name}
                            </h2>
                            <div style={{ color: '#888', fontSize: '1.2em' }}>
                                {selectedItemData.Type} {selectedItemData.WeaponType && `- ${selectedItemData.WeaponType}`}
                                {selectedItemData.Slot && `(${selectedItemData.Slot})`}
                            </div>
                        </div>

                        <div style={{
                            background: '#0a0a0a',
                            border: '2px solid #00ff00',
                            borderRadius: '5px',
                            padding: '15px',
                            marginBottom: '15px'
                        }}>
                            <h3 style={{ color: '#00ff00', fontSize: '1.5em', marginBottom: '10px' }}>Stats:</h3>
                            <div style={{ fontSize: '1.2em', lineHeight: '1.8', color: '#aaa' }}>
                                {selectedItemData.Level > 0 && (
                                    <div>Level: <span style={{ color: '#ffff00' }}>{selectedItemData.Level}</span></div>
                                )}
                                {selectedItemData.Value > 0 && (
                                    <div>Value: <span style={{ color: '#ffaa00' }}>{selectedItemData.Value.toLocaleString()}</span></div>
                                )}
                                {selectedItemData.Damage > 0 && (
                                    <div>Damage: <span style={{ color: '#ff6600' }}>{selectedItemData.Damage}</span></div>
                                )}
                                {selectedItemData.ArmorClass > 0 && (
                                    <div>AC: <span style={{ color: '#00aaff' }}>{selectedItemData.ArmorClass}</span></div>
                                )}
                                {selectedItemData.Weight > 0 && (
                                    <div>Weight: <span style={{ color: '#ccc' }}>{selectedItemData.Weight}</span></div>
                                )}
                            </div>
                        </div>

                        {selectedItemData.ItemEffects && selectedItemData.ItemEffects.length > 0 && (
                            <div style={{
                                background: '#0a0a0a',
                                border: '2px solid #ffaa00',
                                borderRadius: '5px',
                                padding: '15px',
                                marginBottom: '15px'
                            }}>
                                <h3 style={{ color: '#ffaa00', fontSize: '1.5em', marginBottom: '10px' }}>Effects:</h3>
                                <div style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#ccc' }}>
                                    {selectedItemData.ItemEffects.filter(e => e && e.trim()).map((effect, idx) => (
                                        <div key={idx} style={{
                                            padding: '5px 0',
                                            borderBottom: idx < selectedItemData.ItemEffects.length - 1 ? '1px solid #333' : 'none'
                                        }}>
                                            • {effect}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(selectedItemData.ProcSpellName || selectedItemData.UsableSpell) && (
                            <div style={{
                                background: '#0a0a0a',
                                border: '2px solid #ff00ff',
                                borderRadius: '5px',
                                padding: '15px',
                                marginBottom: '15px'
                            }}>
                                <h3 style={{ color: '#ff00ff', fontSize: '1.5em', marginBottom: '10px' }}>Special:</h3>
                                <div style={{ fontSize: '1.1em', color: '#ccc' }}>
                                    {selectedItemData.ProcSpellName && (
                                        <div>âš¡ Proc: {selectedItemData.ProcSpellName}</div>
                                    )}
                                    {selectedItemData.UsableSpell && (
                                        <div>âœ¨ Usable: {selectedItemData.UsableSpell}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedItemData.Description && (
                            <div style={{
                                background: '#0a0a0a',
                                border: '2px solid #666',
                                borderRadius: '5px',
                                padding: '15px',
                                marginBottom: '15px',
                                fontSize: '1.1em',
                                color: '#ccc',
                                lineHeight: '1.6',
                                fontStyle: 'italic'
                            }}>
                                {selectedItemData.Description}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (onNavigateToItems) {
                                    onNavigateToItems({ searchItem: selectedItemData.Name });
                                }
                                setItemModalOpen(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
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
                                marginTop: '15px'
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
                            🗂️ View Full Details in Items Page
                        </button>
                    </div>
                </div>
            )}

            {showSubmissionForm && (
                <GuideSubmissionForm
                    onClose={() => {
                        setShowSubmissionForm(false);
                        setEditingGuide(null);
                    }}
                    onSubmit={handleGuideSubmit}
                    editingGuide={editingGuide}
                />
            )}
        </div>
    );
}

export default GuidesPage;
