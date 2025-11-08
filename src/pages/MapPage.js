import React, { useState, useEffect } from 'react';
import WorldMapGrid from '../components/WorldMapGrid';
import UnifiedWorldMap from '../components/UnifiedWorldMap';
import DetailedMapView from '../components/DetailedMapView';

function MapPage({ mapView, onMapViewChange, navigationData, onClearNavigation, onNavigateToMob }) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [detailedMapLocation, setDetailedMapLocation] = useState(null);
    const [highlightedZones, setHighlightedZones] = useState([]);
    const [highlightedMobName, setHighlightedMobName] = useState(null);
    const [initialSearchLocation, setInitialSearchLocation] = useState(null);
    
    // Handle navigation from MobsPage
    useEffect(() => {
        if (navigationData?.searchLocation) {
            const { searchLocation, mobName, mobLevel } = navigationData;
            
            // Set up the search to trigger when the map loads
            setInitialSearchLocation(searchLocation);
            setHighlightedMobName(mobName);
            
            // Open the detailed map for this location
            setTimeout(() => {
                setDetailedMapLocation({
                    name: searchLocation,
                    type: 'Zone',
                });
            }, 500);
            
            // Clear the navigation data
            if (onClearNavigation) {
                onClearNavigation();
            }
        }
    }, [navigationData, onClearNavigation]);

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        // Don't automatically open detailed map - let user press Enter or click button
    };

    const handleOpenDetailedMap = (location) => {
        setDetailedMapLocation(location);
    };

    const handleCloseDetailedMap = () => {
        setDetailedMapLocation(null);
    };

    const handleHighlightZones = (zones, mobName) => {
        setHighlightedZones(zones);
        setHighlightedMobName(mobName);
    };

    const handleClearHighlight = () => {
        setHighlightedZones([]);
        setHighlightedMobName(null);
    };

    const handleNavigateToZone = (zoneName) => {
        setDetailedMapLocation({
            name: zoneName,
            type: 'Zone',
        });
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="container" style={{ flex: 1, overflow: 'hidden' }}>
                {mapView === 'unified' ? (
                    <UnifiedWorldMap
                        onZoneSelect={handleLocationSelect}
                        onOpenDetailedMap={handleOpenDetailedMap}
                        selectedZone={selectedLocation}
                        highlightedZones={highlightedZones}
                        highlightedMobName={highlightedMobName}
                        onClearHighlight={handleClearHighlight}
                        initialSearchLocation={initialSearchLocation}
                    />
                ) : (
                    <WorldMapGrid
                        onZoneSelect={handleLocationSelect}
                        initialSearchLocation={initialSearchLocation}
                        onOpenDetailedMap={handleOpenDetailedMap}
                        selectedZone={selectedLocation}
                        highlightedZones={highlightedZones}
                        highlightedMobName={highlightedMobName}
                        onClearHighlight={handleClearHighlight}
                    />
                )}
            </div>

            {detailedMapLocation && (
                <DetailedMapView
                    location={detailedMapLocation}
                    onClose={handleCloseDetailedMap}
                    onNavigateToZone={handleNavigateToZone}
                    onHighlightZones={handleHighlightZones}
                    onClearHighlight={handleClearHighlight}
                    onNavigateToMob={onNavigateToMob}
                    highlightedMobName={highlightedMobName}
                />
            )}
        </div>
    );
}

export default MapPage;

