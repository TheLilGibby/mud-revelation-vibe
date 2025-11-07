import React, { useState, useEffect, useRef } from 'react';

/**
 * Optimized Mob Sprite Component
 * Uses lazy loading, caching, and image sprites for better performance
 */

// Global image cache to prevent re-downloading
const imageCache = new Map();
const imagePrefetchQueue = [];
let isPrefetching = false;

// Prefetch images in batches
function prefetchImage(src) {
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src));
    }
    
    imagePrefetchQueue.push(src);
    
    if (!isPrefetching) {
        isPrefetching = true;
        processPrefetchQueue();
    }
    
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (imageCache.has(src)) {
                clearInterval(checkInterval);
                resolve(imageCache.get(src));
            }
        }, 100);
    });
}

function processPrefetchQueue() {
    const BATCH_SIZE = 10;
    const batch = imagePrefetchQueue.splice(0, BATCH_SIZE);
    
    if (batch.length === 0) {
        isPrefetching = false;
        return;
    }
    
    Promise.all(batch.map(src => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(src, img);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${src}`);
                resolve(); // Continue even if image fails
            };
            img.src = src;
        });
    })).then(() => {
        setTimeout(processPrefetchQueue, 50); // Small delay between batches
    });
}

/**
 * MobSprite Component
 * Optimized for rendering thousands of mob images
 */
export default function MobSprite({ 
    mobId, 
    size = 32, 
    className = '', 
    style = {},
    alt = 'Mob',
    onClick = null,
    lazy = true
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);
    
    const src = `/images/mobs/${mobId}.png`;
    
    useEffect(() => {
        // Check if image is already cached
        if (imageCache.has(src)) {
            setIsLoaded(true);
            return;
        }
        
        // Lazy loading with IntersectionObserver
        if (lazy && imgRef.current && 'IntersectionObserver' in window) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // Image is visible, load it
                            prefetchImage(src).then(() => {
                                setIsLoaded(true);
                            });
                            // Stop observing once loaded
                            if (observerRef.current && imgRef.current) {
                                observerRef.current.unobserve(imgRef.current);
                            }
                        }
                    });
                },
                {
                    rootMargin: '50px', // Start loading slightly before visible
                    threshold: 0.01
                }
            );
            
            observerRef.current.observe(imgRef.current);
            
            return () => {
                if (observerRef.current && imgRef.current) {
                    observerRef.current.unobserve(imgRef.current);
                }
            };
        } else {
            // No lazy loading, load immediately
            prefetchImage(src).then(() => {
                setIsLoaded(true);
            });
        }
    }, [src, lazy]);
    
    const handleError = () => {
        setHasError(true);
        console.warn(`Failed to load mob image: ${src}`);
    };
    
    const containerStyle = {
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        position: 'relative',
        imageRendering: 'pixelated',
        imageRendering: '-moz-crisp-edges',
        imageRendering: 'crisp-edges',
        ...style
    };
    
    const imgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
    };
    
    const placeholderStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(0,255,0,0.1) 0%, rgba(0,255,0,0.2) 100%)',
        display: isLoaded ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: 'rgba(0,255,0,0.5)',
        border: '1px solid rgba(0,255,0,0.3)'
    };
    
    return (
        <div 
            ref={imgRef}
            className={`mob-sprite ${className}`}
            style={containerStyle}
            onClick={onClick}
            title={alt}
        >
            {!isLoaded && !hasError && (
                <div style={placeholderStyle}>
                    ?
                </div>
            )}
            
            {hasError ? (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,0,0,0.2)',
                    border: '1px solid rgba(255,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'rgba(255,0,0,0.8)'
                }}>
                    ✕
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    style={imgStyle}
                    onError={handleError}
                    loading={lazy ? "lazy" : "eager"}
                />
            )}
        </div>
    );
}

/**
 * Utility function to prefetch a batch of mob images
 * Call this when you know which mobs will be displayed soon
 */
export function prefetchMobImages(mobIds) {
    mobIds.forEach(mobId => {
        prefetchImage(`/images/mobs/${mobId}.png`);
    });
}

/**
 * Clear the image cache (useful for memory management)
 */
export function clearMobImageCache() {
    imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getMobCacheStats() {
    return {
        cachedImages: imageCache.size,
        pendingPrefetch: imagePrefetchQueue.length
    };
}

