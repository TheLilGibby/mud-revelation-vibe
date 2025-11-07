import React from 'react';

function GuideSubmissionForm({ onClose }) {

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                background: '#0a0a0a',
                border: '3px solid #00ff00',
                borderRadius: '10px',
                padding: '50px',
                maxWidth: '600px',
                width: '100%',
                color: '#00ff00',
                fontFamily: 'VT323, monospace',
                boxShadow: '0 0 40px rgba(0, 255, 0, 0.3)',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '4em',
                    marginBottom: '20px',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    ⏳
                </div>

                <h2 style={{ 
                    fontSize: '3em', 
                    margin: '0 0 20px 0',
                    color: '#00ff00',
                    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                }}>
                    COMING SOON
                </h2>

                <div style={{
                    fontSize: '1.5em',
                    marginBottom: '30px',
                    color: '#00aaff',
                    lineHeight: 1.6
                }}>
                    <p style={{ margin: '10px 0' }}>
                        Guide Submission Feature
                    </p>
                    <p style={{ margin: '10px 0', fontSize: '1.2em' }}>
                        is currently under development
                    </p>
                </div>

                <div style={{
                    background: '#1a1a1a',
                    border: '2px solid #00aaff',
                    borderRadius: '5px',
                    padding: '20px',
                    marginBottom: '30px',
                    fontSize: '1.3em',
                    color: '#00aaff'
                }}>
                    <p style={{ margin: '10px 0' }}>
                        Stay tuned for the ability to submit your own guides!
                    </p>
                    <p style={{ margin: '10px 0' }}>
                        📝 Share your knowledge<br/>
                        🎮 Help other players<br/>
                        🌟 Build the community
                    </p>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        padding: '15px 40px',
                        background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
                        border: '2px solid #00ff00',
                        borderRadius: '5px',
                        color: '#000',
                        fontSize: '1.8em',
                        cursor: 'pointer',
                        fontFamily: 'VT323, monospace',
                        fontWeight: 'bold',
                        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #00ff00 0%, #00ff00 100%)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.5)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    OK
                </button>

                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.1); }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default GuideSubmissionForm;
