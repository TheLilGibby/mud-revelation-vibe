import React from 'react';

function Header({ activeMenu, onMenuChange, onMapViewChange }) {
    const menuItems = [
        { id: 'map', label: 'Map', icon: '🗺️' },
        { id: 'items', label: 'Items', icon: '⚔️' },
        { id: 'mobs', label: 'Mobs', icon: '🐉' },
        { id: 'quests', label: 'Quests', icon: '📜' },
        { id: 'guides', label: 'Guides', icon: '📖' }
    ];

    const handleMenuClick = (menuId) => {
        if (menuId === 'map') {
            // Directly go to world grid view
            if (onMapViewChange) {
                onMapViewChange('world');
            }
            if (onMenuChange) {
                onMenuChange(menuId);
            }
        } else {
            if (onMenuChange) {
                onMenuChange(menuId);
            }
        }
    };

    return (
        <div className="header" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            borderBottom: '3px solid #00ff00',
            boxShadow: '0 3px 10px rgba(0, 255, 0, 0.3)',
            background: '#1a1a1a',
            margin: 0
        }}>
            <div className="header-content">
                <div className="header-title">
                    <h1>REVELATION</h1>
                    <p>*** Game Library & Map Explorer ***</p>
                </div>
                
                {/* Navigation Menu */}
                <div className="header-menu" style={{
                    display: 'flex',
                    gap: '15px',
                    marginTop: '15px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`menu-btn ${activeMenu === item.id ? 'active' : ''}`}
                            style={{
                                padding: '12px 24px',
                                background: activeMenu === item.id 
                                    ? 'linear-gradient(135deg, #00ff00, #00aa00)' 
                                    : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                                color: activeMenu === item.id ? '#000' : '#00ff00',
                                border: `2px solid ${activeMenu === item.id ? '#00ff00' : '#555'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontFamily: 'VT323, monospace',
                                fontSize: '1.3em',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: activeMenu === item.id 
                                    ? '0 0 20px rgba(0, 255, 0, 0.6), inset 0 0 10px rgba(0, 255, 0, 0.3)' 
                                    : '0 4px 8px rgba(0, 0, 0, 0.5)',
                                textShadow: activeMenu === item.id 
                                    ? '0 0 10px rgba(0, 0, 0, 0.8)' 
                                    : '0 0 5px rgba(0, 255, 0, 0.5)',
                                transform: activeMenu === item.id ? 'translateY(-2px)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (activeMenu !== item.id) {
                                    e.target.style.background = 'linear-gradient(135deg, #3a3a3a, #2a2a2a)';
                                    e.target.style.borderColor = '#00ff00';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 12px rgba(0, 255, 0, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeMenu !== item.id) {
                                    e.target.style.background = 'linear-gradient(135deg, #2a2a2a, #1a1a1a)';
                                    e.target.style.borderColor = '#555';
                                    e.target.style.transform = 'none';
                                    e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.2em' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Header;

