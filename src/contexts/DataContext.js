import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useGameData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useGameData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const [mobs, setMobs] = useState([]);
    const [items, setItems] = useState([]);
    const [guides, setGuides] = useState(null);
    const [quests, setQuests] = useState([]);
    const [worldData, setWorldData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            setLoadingProgress(0);
            setError(null);

            try {
                // Load all data in parallel for faster loading
                const [mobsData, itemsData, guidesData, questsData, worldDataLoaded] = await Promise.all([
                    fetch('/GameData/Mobs.json')
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to load Mobs data');
                            setLoadingProgress(20);
                            return res.json();
                        })
                        .catch(err => {
                            console.error('Mobs loading error:', err);
                            return [];
                        }),
                    
                    fetch('/GameData/Items.json')
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to load Items data');
                            setLoadingProgress(40);
                            return res.json();
                        })
                        .catch(err => {
                            console.error('Items loading error:', err);
                            return [];
                        }),
                    
                    fetch('/GameData/Guides.json')
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to load Guides data');
                            setLoadingProgress(60);
                            return res.json();
                        })
                        .catch(err => {
                            console.error('Guides loading error:', err);
                            return null;
                        }),
                    
                    fetch('/GameData/Quests.json')
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to load Quests data');
                            setLoadingProgress(80);
                            return res.json();
                        })
                        .catch(err => {
                            console.error('Quests loading error:', err);
                            return [];
                        }),
                    
                    fetch('/GameData/WorldData.json')
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to load World data');
                            setLoadingProgress(100);
                            return res.json();
                        })
                        .catch(err => {
                            console.error('WorldData loading error:', err);
                            return null;
                        })
                ]);

                setMobs(mobsData);
                setItems(itemsData);
                setGuides(guidesData);
                setQuests(questsData);
                setWorldData(worldDataLoaded);
                
                console.log('✓ All game data loaded successfully');
                console.log(`  - Mobs: ${mobsData.length}`);
                console.log(`  - Items: ${itemsData.length}`);
                console.log(`  - Guides: ${guidesData?.guides?.length || 0}`);
                console.log(`  - Quests: ${questsData.length}`);
                console.log(`  - Zones: ${worldDataLoaded ? Object.keys(worldDataLoaded.Zones || {}).length : 0}`);
                
            } catch (err) {
                console.error('Error loading game data:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllData();
    }, []);

    const value = {
        mobs,
        items,
        guides,
        quests,
        worldData,
        isLoading,
        loadingProgress,
        error,
        // Helper method to refresh data if needed
        refreshData: () => {
            window.location.reload();
        }
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

