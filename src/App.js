import React, { useState, useEffect } from 'react';
import { DataProvider, useGameData } from './contexts/DataContext';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import ItemsPage from './pages/ItemsPage';
import MobsPage from './pages/MobsPage';
import QuestsPage from './pages/QuestsPage';
import GuidesPage from './pages/GuidesPage';
import './App.css';

function AppContent() {
    const { isLoading: dataLoading, loadingProgress, error } = useGameData();
    const [activePage, setActivePage] = useState('map'); // Track which page is active
    const [mapView, setMapView] = useState('world'); // Track which map view is active - default to grid map
    const [mapNavigationData, setMapNavigationData] = useState(null); // Data for cross-page navigation
    const [itemNavigationData, setItemNavigationData] = useState(null); // Data for items page navigation
    const [mobNavigationData, setMobNavigationData] = useState(null); // Data for mobs page navigation

    const handleMenuChange = (menuId) => {
        setActivePage(menuId);
    };

    const handleMapViewChange = (viewId) => {
        setMapView(viewId);
        // Make sure we're on the map page when selecting a map view
        if (activePage !== 'map') {
            setActivePage('map');
        }
    };
    
    const handleNavigateToMap = (navigationData) => {
        setMapNavigationData(navigationData);
        setActivePage('map');
    };
    
    const handleNavigateToItems = (navigationData) => {
        setItemNavigationData(navigationData);
        setActivePage('items');
    };
    
    const handleNavigateToMob = (mobData) => {
        console.log('[App] handleNavigateToMob called with:', mobData);
        setMobNavigationData(mobData);
        setActivePage('mobs');
        console.log('[App] Switched to mobs page');
    };

    useEffect(() => {
        // Log initialization info
        console.log('Revelation Game Library (React) loaded successfully!');
        
        // Check for URL parameters to auto-navigate to appropriate page
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('itemId')) {
            const itemId = parseInt(urlParams.get('itemId'));
            console.log('URL contains itemId parameter, navigating to Items page');
            // Set navigation data with the itemId so ItemsPage can open it
            setItemNavigationData({ Id: itemId });
            setActivePage('items');
        } else if (urlParams.has('quest')) {
            console.log('URL contains quest parameter, navigating to Quests page');
            setActivePage('quests');
        } else if (urlParams.has('mobId')) {
            const mobId = parseInt(urlParams.get('mobId'));
            console.log('URL contains mobId parameter, navigating to Mobs page');
            setMobNavigationData({ Id: mobId });
            setActivePage('mobs');
        }
    }, []);

    // Show loading screen while data is being fetched
    if (dataLoading) {
        return (
            <div className="App">
                <Header 
                    activeMenu={activePage} 
                    onMenuChange={() => {}} // Disabled during loading
                    onMapViewChange={() => {}}
                />
                <main className="app-main" role="main">
                    <div className="loading-screen">
                        <div className="loading-content">
                            <h2>Loading Revelation Game Library...</h2>
                            <div className="loading-bar">
                                <div 
                                    className="loading-progress" 
                                    style={{ width: `${loadingProgress}%` }}
                                ></div>
                            </div>
                            <p>{loadingProgress}% Complete</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="App">
                <Header 
                    activeMenu={activePage} 
                    onMenuChange={handleMenuChange}
                    onMapViewChange={handleMapViewChange}
                />
                <main className="app-main" role="main">
                    <div className="error-screen">
                        <h2>Error Loading Data</h2>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>Retry</button>
                    </div>
                </main>
            </div>
        );
    }

    // Render all pages but only show the active one - prevents remounting
    return (
        <div className="App">
            <Header 
                activeMenu={activePage} 
                onMenuChange={handleMenuChange}
                onMapViewChange={handleMapViewChange}
            />

            <main className="app-main" role="main">
                <div className={`page-container ${activePage === 'map' ? 'active' : ''}`}>
                    <MapPage 
                        mapView={mapView} 
                        onMapViewChange={setMapView}
                        navigationData={mapNavigationData}
                        onClearNavigation={() => setMapNavigationData(null)}
                        onNavigateToMob={handleNavigateToMob}
                        isActive={activePage === 'map'}
                    />
                </div>
                <div className={`page-container ${activePage === 'items' ? 'active' : ''}`}>
                    <ItemsPage 
                        navigationData={itemNavigationData}
                        onClearNavigation={() => setItemNavigationData(null)}
                        onNavigateToMob={handleNavigateToMob}
                        isActive={activePage === 'items'}
                    />
                </div>
                <div className={`page-container ${activePage === 'mobs' ? 'active' : ''}`}>
                    <MobsPage 
                        onNavigateToMap={handleNavigateToMap}
                        navigationData={mobNavigationData}
                        onClearNavigation={() => setMobNavigationData(null)}
                        onNavigateToItems={handleNavigateToItems}
                        isActive={activePage === 'mobs'}
                    />
                </div>
                <div className={`page-container ${activePage === 'quests' ? 'active' : ''}`}>
                    <QuestsPage isActive={activePage === 'quests'} />
                </div>
                <div className={`page-container ${activePage === 'guides' ? 'active' : ''}`}>
                    <GuidesPage 
                        onNavigateToItems={handleNavigateToItems}
                        isActive={activePage === 'guides'}
                    />
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
}

export default App;

