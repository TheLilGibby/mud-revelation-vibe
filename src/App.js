import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import ItemsPage from './pages/ItemsPage';
import MobsPage from './pages/MobsPage';
import QuestsPage from './pages/QuestsPage';
import GuidesPage from './pages/GuidesPage';
import './App.css';

function App() {
    const [activePage, setActivePage] = useState('map'); // Track which page is active
    const [mapView, setMapView] = useState('world'); // Track which map view is active - default to grid map
    const [mapNavigationData, setMapNavigationData] = useState(null); // Data for cross-page navigation

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

    useEffect(() => {
        // Log initialization info
        console.log('Revelation Game Library (React) loaded successfully!');
    }, []);

    // Render the appropriate page based on active menu
    const renderPage = () => {
        switch (activePage) {
            case 'map':
                return <MapPage 
                    mapView={mapView} 
                    onMapViewChange={setMapView}
                    navigationData={mapNavigationData}
                    onClearNavigation={() => setMapNavigationData(null)}
                />;
            case 'items':
                return <ItemsPage />;
            case 'mobs':
                return <MobsPage onNavigateToMap={handleNavigateToMap} />;
            case 'quests':
                return <QuestsPage />;
            case 'guides':
                return <GuidesPage />;
            default:
                return <MapPage 
                    mapView={mapView} 
                    onMapViewChange={setMapView}
                    navigationData={mapNavigationData}
                    onClearNavigation={() => setMapNavigationData(null)}
                />;
        }
    };

    return (
        <div className="App">
            <Header 
                activeMenu={activePage} 
                onMenuChange={handleMenuChange}
                onMapViewChange={handleMapViewChange}
            />
            
            <div className="container">
                {renderPage()}
            </div>
        </div>
    );
}

export default App;

