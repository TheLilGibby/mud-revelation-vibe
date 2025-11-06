import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function GuidesPage() {
    const [guidesData, setGuidesData] = useState(null);
    const [filteredGuides, setFilteredGuides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedBuildTypes, setSelectedBuildTypes] = useState([]);

    // Load guides data
    useEffect(() => {
        fetch('/GameData/Guides.json')
            .then(response => response.json())
            .then(data => {
                setGuidesData(data);
                setFilteredGuides(data.guides || []);
                
                // Set all classes as selected by default
                const allClasses = [...new Set((data.guides || []).map(guide => guide.characterClass).filter(Boolean))].sort();
                setSelectedClasses(allClasses);
                
                // Set all build types as selected by default
                const allBuildTypes = [...new Set((data.guides || []).map(guide => guide.buildType).filter(Boolean))].sort();
                setSelectedBuildTypes(allBuildTypes);
                
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error loading guides:', error);
                setIsLoading(false);
            });
    }, []);

    // Filter guides
    useEffect(() => {
        if (!guidesData || !guidesData.guides) return;
        
        let filtered = [...guidesData.guides];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(guide => {
                return guide.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    guide.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    guide.characterClass?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    guide.buildType?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Class filter
        if (selectedClasses.length > 0) {
            const allClasses = [...new Set(guidesData.guides.map(guide => guide.characterClass).filter(Boolean))];
            if (selectedClasses.length < allClasses.length) {
                filtered = filtered.filter(guide => 
                    guide.characterClass && selectedClasses.includes(guide.characterClass)
                );
            }
        }

        // Build type filter
        if (selectedBuildTypes.length > 0) {
            const allBuildTypes = [...new Set(guidesData.guides.map(guide => guide.buildType).filter(Boolean))];
            if (selectedBuildTypes.length < allBuildTypes.length) {
                filtered = filtered.filter(guide => 
                    guide.buildType && selectedBuildTypes.includes(guide.buildType)
                );
            }
        }

        setFilteredGuides(filtered);
    }, [searchTerm, selectedClasses, selectedBuildTypes, guidesData]);

    // Get unique classes and build types
    const guideClasses = guidesData ? [...new Set(guidesData.guides.map(guide => guide.characterClass).filter(Boolean))].sort() : [];
    const guideBuildTypes = guidesData ? [...new Set(guidesData.guides.map(guide => guide.buildType).filter(Boolean))].sort() : [];

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

    // Toggle build type selection
    const toggleBuildType = (buildType) => {
        setSelectedBuildTypes(prev => {
            if (prev.includes(buildType)) {
                return prev.filter(b => b !== buildType);
            } else {
                return [...prev, buildType];
            }
        });
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
                    <div>Loading Guides...</div>
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
                    📖 Guides
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

                {/* Class Filter */}
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

                {/* Build Type Filter */}
                {guideBuildTypes.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em' }}>
                            ⚔️ Build Type:
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

                {/* Clear Filters */}
                <button
                    onClick={() => {
                        setSearchTerm('');
                        setSelectedClasses([...guideClasses]);
                        setSelectedBuildTypes([...guideBuildTypes]);
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

            {/* Main Content - Guides List */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto'
            }}>
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    background: '#1a1a1a',
                    border: '2px solid #00ff00',
                    borderRadius: '5px',
                    fontSize: '1.3em'
                }}>
                    Showing {filteredGuides.length} guides
                </div>

                {/* Guides Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '15px'
                }}>
                    {filteredGuides.map(guide => (
                        <div
                            key={guide.id}
                            onClick={() => setSelectedGuide(guide)}
                            style={{
                                background: '#1a1a1a',
                                border: '2px solid #00aaff',
                                borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 170, 255, 0.6)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{
                                    fontSize: '1.3em',
                                    fontWeight: 'bold',
                                    color: '#00aaff',
                                    marginBottom: '5px'
                                }}>
                                    {guide.title}
                                </div>
                                <div style={{ fontSize: '1em', color: '#888' }}>
                                    by {guide.author}
                                </div>
                            </div>

                            <div style={{ fontSize: '1.1em', color: '#aaa', marginBottom: '8px' }}>
                                <div>🎓 {guide.characterClass}</div>
                                <div>⚔️ {guide.buildType}</div>
                            </div>

                            {guide.status && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '4px 10px',
                                    background: guide.status === 'Outdated' ? '#ff660020' : '#00ff0020',
                                    border: `1px solid ${guide.status === 'Outdated' ? '#ff6600' : '#00ff00'}`,
                                    borderRadius: '3px',
                                    fontSize: '0.9em',
                                    color: guide.status === 'Outdated' ? '#ff6600' : '#00ff00',
                                    display: 'inline-block'
                                }}>
                                    {guide.status}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredGuides.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: '1.5em',
                        color: '#888',
                        marginTop: '50px'
                    }}>
                        No guides found matching your filters.
                    </div>
                )}
            </div>

            {/* Right Panel - Guide Details */}
            {selectedGuide && (
                <div style={{
                    width: '650px',
                    background: '#0a0a0a',
                    borderLeft: '4px solid #00aaff',
                    padding: '30px 40px',
                    overflowY: 'auto',
                    flexShrink: 0,
                    boxShadow: '-5px 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 170, 255, 0.1)'
                }}>
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedGuide(null)}
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

                    {/* Guide Header */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '30px',
                        paddingBottom: '25px',
                        borderBottom: '3px solid #00aaff'
                    }}>
                        <h2 style={{
                            fontSize: '2.5em',
                            color: '#00aaff',
                            marginBottom: '12px',
                            textShadow: '0 0 15px rgba(0, 170, 255, 0.8)'
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
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px' }}>
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
                                ⚔️ {selectedGuide.buildType}
                            </div>
                        </div>
                        {selectedGuide.version && (
                            <div style={{ marginTop: '10px', color: '#666', fontSize: '1.1em' }}>
                                Version: {selectedGuide.version}
                            </div>
                        )}
                    </div>

                    {/* Guide Sections */}
                    {selectedGuide.sections && selectedGuide.sections.map((section, idx) => (
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

                            {/* Skills */}
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

                            {/* Spells */}
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

                            {/* Equipment */}
                            {section.equipment && section.equipment.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    {section.equipment.map((item, itemIdx) => (
                                        <div key={itemIdx} style={{
                                            background: '#0a0a0a',
                                            border: '1px solid #ffaa0040',
                                            borderRadius: '3px',
                                            padding: '10px',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                                                {item.slot}: {item.name}
                                            </div>
                                            {item.description && (
                                                <div style={{ color: '#aaa', fontSize: '0.95em', marginTop: '5px' }}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Update Info */}
                    <div style={{
                        textAlign: 'center',
                        padding: '15px',
                        background: '#1a1a1a',
                        border: '2px solid #666',
                        borderRadius: '5px',
                        color: '#888',
                        fontSize: '1.1em'
                    }}>
                        {selectedGuide.status && (
                            <div style={{
                                marginBottom: '8px',
                                color: selectedGuide.status === 'Outdated' ? '#ff6600' : '#00ff00'
                            }}>
                                Status: {selectedGuide.status}
                            </div>
                        )}
                        {selectedGuide.lastUpdated && (
                            <div>Last Updated: {selectedGuide.lastUpdated}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuidesPage;

