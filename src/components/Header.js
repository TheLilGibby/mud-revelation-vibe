import React from 'react';

const menuItems = [
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'items', label: 'Items', icon: '⚔️' },
    { id: 'mobs', label: 'Mobs', icon: '🐉' },
    { id: 'quests', label: 'Quests', icon: '📜' },
    { id: 'guides', label: 'Guides', icon: '📖' }
];

function Header({ activeMenu, onMenuChange, onMapViewChange }) {

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
        <header className="app-header">
            <div className="header-content">
                <div className="header-title">
                    <h1>REVELATION</h1>
                    <p>*** Game Library & Map Explorer ***</p>
                </div>

				<nav className="header-nav" aria-label="Main">
					<ul className="header-menu">
						{menuItems.map((item) => {
							const isActive = activeMenu === item.id;

							return (
								<li key={item.id} className="header-menu__item">
									<button
										type="button"
										onClick={() => handleMenuClick(item.id)}
										className={`menu-btn${isActive ? ' menu-btn--active' : ''}`}
										aria-current={isActive ? 'page' : undefined}
									>
										<span className="menu-btn__icon" aria-hidden="true">{item.icon}</span>
										<span className="menu-btn__label">{item.label}</span>
									</button>
								</li>
							);
						})}
					</ul>
				</nav>
            </div>
        </header>
    );
}

export default Header;

