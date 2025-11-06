import React from 'react';

function InfoPanel({ location, isVisible, onClose, onOpenDetailedMap }) {
    if (!isVisible || !location) {
        return null;
    }

    return (
        <div className={`info-panel ${isVisible ? 'active' : ''}`}>
            <h3>{location.name}</h3>
            <div className="info-detail">
                <span className="info-label">Region:</span>
                <span>{location.region}</span>
            </div>
            <div className="info-detail">
                <span className="info-label">Type:</span>
                <span>{location.type}</span>
            </div>
            <div className="info-detail">
                <span className="info-label">Mob Count:</span>
                <span>{location.mobCount}</span>
            </div>
            <div className="info-detail">
                <span className="info-label">Description:</span>
                <div style={{ marginTop: '10px', lineHeight: '1.8' }}>
                    {location.regionDescription || `${location.type} in ${location.region}`}
                </div>
            </div>
            
            <button 
                className="drilldown-button"
                onClick={() => onOpenDetailedMap(location)}
                style={{ width: '100%', marginTop: '15px', padding: '12px' }}
                title="Press Enter to open"
            >
                🗺️ View Detailed Room Layout
                <span style={{ marginLeft: '10px', opacity: '0.7', fontSize: '0.9em' }}>
                    [Enter]
                </span>
            </button>
        </div>
    );
}

export default InfoPanel;

