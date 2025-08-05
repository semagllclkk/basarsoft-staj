import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transform } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Snap from 'ol/interaction/Snap';
import WKT from 'ol/format/WKT';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { click } from 'ol/events/condition';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';

const MessagePopup = ({ message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    const getMessageColor = (type) => {
        switch (type) {
            case 'success': return '#22c55e';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const getBackgroundColor = (type) => {
        switch (type) {
            case 'success': return 'linear-gradient(135deg, #059669, #10b981)';
            case 'error': return 'linear-gradient(135deg, #dc2626, #ef4444)';
            case 'warning': return 'linear-gradient(135deg, #d97706, #f59e0b)';
            case 'info': return 'linear-gradient(135deg, #2563eb, #3b82f6)';
            default: return 'linear-gradient(135deg, #4b5563, #6b7280)';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: getBackgroundColor(message.type),
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: `0 8px 25px ${getMessageColor(message.type)}40`,
            zIndex: 10001,
            maxWidth: '400px',
            border: `2px solid ${getMessageColor(message.type)}`,
            fontSize: '14px',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ 
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                    {message.text}
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginLeft: '10px',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                    ×
                </button>
            </div>
        </div>
    );
};

const API_BASE = 'https://localhost:7215';

const getGeometryStyle = (isSelected = false, isModifying = false) => {
    return new Style({
        fill: new Fill({
            color: isModifying ? 'rgba(255, 107, 157, 0.4)' : 
                   isSelected ? 'rgba(248, 187, 208, 0.4)' : 
                   'rgba(199, 125, 255, 0.3)',
        }),
        stroke: new Stroke({
            color: isModifying ? '#ff6b9d' : 
                   isSelected ? '#f8bbd0' : 
                   '#c77dff',
            width: isModifying ? 4 : isSelected ? 3 : 2,
        }),
        image: new CircleStyle({
            radius: isModifying ? 10 : isSelected ? 8 : 6,
            fill: new Fill({
                color: isModifying ? '#c77dff' :
                       isSelected ? '#f8bbd0' :
                       '#9d4edd',
            }),
            stroke: new Stroke({
                color: '#ffffff',
                width: 2,
            }),
        }),
    });
};

const getATypeSnapPointStyle = () => {
    return new Style({
        image: new CircleStyle({
            radius: 10,
            fill: new Fill({
                color: '#ff1493', 
            }),
            stroke: new Stroke({
                color: '#ffffff',
                width: 3,
            }),
        }),
    });
};

const getBTypeSnapPointStyle = () => {
    return new Style({
        image: new CircleStyle({
            radius: 10,
            fill: new Fill({
                color: '#ffff00',
            }),
            stroke: new Stroke({
                color: '#ff4500',
                width: 3,
            }),
        }),
    });
};

const pinkButtonStyle = (primaryColor, hoverColor) => ({
    background: `linear-gradient(135deg, ${primaryColor}, ${hoverColor})`,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 16px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 15px rgba(248, 187, 208, 0.3)`,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
});

const cuteTabStyle = (isActive) => ({
    background: isActive ? 'linear-gradient(135deg, #f72585, #c77dff)' : 'rgba(248, 187, 208, 0.1)',
    color: isActive ? 'white' : '#f8bbd0',
    border: `1px solid ${isActive ? '#f72585' : 'rgba(248, 187, 208, 0.3)'}`,
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
    textAlign: 'center',
    boxShadow: isActive ? '0 4px 15px rgba(247, 37, 133, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
    textShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.2)' : 'none'
});

const cuteActionStyle = (bgColor) => ({
    background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `0 3px 12px rgba(248, 187, 208, 0.2)`,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
});

const cuteInputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(248, 187, 208, 0.3)',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    background: 'rgba(26, 26, 46, 0.7)',
    color: '#f8bbd0',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box'
};

const subBtnStyle = () => ({
    background: '#1c1531',
    border: '1px solid #f8bbd0',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#f8bbd0',
    cursor: 'pointer'
});

function MapComponent() {
    const [activeMenu, setActiveMenu] = useState('Point');
    const [selectedType, setSelectedType] = useState('A');
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showList, setShowList] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [selectedId, setSelectedId] = useState('');
    const [featureList, setFeatureList] = useState([]);
    const [isModifying, setIsModifying] = useState(false);
    const [modifyingFeature, setModifyingFeature] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [drawingType, setDrawingType] = useState(null);
    const [searchName, setSearchName] = useState('');
    const [debouncedSearchName, setDebouncedSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPage, setSearchPage] = useState(1);
    const [showSearchPopup, setShowSearchPopup] = useState(false);
    const mapRef = useRef();
    const mapInstanceRef = useRef();
    const selectRef = useRef();
    const modifyRef = useRef();
    const drawRef = useRef();
    const snapRef = useRef();
    const aTypeSnapSourceRef = useRef(new VectorSource());
    const bTypeSnapSourceRef = useRef(new VectorSource());
    const vectorSourceRef = useRef(new VectorSource());
    const selectedFeatureRef = useRef(null);
    const resultsPerPage = 5;
    const pagedResults = searchResults.slice((searchPage - 1) * resultsPerPage, searchPage * resultsPerPage);
    const totalPages = Math.ceil(searchResults.length / resultsPerPage);

    const messages = React.useMemo(() => ({
        saving: 'Kaydediliyor...',
        updating: 'Güncelleniyor...',
        drawingAlready: 'Zaten bir çizim modundasınız!',
        pointName: 'Nokta için bir isim girin:',
        lineName: 'Çizgi için bir isim girin:',
        polygonName: 'Alan için bir isim girin:',
        nameRequired: 'İsim alanı gereklidir!',
        serverError: 'Sunucu hatası, lütfen daha sonra tekrar deneyin.',
        pointAdded: 'Nokta başarıyla eklendi.',
        lineAdded: 'Çizgi başarıyla eklendi.',
        polygonAdded: 'Alan başarıyla eklendi.',
        featureUpdated: 'Geometri başarıyla güncellendi.',
        featureDeleted: 'Geometri başarıyla silindi.',
    }), []);

    const updateSnapPoints = useCallback(() => {
        aTypeSnapSourceRef.current.clear();
        bTypeSnapSourceRef.current.clear();
        
        if (!drawingType) {
            return;
        }
        
        const allFeatures = vectorSourceRef.current.getFeatures();
        let aTypeCount = 0;
        let bTypeCount = 0;
        
        allFeatures.forEach(feature => {
            const featureType = feature.get('type');
            const geometryType = feature.get('geometryType') || 'A';
            
            if (geometryType === 'A' || geometryType === 'B') {
                const geometry = feature.getGeometry();
                
                if (featureType === 'Point') {
                    const snapFeature = feature.clone();
                    if (geometryType === 'A') {
                        snapFeature.setStyle(getATypeSnapPointStyle());
                        aTypeSnapSourceRef.current.addFeature(snapFeature);
                        aTypeCount++;
                    } else if (geometryType === 'B') {
                        snapFeature.setStyle(getBTypeSnapPointStyle());
                        bTypeSnapSourceRef.current.addFeature(snapFeature);
                        bTypeCount++;
                    }
                } else if (featureType === 'Line') {
                    const coordinates = geometry.getCoordinates();
                    
                    const startPoint = new Point(coordinates[0]);
                    const startFeature = new Feature(startPoint);
                    
                    const endPoint = new Point(coordinates[coordinates.length - 1]);
                    const endFeature = new Feature(endPoint);
                    
                    if (geometryType === 'A') {
                        startFeature.setStyle(getATypeSnapPointStyle());
                        endFeature.setStyle(getATypeSnapPointStyle());
                        aTypeSnapSourceRef.current.addFeature(startFeature);
                        aTypeSnapSourceRef.current.addFeature(endFeature);
                        aTypeCount += 2;
                    } else if (geometryType === 'B') {
                        startFeature.setStyle(getBTypeSnapPointStyle());
                        endFeature.setStyle(getBTypeSnapPointStyle());
                        bTypeSnapSourceRef.current.addFeature(startFeature);
                        bTypeSnapSourceRef.current.addFeature(endFeature);
                        bTypeCount += 2;
                    }
                } else if (featureType === 'Polygon') {
                    const coordinates = geometry.getCoordinates()[0];
                    coordinates.forEach((coord, index) => {
                        if (index < coordinates.length - 1) {
                            const point = new Point(coord);
                            const pointFeature = new Feature(point);
                            
                            if (geometryType === 'A') {
                                pointFeature.setStyle(getATypeSnapPointStyle());
                                aTypeSnapSourceRef.current.addFeature(pointFeature);
                                aTypeCount++;
                            } else if (geometryType === 'B') {
                                pointFeature.setStyle(getBTypeSnapPointStyle());
                                bTypeSnapSourceRef.current.addFeature(pointFeature);
                                bTypeCount++;
                            }
                        }
                    });
                }
            }
        });
        
        console.log(`🎯 Snap noktaları güncellendi: A tipi ${aTypeCount}, B tipi ${bTypeCount}`);
        
        if (mapInstanceRef.current) {
            mapInstanceRef.current.render();
        }
    }, [drawingType]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchName(searchName);
        }, 600);
        return () => clearTimeout(handler);
    }, [searchName]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!debouncedSearchName || debouncedSearchName.length < 1) {
                setSearchResults([]);
                setShowSearchPopup(false);
                return;
            }

            try {
                const endpoint = activeMenu;
                
                const res = await fetch(`${API_BASE}/api/${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: AbortSignal.timeout(10000)
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const data = await res.json();
                
                if (!Array.isArray(data)) {
                    throw new Error('Backend\'den beklenmeyen veri formatı geldi');
                }

                const searchTerm = debouncedSearchName.toLowerCase().trim();
                const filteredData = data.filter(d => {
                    const name = (d.name || d.isim || d.title || d.label || '').toLowerCase();
                    return name.includes(searchTerm);
                });

                const formatted = filteredData.map(d => ({
                    id: d.id,
                    name: d.name || d.isim || d.title || d.label || 'İsimsiz',
                    wkt: d.wkt,
                    type: endpoint
                }));

                setSearchResults(formatted);
                setSearchPage(1);
                setShowSearchPopup(true);
                
                if (formatted.length === 0) {
                    setMessage({ 
                        type: 'warning', 
                        text: `"${debouncedSearchName}" için ${endpoint} tipinde sonuç bulunamadı` 
                    });
                } else {
                    setMessage(null);
                }

            } catch (err) {
                let errorMessage = 'Bilinmeyen hata';
                
                if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
                    errorMessage = `Backend sunucusuna bağlanılamıyor. Lütfen backend'in çalıştığından emin olun (${API_BASE})`;
                } else if (err.name === 'TimeoutError') {
                    errorMessage = 'Backend yanıt vermiyor (timeout). Sunucu yavaş olabilir.';
                } else if (err.message.includes('HTTP')) {
                    errorMessage = `Backend hatası: ${err.message}`;
                } else {
                    errorMessage = `Arama hatası: ${err.message}`;
                }
                
                setMessage({ type: 'error', text: errorMessage });
                setSearchResults([]);
                setShowSearchPopup(false);
            }
        };

        const timeoutId = setTimeout(fetchSearchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [debouncedSearchName, activeMenu]);

    const clearSelection = useCallback(() => {
        selectedFeatureRef.current = null;
        setSelectedFeature(null);
        setIsModifying(false);
        setModifyingFeature(null);
        
        if (selectRef.current) {
            selectRef.current.getFeatures().clear();
        }
        
        vectorSourceRef.current.changed();
    }, []);

    const clearMap = useCallback(() => {
        vectorSourceRef.current.clear();
        aTypeSnapSourceRef.current.clear();
        bTypeSnapSourceRef.current.clear();
        clearSelection();
        setMessage({ type: 'info', text: 'Harita temizlendi.' });
    }, [clearSelection]);

    const zoomToAllFeatures = useCallback(() => {
        const features = vectorSourceRef.current.getFeatures();
        if (features.length === 0) {
            setMessage({ type: 'warning', text: 'Haritada geometri bulunamadı.' });
            return;
        }

        const extent = vectorSourceRef.current.getExtent();
        mapInstanceRef.current.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });
    }, []);

    const checkPolygonIntersection = useCallback(async (newPolygonWkt) => {
        try {
            const response = await fetch(`${API_BASE}/api/Polygon/check-intersection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ wkt: newPolygonWkt })
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.hasIntersection) {
                    const intersectionCount = result.intersectingCount || 0;
                    const intersectingPolygons = result.intersectingPolygons || [];
                    
                    let detailMessage = `⚠️ Bu poligon ${intersectionCount} adet mevcut poligon ile kesişiyor!`;
                    
                    if (intersectingPolygons.length > 0) {
                        const polygonNames = intersectingPolygons
                            .map(p => `"${p.name || p.Name}" (Alan: ${(p.intersectionArea || p.IntersectionArea || 0).toFixed(6)})`)
                            .join(', ');
                        detailMessage += ` Kesişen poligonlar: ${polygonNames}`;
                    }
                    
                    setMessage({ 
                        type: 'warning', 
                        text: detailMessage
                    });
                    
                    return intersectingPolygons;
                } else {
                    setMessage({ 
                        type: 'success', 
                        text: '✅ Bu poligon mevcut hiçbir poligon ile kesişmiyor' 
                    });
                }
            } else {
                const errorText = await response.text();
                setMessage({ 
                    type: 'error', 
                    text: `Intersection kontrolü başarısız: ${response.status} - ${errorText}` 
                });
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: `Intersection kontrolü hatası: ${error.message}` 
            });
        }
        return [];
    }, []);

    const countPointsInPolygon = useCallback((polygonFeature) => {
        const polygonGeometry = polygonFeature.getGeometry();
        const allFeatures = vectorSourceRef.current.getFeatures();
        let pointCount = 0;
        
        allFeatures.forEach(feature => {
            if (feature.get('type') === 'Point' && feature !== polygonFeature) {
                const pointGeometry = feature.getGeometry();
                if (polygonGeometry.intersectsCoordinate(pointGeometry.getCoordinates())) {
                    pointCount++;
                }
            }
        });
        
        return pointCount;
    }, []);

    const cancelDrawing = useCallback(() => {
        if (!mapInstanceRef.current) return;
        if (drawRef.current) {
            mapInstanceRef.current.removeInteraction(drawRef.current);
            drawRef.current = null;
        }
        if (snapRef.current) {
            mapInstanceRef.current.removeInteraction(snapRef.current);
            snapRef.current = null;
        }
        setDrawingType(null);
        aTypeSnapSourceRef.current.clear();
        bTypeSnapSourceRef.current.clear();
    }, []);

    const fetchFeaturesByType = useCallback(async (type) => {
        setLoading(true);
        const format = new WKT();
        vectorSourceRef.current.clear();
        aTypeSnapSourceRef.current.clear();
        bTypeSnapSourceRef.current.clear();
        let features = [];
        
        try {
            const res = await fetch(`${API_BASE}/api/${type}`, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json; charset=utf-8'
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach((d) => {
                        try {
                            const f = format.readFeature(d.wkt, {
                                dataProjection: 'EPSG:4326',
                                featureProjection: 'EPSG:3857',
                            });
                            const featureName = d.name || d.isim || d.title || d.label || '';
                            
                            const uniqueId = `${type}-${d.id}`;
                            f.setProperties({ 
                                name: featureName, 
                                wkt: d.wkt, 
                                id: d.id, 
                                type, 
                                originalId: d.id,
                                geometryType: d.type || d.geometryType || 'A'
                            });
                            f.setId(uniqueId);
                            
                            vectorSourceRef.current.addFeature(f);
                            features.push({ 
                                id: d.id, 
                                name: featureName, 
                                wkt: d.wkt, 
                                type,
                                geometryType: d.type || d.geometryType || 'A'
                            });
                        } catch (e) {
                            console.error(`❌ ${type} feature okuma hatası:`, e);
                        }
                    });
                }
            }
        } catch (e) {
            console.error(`❌ Error loading ${type}:`, e);
        }
        
        setFeatureList(features);
        setShowList(true);
        setSelectedFeature(null);
        setCurrentPage(1);
        setLoading(false);
        
        setTimeout(() => {
            updateSnapPoints();
        }, 100);
        
        if (features.length === 0) {
            setMessage({ type: 'warning', text: `${type} için hiçbir veri bulunamadı.` });
        } else {
            setMessage({ type: 'success', text: `${features.length} adet ${type} yüklendi.` });
            setTimeout(() => zoomToAllFeatures(), 200);
        }
    }, [zoomToAllFeatures, updateSnapPoints]);

    const startDrawing = useCallback((type) => {
        if (drawingType) {
            setMessage({ type: 'error', text: messages.drawingAlready });
            return;
        }

        clearSelection();
        
        setDrawingType(type); 
        
        setTimeout(() => {
            updateSnapPoints();
        }, 10);

        const draw = new Draw({
            source: vectorSourceRef.current,
            type: type,
            ...(type === 'LineString' && {
                minPoints: 2,
                maxPoints: undefined,
                finishCondition: function(mapBrowserEvent) {
                    return mapBrowserEvent.originalEvent.key === 'Enter';
                }
            })
        });

        let snapSource;
        if (selectedType === 'B' || selectedType === 'C') {
            snapSource = aTypeSnapSourceRef.current;
        } else {
            const combinedSource = new VectorSource();
            aTypeSnapSourceRef.current.getFeatures().forEach(f => combinedSource.addFeature(f));
            bTypeSnapSourceRef.current.getFeatures().forEach(f => combinedSource.addFeature(f));
            snapSource = combinedSource;
        }
        
        const snap = new Snap({
            source: snapSource,
            pixelTolerance: 20,
            vertex: true,
            edge: false
        });
        
        mapInstanceRef.current.addInteraction(snap);
        snapRef.current = snap;
        
        let snapMessage = '';
        if (selectedType === 'B') {
            snapMessage = '🎯 B Tipi Çizim: Neon pembe A tipi noktalara otomatik çekim aktif!';
        } else if (selectedType === 'C') {
            snapMessage = '🎯 C Tipi Çizim: Neon sarı B tipi noktalara çekim aktif!';
        } else {
            snapMessage = '🎯 A Tipi Çizim: Tüm noktalara otomatik çekim aktif!';
        }
        
        setMessage({ 
            type: 'info', 
            text: snapMessage
        });

        setTimeout(() => {
            updateSnapPoints();
        }, 50);

        if (type === 'LineString') {
            const handleKeyPress = (e) => {
                if (e.key === 'Enter') {
                    draw.finishDrawing();
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
            
            draw.on('drawend', () => {
                document.removeEventListener('keydown', handleKeyPress);
            });
            
            draw.on('drawabort', () => {
                document.removeEventListener('keydown', handleKeyPress);
            });
        }

        draw.on('drawend', async (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            
            let wkt = '';
            
            if (type === 'Point') {
                const coords = geometry.getCoordinates();
                const lonlat = transform(coords, 'EPSG:3857', 'EPSG:4326');
                wkt = `POINT(${lonlat[0]} ${lonlat[1]})`;
            } 
            else if (type === 'LineString') {
                const coords = geometry.getCoordinates();
                const lonlatCoords = coords.map(coord => {
                    const lonlat = transform(coord, 'EPSG:3857', 'EPSG:4326');
                    return `${lonlat[0]} ${lonlat[1]}`;
                });
                wkt = `LINESTRING(${lonlatCoords.join(', ')})`;
            }
            else if (type === 'Polygon') {
                const coords = geometry.getCoordinates();
                const rings = coords.map(ring => {
                    const lonlatCoords = ring.map(coord => {
                        const lonlat = transform(coord, 'EPSG:3857', 'EPSG:4326');
                        return `${lonlat[0]} ${lonlat[1]}`;
                    });
                    return `(${lonlatCoords.join(', ')})`;
                });
                wkt = `POLYGON(${rings.join(', ')})`;
            }
            
            if (type === 'Polygon') {
                await checkPolygonIntersection(wkt);
            }

            let promptText = '';
            let endpoint = '';
            
            switch (type) {
                case 'Point':
                    promptText = messages.pointName;
                    endpoint = 'Point';
                    break;
                case 'LineString':
                    promptText = messages.lineName;
                    endpoint = 'Line';
                    break;
                case 'Polygon':
                    promptText = messages.polygonName;
                    endpoint = 'Polygon';
                    break;
                default:
                    promptText = 'Geometri için bir isim girin:';
                    endpoint = 'Point';
                    break;
            }

            const userInput = prompt(promptText);
            if (!userInput) {
                setMessage({ type: 'error', text: messages.nameRequired });
                vectorSourceRef.current.removeFeature(feature);
                cancelDrawing();
                return;
            }

            feature.setProperties({ name: userInput, wkt, type: endpoint });
            const tempId = Math.random().toString(36).substr(2, 9);
            feature.setId(tempId);

            const dto = { 
                name: userInput, 
                wkt,
                type: activeMenu === 'Polygon' ? 'A' : selectedType
            };

            setLoading(true);
            setMessage({ type: 'info', text: messages.saving });
            
            try {
                const response = await fetch(`${API_BASE}/api/${endpoint}/add`, {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json; charset=utf-8',
                       'Accept': 'application/json; charset=utf-8'
                   },
                   body: JSON.stringify(dto),
               });

               if (response.ok) {
                   const result = await response.json();
                   
                   let apiId = null;
                   if (result.data && result.data.id) {
                       apiId = result.data.id;
                   } else if (result.id) {
                       apiId = result.id;
                   } else if (result.Id) {
                       apiId = result.Id;
                   }
                   
                   if (apiId) {
                       const uniqueId = `${endpoint}-${apiId}`;
                       feature.setId(uniqueId);
                       feature.setProperties({ 
                           name: userInput, 
                           wkt, 
                           type: endpoint, 
                           id: apiId, 
                           originalId: apiId,
                           geometryType: dto.type
                       });
                   }

                   let successMessage = '';
                   switch (type) {
                       case 'Point':
                           successMessage = messages.pointAdded;
                           break;
                       case 'LineString':
                           successMessage = messages.lineAdded;
                           break;
                       case 'Polygon':
                           successMessage = messages.polygonAdded;
                           break;
                       default:
                           successMessage = 'Geometri başarıyla eklendi.';
                           break;
                   }

                   setMessage({ type: 'success', text: successMessage });
                   
                   setTimeout(() => {
                       updateSnapPoints();
                   }, 100);
                   
                   if (showList && activeMenu === endpoint) {
                       setTimeout(() => {
                           fetchFeaturesByType(endpoint);
                       }, 500);
                   }
               } else {
                   const errorText = await response.text();
                   
                   let errorMessage = `${endpoint} kaydetme hatası: ${response.status}`;
                   try {
                       const errorData = JSON.parse(errorText);
                       if (errorData.message) {
                           errorMessage = errorData.message;
                       }
                   } catch (e) {
                       errorMessage = errorText || errorMessage;
                   }
                   
                   setMessage({ type: 'error', text: errorMessage });
                   vectorSourceRef.current.removeFeature(feature);
               }
           } catch (err) {
               setMessage({ type: 'error', text: `${endpoint} kaydetme hatası: ${err.message}` });
               vectorSourceRef.current.removeFeature(feature);
           } finally {
               setLoading(false);
               cancelDrawing();
           }
       });

       mapInstanceRef.current.addInteraction(draw);
       drawRef.current = draw;
   }, [drawingType, messages, cancelDrawing, activeMenu, showList, clearSelection, fetchFeaturesByType, checkPolygonIntersection, selectedType, updateSnapPoints]);

   const updateFeatureOnServer = useCallback(async (feature) => {
       const geometry = feature.getGeometry();
       const type = feature.get('type');
       const originalId = feature.get('originalId');
       const name = feature.get('name');
       const geometryType = feature.get('geometryType') || 'A';
       
       console.log(`🔄 Güncelleniyor: ${type} ID: ${originalId}, GeometryType: ${geometryType}`);
       
       let wkt = '';
       
       if (type === 'Point') {
           const coords = geometry.getCoordinates();
           const lonlat = transform(coords, 'EPSG:3857', 'EPSG:4326');
           wkt = `POINT(${lonlat[0]} ${lonlat[1]})`;
       } 
       else if (type === 'Line') {
           const coords = geometry.getCoordinates();
           const lonlatCoords = coords.map(coord => {
               const lonlat = transform(coord, 'EPSG:3857', 'EPSG:4326');
               return `${lonlat[0]} ${lonlat[1]}`;
           });
           wkt = `LINESTRING(${lonlatCoords.join(', ')})`;
       }
       else if (type === 'Polygon') {
           const coords = geometry.getCoordinates();
           const rings = coords.map(ring => {
               const lonlatCoords = ring.map(coord => {
                   const lonlat = transform(coord, 'EPSG:3857', 'EPSG:4326');
                   return `${lonlat[0]} ${lonlat[1]}`;
               });
               return `(${lonlatCoords.join(', ')})`;
           });
           wkt = `POLYGON(${rings.join(', ')})`;
       }
       
       try {
           const updateData = { 
               name, 
               wkt,
               type: geometryType 
           };
           
           console.log(`📤 Backend'e gönderilen data:`, updateData);
           
           const res = await fetch(`${API_BASE}/api/${type}/${originalId}`, {
               method: 'PUT',
               headers: {
                   'Content-Type': 'application/json; charset=utf-8',
                   'Accept': 'application/json; charset=utf-8'
               },
               body: JSON.stringify(updateData)
           });
           
           if (res.ok) {
               feature.setProperties({ ...feature.getProperties(), wkt });
               setMessage({ type: 'success', text: messages.featureUpdated });
               
               setTimeout(() => {
                   updateSnapPoints();
               }, 100);
           } else {
               const errorText = await res.text();
               console.error(`❌ Backend yanıtı:`, errorText);
               setMessage({ type: 'error', text: `Güncelleme hatası: ${res.status} - ${errorText}` });
           }
       } catch (error) {
           console.error(`❌ Güncelleme hatası:`, error);
           setMessage({ type: 'error', text: `Güncelleme hatası: ${error.message}` });
       }
   }, [messages, updateSnapPoints]);

   const testAllEndpoints = async () => {
       const endpoints = ['Point', 'Line', 'Polygon'];
       
       for (let endpoint of endpoints) {
           try {
               const res = await fetch(`${API_BASE}/api/${endpoint}`, {
                   headers: {
                       'Content-Type': 'application/json; charset=utf-8',
                       'Accept': 'application/json; charset=utf-8'
                   }
               });
               
               if (res.ok) {
                   const data = await res.json();
                   console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'OK'} items`);
               } else {
                   console.log(`❌ ${endpoint}: ${res.status}`);
               }
           } catch (error) {
               console.log(`💥 ${endpoint}: ${error.message}`);
           }
       }
       
       setMessage({ type: 'info', text: 'API test tamamlandı. Console\'u kontrol edin.' });
   };

   const fetchAllToMap = async () => {
       setLoading(true);
       const format = new WKT();
       vectorSourceRef.current.clear();
       aTypeSnapSourceRef.current.clear();
       bTypeSnapSourceRef.current.clear();
       let totalFeatures = 0;
       
       const endpointConfigs = [
           { name: 'Point', endpoints: ['Point'] },
           { name: 'Line', endpoints: ['Line'] },
           { name: 'Polygon', endpoints: ['Polygon'] }
       ];
       
       for (let config of endpointConfigs) {
           for (let endpoint of config.endpoints) {
               try {
                   const res = await fetch(`${API_BASE}/api/${endpoint}`, {
                       headers: {
                           'Content-Type': 'application/json; charset=utf-8',
                           'Accept': 'application/json; charset=utf-8'
                       }
                   });
                   
                   if (res.ok) {
                       const data = await res.json();
                       
                       if (Array.isArray(data) && data.length > 0) {
                           for (let d of data) {
                               try {
                                   if (!d.wkt) continue;
                                   
                                   const f = format.readFeature(d.wkt, {
                                       dataProjection: 'EPSG:4326',
                                       featureProjection: 'EPSG:3857',
                                   });
                                   
                                   const uniqueId = `${config.name}-${d.id}`;
                                   const featureName = d.name || d.isim || d.title || d.label || '';
                                   f.setProperties({ 
                                       name: featureName, 
                                       wkt: d.wkt, 
                                       id: d.id, 
                                       type: config.name, 
                                       originalId: d.id,
                                       geometryType: d.type || d.geometryType || 'A'
                                   });
                                   f.setId(uniqueId);
                                   
                                   vectorSourceRef.current.addFeature(f);
                                   totalFeatures++;
                               } catch (e) {
                                   console.error(`❌ ${endpoint} feature hatası:`, e);
                               }
                           }
                       }
                   }
               } catch (e) {
                   console.error(`💥 ${endpoint} bağlantı hatası:`, e);
               }
           }
       }
       
       setLoading(false);
       
       setTimeout(() => {
           updateSnapPoints();
       }, 100);
       
       if (totalFeatures > 0) {
           setMessage({ type: 'success', text: `${totalFeatures} geometri yüklendi.` });
           setTimeout(() => zoomToAllFeatures(), 500);
       } else {
           setMessage({ type: 'error', text: 'Hiçbir geometri yüklenemedi!' });
       }
   };

   const fetchFeatureById = async (id, type) => {
       if (!id || !id.trim()) {
           setMessage({ type: 'error', text: 'Lütfen bir ID girin!' });
           return;
       }

       const trimmedId = id.trim();
       const uniqueId = `${type}-${trimmedId}`;
       
       const existingFeature = vectorSourceRef.current.getFeatureById(uniqueId);
       
       if (existingFeature) {
           const geometry = existingFeature.getGeometry();
           let coords = 'Koordinat okunamadı';
           
           try {
               const geometryType = geometry.getType();
               
               if (geometryType === 'Point') {
                   const coordinates = geometry.getCoordinates();
                   const lonlat = transform(coordinates, 'EPSG:3857', 'EPSG:4326');
                   coords = `${lonlat[0].toFixed(6)}, ${lonlat[1].toFixed(6)}`;
               } 
               else if (geometryType === 'LineString') {
                   const coordinates = geometry.getCoordinates();
                   const startPoint = transform(coordinates[0], 'EPSG:3857', 'EPSG:4326');
                   const endPoint = transform(coordinates[coordinates.length - 1], 'EPSG:3857', 'EPSG:4326');
                   coords = `Başlangıç: ${startPoint[0].toFixed(6)}, ${startPoint[1].toFixed(6)} | Bitiş: ${endPoint[0].toFixed(6)}, ${endPoint[1].toFixed(6)} (${coordinates.length} nokta)`;
               }
               else if (geometryType === 'Polygon') {
                   const coordinates = geometry.getCoordinates()[0];
                   const center = geometry.getInteriorPoint().getCoordinates();
                   const centerLonLat = transform(center, 'EPSG:3857', 'EPSG:4326');
                   coords = `Merkez: ${centerLonLat[0].toFixed(6)}, ${centerLonLat[1].toFixed(6)} (${coordinates.length - 1} köşe)`;
               }
           } catch (e) {
               console.error('Koordinat okuma hatası:', e);
               coords = 'Koordinat hesaplanamadı';
           }
           
           const featureName = existingFeature.get('name') || 'İsimsiz';
           
           let additionalInfo = '';
           if (type === 'Polygon') {
               const pointCount = countPointsInPolygon(existingFeature);
               additionalInfo = `, İçindeki Point Sayısı: ${pointCount}`;
           }
           
           setSelectedFeature({
               id: trimmedId,
               name: featureName,
               coords: coords + additionalInfo,
               wkt: existingFeature.get('wkt') || 'WKT mevcut değil',
               type: type
           });
           
           const extent = geometry.getExtent();
           mapInstanceRef.current.getView().fit(extent, {
               padding: [50, 50, 50, 50],
               duration: 1000,
               maxZoom: 12
           });
           
           setMessage({ type: 'success', text: 'Feature haritada bulundu!' });
           return;
       }
       
       setMessage({ type: 'error', text: `${type} tipinde ID ${trimmedId} bulunamadı!` });
       setSelectedFeature(null);
   };

   const deleteFeature = async (id, type) => {
       if (!id || !id.trim()) {
           setMessage({ type: 'error', text: 'ID giriniz!' });
           return;
       }

       const trimmedId = id.trim();
       
       const allFeatures = vectorSourceRef.current.getFeatures();
       let targetFeature = null;
       
       for (let feature of allFeatures) {
           const featureOriginalId = feature.get('originalId') || feature.get('id');
           const featureType = feature.get('type');
           
           if (featureOriginalId === trimmedId && featureType === type) {
               targetFeature = feature;
               break;
           }
       }
       
       if (targetFeature) {
           vectorSourceRef.current.removeFeature(targetFeature);
       }
       
       try {
           const res = await fetch(`${API_BASE}/api/${type}/${trimmedId}`, {
               method: 'DELETE',
               headers: {
                   'Content-Type': 'application/json; charset=utf-8',
                   'Accept': 'application/json; charset=utf-8'
               }
           });
           
           if (res.ok) {
               setMessage({ type: 'success', text: messages.featureDeleted });
               
               setTimeout(() => {
                   updateSnapPoints();
               }, 100);
               
               setTimeout(() => fetchFeaturesByType(type), 500);
           } else if (res.status === 404) {
               setMessage({ type: 'error', text: `${type} ID ${trimmedId} sunucuda bulunamadı! Geometri mevcut değil.` });
               if (targetFeature) {
                   vectorSourceRef.current.addFeature(targetFeature);
               }
           } else {
               setMessage({ type: 'error', text: `Silme hatası: ${res.status} - Geometri sunucudan silinemedi` });
               if (targetFeature) {
                   vectorSourceRef.current.addFeature(targetFeature);
               }
           }
       } catch (e) {
           setMessage({ type: 'error', text: `Sunucu bağlantı hatası: ${e.message}` });
           if (targetFeature) {
               vectorSourceRef.current.addFeature(targetFeature);
           }
       }
       
       setSelectedFeature(null);
       setSelectedId('');
       clearSelection();
   };

   const updateFeatureName = async (id, type) => {
       if (!id || !id.trim()) {
           setMessage({ type: 'error', text: 'ID giriniz!' });
           return;
       }

       const trimmedId = id.trim();
       
       try {
           const newNameInput = prompt('Yeni isim giriniz:');
           if (!newNameInput || !newNameInput.trim()) {
               setMessage({ type: 'error', text: 'Geçerli bir isim giriniz!' });
               return;
           }
           
           const allFeatures = vectorSourceRef.current.getFeatures();
           let targetFeature = null;
           
           for (let feature of allFeatures) {
               const featureOriginalId = feature.get('originalId') || feature.get('id');
               const featureType = feature.get('type');
               
               if (featureOriginalId === trimmedId && featureType === type) {
                   targetFeature = feature;
                   break;
               }
           }
           
           let wktValue = '';
           let geometryType = 'A';
           if (targetFeature) {
               wktValue = targetFeature.get('wkt') || '';
               geometryType = targetFeature.get('geometryType') || 'A';
           }
           
           const updateData = { 
               name: newNameInput, 
               wkt: wktValue,
               type: geometryType 
           };
           
           const res = await fetch(`${API_BASE}/api/${type}/${trimmedId}`, {
               method: 'PUT',
               headers: {
                   'Content-Type': 'application/json; charset=utf-8',
                   'Accept': 'application/json; charset=utf-8'
               },
               body: JSON.stringify(updateData)
           });
           
           if (res.ok) {
               if (targetFeature) {
                   targetFeature.setProperties({ ...targetFeature.getProperties(), name: newNameInput });
               }
               
               setMessage({ type: 'success', text: messages.featureUpdated });
               setTimeout(() => fetchFeaturesByType(type), 500);
               
           } else {
               const errorText = await res.text();
               setMessage({ type: 'error', text: `Güncelleme hatası: ${res.status} - ${errorText}` });
           }
           
           setSelectedFeature(null);
           setSelectedId('');
           
       } catch (e) {
           setMessage({ type: 'error', text: `Güncelleme hatası: ${e.message}` });
       }
   };

   const totalPagesFeatureList = Math.ceil(featureList.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const currentItems = featureList.slice(startIndex, endIndex);

   const goToPage = (page) => {
       setCurrentPage(page);
   };

   const renderPagination = () => {
       if (totalPagesFeatureList <= 1) return null;

       const pages = [];
       const maxVisiblePages = 5;
       
       let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
       let endPage = Math.min(totalPagesFeatureList, startPage + maxVisiblePages - 1);
       
       if (endPage - startPage + 1 < maxVisiblePages) {
           startPage = Math.max(1, endPage - maxVisiblePages + 1);
       }

       if (currentPage > 1) {
           pages.push(
               <button
                   key="prev"
                   style={{
                       ...cuteActionStyle('#c77dff'),
                       fontSize: '0.8rem',
                       padding: '6px 10px',
                       margin: '2px'
                   }}
                   onClick={() => goToPage(currentPage - 1)}
               >
                   ‹
               </button>
           );
       }

       for (let i = startPage; i <= endPage; i++) {
           pages.push(
               <button
                   key={i}
                   style={{
                       ...cuteActionStyle(i === currentPage ? '#f72585' : '#ff8fab'),
                       fontSize: '0.8rem',
                       padding: '6px 10px',
                       margin: '2px',
                       fontWeight: i === currentPage ? 'bold' : 'normal'
                   }}
                   onClick={() => goToPage(i)}
               >
                   {i}
               </button>
           );
       }

       if (currentPage < totalPagesFeatureList) {
           pages.push(
               <button
                   key="next"
                   style={{
                       ...cuteActionStyle('#c77dff'),
                       fontSize: '0.8rem',
                       padding: '6px 10px',
                       margin: '2px'
                   }}
                   onClick={() => goToPage(currentPage + 1)}
               >
                   ›
               </button>
           );
       }

       return (
           <div style={{
               display: 'flex',
               justifyContent: 'center',
               alignItems: 'center',
               padding: '15px',
               gap: '5px',
               borderTop: '1px solid rgba(248, 187, 208, 0.2)'
           }}>
               {pages}
           </div>
       );
   };

   useEffect(() => {
       if (mapInstanceRef.current) return;

       const vectorLayer = new VectorLayer({
           source: vectorSourceRef.current,
           style: (feature) => {
               const isSelected = selectedFeatureRef.current === feature;
               const isModifyingThis = modifyingFeature === feature;
               return getGeometryStyle(isSelected, isModifyingThis);
           }
       });

       const aTypeSnapLayer = new VectorLayer({
           source: aTypeSnapSourceRef.current,
           style: getATypeSnapPointStyle(),
           zIndex: 100
       });

       const bTypeSnapLayer = new VectorLayer({
           source: bTypeSnapSourceRef.current,
           style: getBTypeSnapPointStyle(),
           zIndex: 100
       });

       const select = new Select({
           condition: click,
           layers: [vectorLayer],
           style: (feature) => getGeometryStyle(true, false)
       });

       const modify = new Modify({
           features: select.getFeatures(),
           style: (feature) => getGeometryStyle(false, true)
       });

       const map = new Map({
           target: mapRef.current,
           layers: [
               new TileLayer({ 
                   source: new OSM(),
                   preload: 0
               }),
               vectorLayer,
               aTypeSnapLayer,
               bTypeSnapLayer,
           ],
           view: new View({
               center: fromLonLat([35.0, 39.0]),
               zoom: 6,
           }),
           pixelRatio: 1,
           moveTolerance: 5
       });

       select.on('select', (event) => {
           if (event.selected.length > 0) {
               const feature = event.selected[0];
               selectedFeatureRef.current = feature;

               let additionalInfo = '';
               if (feature.get('type') === 'Polygon') {
                   const pointCount = countPointsInPolygon(feature);
                   additionalInfo = ` (İçinde ${pointCount} nokta)`;
               }

               let coords = '';
               try {
                   const geometry = feature.getGeometry();
                   const geometryType = geometry.getType();

                   if (geometryType === 'Point') {
                       const lonlat = transform(geometry.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
                       coords = `${lonlat[0].toFixed(6)}, ${lonlat[1].toFixed(6)}`;
                   } else if (geometryType === 'LineString') {
                       const coordinates = geometry.getCoordinates();
                       const start = transform(coordinates[0], 'EPSG:3857', 'EPSG:4326');
                       const end = transform(coordinates[coordinates.length - 1], 'EPSG:3857', 'EPSG:4326');
                       coords = `Başlangıç: ${start[0].toFixed(6)}, ${start[1].toFixed(6)} → Bitiş: ${end[0].toFixed(6)}, ${end[1].toFixed(6)}`;
                   } else if (geometryType === 'Polygon') {
                       const center = geometry.getInteriorPoint().getCoordinates();
                       const lonlat = transform(center, 'EPSG:3857', 'EPSG:4326');
                       coords = `Merkez: ${lonlat[0].toFixed(6)}, ${lonlat[1].toFixed(6)}`;
                   }
               } catch (e) {
                   coords = 'Koordinat okunamadı';
               }

               setSelectedFeature({
                   id: feature.get('originalId'),
                   name: feature.get('name') + additionalInfo,
                   type: feature.get('type'),
                   coords: coords
               });

               setIsModifying(true);
               setModifyingFeature(feature);
           } else {
               clearSelection();
           }
       });

       modify.on('modifystart', (event) => {
           setMessage({ type: 'info', text: 'Geometri düzenleniyor... Değişiklikleri kaydetmek için başka bir yere tıklayın.' });
       });

       modify.on('modifyend', (event) => {
           const feature = event.features.getArray()[0];
           updateFeatureOnServer(feature);
       });

       map.addInteraction(select);
       map.addInteraction(modify);

       selectRef.current = select;
       modifyRef.current = modify;
       mapInstanceRef.current = map;

       setTimeout(() => {
           map.updateSize();
       }, 300);
   }, [clearSelection, modifyingFeature, updateFeatureOnServer, countPointsInPolygon]);

   useEffect(() => {
       const handleEscKey = (e) => {
           if (e.key === 'Escape' && drawingType) {
               cancelDrawing();
               setMessage({ type: 'info', text: '✖️ ESC tuşu ile çizim iptal edildi.' });
           }
       };

       document.addEventListener('keydown', handleEscKey);
       return () => document.removeEventListener('keydown', handleEscKey);
   }, [drawingType, cancelDrawing]);

   return (
       <div style={{
           width: '100vw',
           height: '100vh',
           margin: 0,
           padding: 0,
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
           fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
           display: 'flex',
           flexDirection: 'column',
           overflow: 'hidden'
       }}>
           <div style={{
               background: 'linear-gradient(135deg, rgba(248, 187, 208, 0.15) 0%, rgba(199, 125, 255, 0.15) 100%)',
               backdropFilter: 'blur(20px)',
               borderBottom: '1px solid rgba(248, 187, 208, 0.3)',
               padding: '15px 25px',
               boxShadow: '0 8px 32px rgba(248, 187, 208, 0.1)',
               zIndex: 1000
           }}>
               <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   gap: '20px'
               }}>
                   <h1 style={{
                       color: '#f8bbd0',
                       fontSize: '1.8rem',
                       fontWeight: '700',
                       margin: 0,
                       background: 'linear-gradient(45deg, #f8bbd0 0%, #c77dff 50%, #ff6b9d 100%)',
                       WebkitBackgroundClip: 'text',
                       WebkitTextFillColor: 'transparent',
                       letterSpacing: '-0.5px'
                   }}>
                       🗺️ Harita Uygulaması
                   </h1>
                   
                   <input
                       type="text"
                       placeholder="İsme göre ara..."
                       value={searchName}
                       onChange={e => setSearchName(e.target.value)}
                       style={{
                           padding: '10px 16px',
                           fontSize: '15px',
                           borderRadius: '14px',
                           backgroundColor: '#1c1531',
                           border: '1px solid #3b2a55',
                           color: '#f8bbd0',
                           outline: 'none',
                           width: '240px'
                       }}
                   />
                   
                   <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                       <button style={pinkButtonStyle('#ff6b9d', '#e63946')} onClick={clearMap}>
                           🗑️ Haritayı Temizle
                       </button>
                       <button style={pinkButtonStyle('#c77dff', '#9d4edd')} onClick={testAllEndpoints}>
                           🔍 API Test
                       </button>
                       <button style={pinkButtonStyle('#f72585', '#b5179e')} onClick={fetchAllToMap}>
                           🌍 Tümünü Yükle
                       </button>
                   </div>
               </div>
           </div>

           <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
               <div style={{
                   width: '380px',
                   background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 35, 0.95) 100%)',
                   backdropFilter: 'blur(20px)',
                   borderRight: '1px solid rgba(248, 187, 208, 0.2)',
                   display: 'flex',
                   flexDirection: 'column',
                   zIndex: 999,
                   height: '100%', 
                   overflow: 'hidden' 
               }}>
                   <div style={{ padding: '20px', borderBottom: '1px solid rgba(248, 187, 208, 0.2)' }}>
                       <h3 style={{
                           color: '#f8bbd0',
                           fontSize: '1.1rem',
                           fontWeight: '600',
                           margin: '0 0 15px 0'
                       }}>
                           ✨ Geometri Türleri
                       </h3>
                       <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                           {['Nokta', 'Çizgi', 'Alan'].map((label, index) => {
                               const type = ['Point', 'Line', 'Polygon'][index];
                               return (
                                   <button
                                       key={type}
                                       style={cuteTabStyle(activeMenu === type)}
                                       onClick={() => {
                                           setActiveMenu(type);
                                           setShowList(false);
                                           setSelectedFeature(null);
                                           setSelectedId('');
                                       }}
                                   >
                                       {type === 'Point' ? '💖' : type === 'Line' ? '💫' : '🌸'} {label}
                                   </button>
                               );
                           })}
                       </div>
                   </div>

                   {/* İşlemler */}
                   <div style={{ padding: '20px', borderBottom: '1px solid rgba(248, 187, 208, 0.2)' }}>
                       <h4 style={{
                           color: '#f8bbd0',
                           fontSize: '1rem',
                           fontWeight: '600',
                           margin: '0 0 15px 0'
                       }}>
                           🎀 {activeMenu === 'Point' ? 'Nokta' : activeMenu === 'Line' ? 'Çizgi' : 'Alan'} İşlemleri
                       </h4>
                       
                       {/* Tip Seçici */}
                       {(activeMenu === 'Point' || activeMenu === 'Line') && (
                           <div style={{ marginBottom: '15px' }}>
                               <label style={{
                                   display: 'block',
                                   color: '#f8bbd0',
                                   marginBottom: '8px'
                               }}>
                                   🔤 Geometri Tipi:
                               </label>
                               <div style={{ display: 'flex', gap: '8px' }}>
                                   {['A', 'B', 'C'].map(type => (
                                       <button
                                           key={type}
                                           style={{
                                               ...cuteActionStyle(selectedType === type ? '#f72585' : '#8b5a8c'),
                                               fontSize: '0.8rem',
                                               padding: '6px 12px',
                                               flex: 1
                                           }}
                                           onClick={() => {
                                               setSelectedType(type);
                                               if (type === 'A') {
                                                   setMessage({ type: 'info', text: 'A tipi: Tüm noktalara çekim aktif 🎯' });
                                               } else if (type === 'B') {
                                                   setMessage({ type: 'info', text: 'B tipi: Neon pembe A tipi noktalara otomatik çekim aktif! 💖' });
                                               } else if (type === 'C') {
                                                   setMessage({ type: 'info', text: 'C tipi: Neon sarı B tipi noktalara otomatik çekim aktif! ⚡' });
                                               }
                                           }}
                                       >
                                           Tip {type}
                                       </button>
                                   ))}
                               </div>
                               <div style={{
                                   fontSize: '0.75rem',
                                   color: '#c77dff',
                                   marginTop: '5px',
                                   opacity: 0.8,
                                   lineHeight: '1.3'
                               }}>
                                   {selectedType === 'A' && 'A: Tüm noktalara çekim, neon pembe snap noktaları'}
                                   {selectedType === 'B' && 'B: Sadece A tipi noktalara çekim 💖'}
                                   {selectedType === 'C' && 'C: Sadece B tipi noktalara çekim ⚡'}
                               </div>
                           </div>
                       )}
                       
                       <div style={{
                           display: 'grid',
                           gridTemplateColumns: '1fr 1fr',
                           gap: '10px',
                           marginBottom: '20px'
                       }}>
                           <button 
                               style={cuteActionStyle('#f72585')} 
                               onClick={() => startDrawing(activeMenu === 'Line' ? 'LineString' : activeMenu)}
                               disabled={drawingType !== null}
                           >
                               ➕ {activeMenu === 'Point' ? 'Nokta' : activeMenu === 'Line' ? 'Çizgi' : 'Alan'} Ekle
                           </button>
                           <button 
                               style={cuteActionStyle('#c77dff')} 
                               onClick={() => fetchFeaturesByType(activeMenu)}
                           >
                               📋 Tümünü Listele
                           </button>
                       </div>

                       {drawingType && (
                           <div style={{
                               background: 'linear-gradient(135deg, rgba(199, 125, 255, 0.2), rgba(248, 187, 208, 0.2))',
                               border: '1px solid rgba(199, 125, 255, 0.5)',
                               borderRadius: '12px',
                               padding: '12px',
                               marginBottom: '15px',
                               fontSize: '0.9rem',
                               color: '#f8bbd0',
                               textAlign: 'center'
                           }}>
                               🖊️ Çizim: <strong>Tip {activeMenu === 'Polygon' ? 'A' : selectedType} {drawingType === 'LineString' ? 'Çizgi' : drawingType === 'Point' ? 'Nokta' : 'Alan'}</strong>
                               {drawingType === 'LineString' && (
                                   <><br /><small style={{ opacity: 0.8 }}>💡 En az 2 nokta ekleyin, Enter tuşu ile bitirin</small></>
                               )}
                               <><br /><small style={{ opacity: 0.8, color: selectedType === 'B' ? '#ff1493' : selectedType === 'C' ? '#ffff00' : '#c77dff' }}>
                                   {selectedType === 'B' ? '💖 Neon pembe A tipi noktalara çekim aktif!' :
                                    selectedType === 'C' ? '⚡ Neon sarı B tipi noktalara çekim aktif!' :
                                    '🎯 Tüm snap noktalara çekim aktif!'}
                               </small></>
                               <br />
                               <small style={{ opacity: 0.8 }}>
                                   {activeMenu === 'Polygon' ? '🌸 Poligonlar her zaman A tipi' :
                                    selectedType === 'A' ? '💎 A tipi - tüm noktalara snap' :
                                    selectedType === 'B' ? '💖 B tipi - A tipi noktalara snap' :
                                    '⚡ C tipi - B tipi noktalara snap'}
                               </small>
                               <button 
                                   style={{
                                       ...cuteActionStyle('#ff6b9d'),
                                       fontSize: '0.8rem',
                                       padding: '5px 10px',
                                       marginLeft: '10px'
                                   }}
                                   onClick={cancelDrawing}
                               >
                                   ✖️ İptal
                               </button>
                           </div>
                       )}

                       {isModifying && selectedFeature && (
                           <div style={{
                               background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(255, 141, 171, 0.2))',
                               border: '1px solid rgba(255, 107, 157, 0.5)',
                               borderRadius: '12px',
                               padding: '12px',
                               marginBottom: '15px',
                               fontSize: '0.9rem',
                               color: '#ff8fab',
                               textAlign: 'center'
                           }}>
                               🎨 Düzenleniyor: <strong>{selectedFeature.name}</strong>
                               <br />
                               <small style={{ opacity: 0.8 }}>✨ Noktaları sürükleyerek geometriyi değiştirin</small>
                           </div>
                       )}

                       {/* ID ile Bul */}
                       <div style={{
                           background: 'rgba(248, 187, 208, 0.05)',
                           border: '1px solid rgba(248, 187, 208, 0.2)',
                           borderRadius: '12px',
                           padding: '15px'
                       }}>
                           <label style={{
                               display: 'block',
                               color: '#f8bbd0',
                               fontSize: '0.9rem',
                               fontWeight: '500',
                               marginBottom: '8px'
                           }}>
                               🔍 ID ile Bul:
                           </label>
                           <input 
                               type="text" 
                               placeholder="ID girin..." 
                               value={selectedId} 
                               onChange={(e) => setSelectedId(e.target.value)} 
                               style={{
                                   ...cuteInputStyle,
                                   marginBottom: '10px'
                               }}
                           />
                           <div style={{
                               display: 'flex',
                               gap: '8px',
                               width: '100%'
                           }}>
                               <button 
                                   style={{
                                       ...cuteActionStyle('#c77dff'),
                                       flex: 1,
                                       fontSize: '0.8rem',
                                       padding: '8px 6px'
                                   }} 
                                   onClick={() => fetchFeatureById(selectedId, activeMenu)}
                               >
                                   🔍
                               </button>
                               <button 
                                   style={{
                                       ...cuteActionStyle('#ff8fab'),
                                       flex: 1,
                                       fontSize: '0.8rem',
                                       padding: '8px 6px'
                                   }} 
                                   onClick={() => updateFeatureName(selectedId, activeMenu)}
                               >
                                   ✏️
                               </button>
                               <button 
                                   style={{
                                       ...cuteActionStyle('#ff6b9d'),
                                       flex: 1,
                                       fontSize: '0.8rem',
                                       padding: '8px 6px'
                                   }} 
                                   onClick={() => deleteFeature(selectedId, activeMenu)}
                               >
                                   🗑️
                               </button>
                           </div>
                       </div>
                   </div>

                   <div style={{ 
                       flex: 1, 
                       overflowY: 'auto', 
                       padding: showList ? '0' : '20px',
                       display: 'flex',
                       flexDirection: 'column'
                   }}>
                       {showList ? (
                           <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                               <div style={{
                                   position: 'sticky',
                                   top: 0,
                                   background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(15, 15, 35, 0.98) 100%)',
                                   backdropFilter: 'blur(10px)',
                                   padding: '15px 20px',
                                   borderBottom: '1px solid rgba(248, 187, 208, 0.2)',
                                   zIndex: 10
                               }}>
                                   <div style={{
                                       display: 'flex',
                                       justifyContent: 'space-between',
                                       alignItems: 'center'
                                   }}>
                                       <h4 style={{
                                           color: '#f8bbd0',
                                           margin: 0,
                                           fontSize: '1rem',
                                           fontWeight: '600'
                                       }}>
                                           🌟 {activeMenu === 'Point' ? 'Nokta' : activeMenu === 'Line' ? 'Çizgi' : 'Alan'} Listesi ({featureList.length})
                                       </h4>
                                       <button 
                                           style={{
                                               ...cuteActionStyle('#ff6b9d'),
                                               fontSize: '0.8rem',
                                               padding: '5px 10px'
                                           }}
                                           onClick={() => setShowList(false)}
                                       >
                                           ✕ Kapat
                                       </button>
                                   </div>
                                   <div style={{
                                       fontSize: '0.8rem',
                                       color: '#c77dff',
                                       marginTop: '5px'
                                   }}>
                                       Sayfa {currentPage} / {totalPagesFeatureList} (Toplam {featureList.length} öğe)
                                   </div>
                               </div>
                               
                               <div style={{ flex: 1, padding: '10px' }}>
                                   {currentItems.length === 0 ? (
                                       <div style={{ textAlign: 'center', color: '#c77dff', fontSize: '0.95rem', padding: '40px 30px' }}>
                                           <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🌙</div>
                                           <div style={{ marginBottom: '10px', fontSize: '1.05rem', fontWeight: '500' }}>
                                               {activeMenu === 'Point' ? 'Nokta' : activeMenu === 'Line' ? 'Çizgi' : 'Alan'} bulunamadı
                                           </div>
                                           <small style={{ color: '#8b7fa8', fontSize: '0.85rem' }}>
                                               Bu kategoride henüz geometri eklenmemiş
                                           </small>
                                       </div>
                                   ) : (
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                           {currentItems.map((f) => (
                                               <div 
                                                   key={`${f.type}-${f.id}`}
                                                   style={{
                                                       background: 'linear-gradient(135deg, rgba(248, 187, 208, 0.1), rgba(199, 125, 255, 0.1))',
                                                       border: '1px solid rgba(248, 187, 208, 0.3)',
                                                       borderRadius: '12px',
                                                       padding: '12px',
                                                       cursor: 'pointer',
                                                       transition: 'all 0.3s ease'
                                                   }}
                                                   onClick={() => fetchFeatureById(f.id.toString(), f.type)}
                                               >
                                                   <div style={{
                                                       color: '#f8bbd0',
                                                       fontWeight: '600',
                                                       fontSize: '0.9rem',
                                                       marginBottom: '4px'
                                                   }}>
                                                       {f.name || 'İsimsiz'} 
                                                       <span style={{ opacity: 0.7 }}>
                                                           {f.type === 'Point' ? ' 💖' : f.type === 'Line' ? ' 💫' : ' 🌸'}
                                                       </span>
                                                   </div>
                                                   <div style={{
                                                       color: '#c77dff',
                                                       fontSize: '0.8rem',
                                                       opacity: 0.8
                                                   }}>
                                                       ID: {f.id} • {f.type} • Tip: {f.geometryType || 'A'}
                                                       {f.geometryType === 'A' && <span style={{ color: '#ff1493' }}> 💖</span>}
                                                       {f.geometryType === 'B' && <span style={{ color: '#ffff00' }}> ⚡</span>}
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                               </div>

                               {renderPagination()}
                           </div>
                       ) : (
                           <div style={{ 
                               textAlign: 'center', 
                               color: '#c77dff', 
                               fontSize: '0.95rem', 
                               padding: '40px 25px',
                               display: 'flex',
                               flexDirection: 'column',
                               justifyContent: 'center',
                               alignItems: 'center',
                               flex: 1 
                           }}>
                               <div style={{ fontSize: '2.5rem', marginBottom: '20px', opacity: 0.7 }}>🌙</div>
                               <div style={{ 
                                   fontSize: '1rem', 
                                   fontWeight: '500', 
                                   color: '#f8bbd0',
                                   marginBottom: '10px'
                               }}>
                                   Geometri türünü seçin
                               </div>
                               <div style={{ 
                                   fontSize: '0.85rem', 
                                   color: '#8b7fa8',
                                   lineHeight: '1.4'
                               }}>
                                   İşlem yapmak için yukarıdaki butonları kullanın
                               </div>
                           </div>
                       )}
                   </div>
               </div>

               {/* Harita */}
               <div style={{ flex: 1, position: 'relative', background: '#0f0f23' }}>
                   <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                   
                   {showSearchPopup && (
                       <div style={{
                           position: 'absolute',
                           top: '20px',
                           right: '20px',
                           background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                           border: '2px solid #f8bbd0',
                           borderRadius: '12px',
                           boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                           padding: '16px',
                           zIndex: 10000,
                           width: '320px',
                           color: '#f5f5f5',
                           backdropFilter: 'blur(10px)'
                       }}>
                           <h3 style={{ color: '#f8bbd0', marginBottom: '8px' }}>İsme Göre Sonuçlar</h3>
                           {pagedResults.length === 0 ? (
                               <p style={{ color: '#f8bbd0' }}>Sonuç bulunamadı</p>
                           ) : (
                               <ul style={{ listStyle: 'none', padding: 0, maxHeight: '220px', overflowY: 'auto' }}>
                                   {pagedResults.map((item) => (
                                       <li key={item.id} style={{ 
                                           marginBottom: '12px', 
                                           borderBottom: '1px solid #444', 
                                           paddingBottom: '8px',
                                           cursor: 'pointer',
                                           transition: 'all 0.2s ease'
                                       }}
                                       onClick={() => {
                                           fetchFeatureById(item.id.toString(), item.type);
                                           setShowSearchPopup(false);
                                       }}
                                       onMouseOver={(e) => e.target.style.background = 'rgba(248, 187, 208, 0.1)'}
                                       onMouseOut={(e) => e.target.style.background = 'transparent'}
                                       >
                                           <div><strong>Ad:</strong> {item.name}</div>
                                           <div><strong>Tip:</strong> {item.type}</div>
                                           <div style={{ fontSize: '12px', opacity: 0.8 }}><strong>WKT:</strong> {item.wkt.substring(0, 50)}...</div>
                                       </li>
                                   ))}
                               </ul>
                           )}
                           {totalPages > 1 && (
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                                   <button 
                                       disabled={searchPage === 1} 
                                       onClick={() => setSearchPage(searchPage - 1)} 
                                       style={{ 
                                           ...subBtnStyle(), 
                                           padding: '4px 12px',
                                           opacity: searchPage === 1 ? 0.5 : 1
                                       }}
                                   >
                                       ←
                                   </button>
                                   <span style={{ lineHeight: '32px' }}>{searchPage}/{totalPages}</span>
                                   <button 
                                       disabled={searchPage === totalPages} 
                                       onClick={() => setSearchPage(searchPage + 1)} 
                                       style={{ 
                                           ...subBtnStyle(), 
                                           padding: '4px 12px',
                                           opacity: searchPage === totalPages ? 0.5 : 1
                                       }}
                                   >
                                       →
                                   </button>
                               </div>
                           )}
                           <button 
                               style={{ 
                                   marginTop: '12px', 
                                   ...cuteActionStyle('#e53935'),
                                   width: '100%'
                               }} 
                               onClick={() => setShowSearchPopup(false)}
                           >
                               Kapat
                           </button>
                       </div>
                   )}
               </div>
           </div>

           {selectedFeature && !showList && (
               <div style={{
                   position: 'fixed',
                   bottom: '20px',
                   left: '400px', 
                   right: '20px',
                   background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 35, 0.95))',
                   color: '#f8bbd0',
                   borderRadius: '16px',
                   padding: '18px 22px', 
                   backdropFilter: 'blur(20px)',
                   border: '1px solid rgba(248, 187, 208, 0.3)',
                   boxShadow: '0 12px 40px rgba(248, 187, 208, 0.2)',
                   minHeight: '100px', 
               }}>
                   <div style={{
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'flex-start'
                   }}>
                       <div style={{ flex: 1 }}>
                           <h4 style={{
                               margin: '0 0 12px 0',
                               color: '#ff8fab',
                               fontSize: '1.2rem',
                               fontWeight: '600'
                           }}>
                               ✨ Seçilen: {selectedFeature.name}
                           </h4>
                           <div style={{
                               display: 'grid',
                               gridTemplateColumns: '1fr 1fr 1fr',
                               gap: '20px',
                               fontSize: '0.9rem',
                               color: '#c77dff',
                               lineHeight: '1.4'
                           }}>
                               <div><strong style={{ color: '#f8bbd0' }}>ID:</strong> {selectedFeature.id}</div>
                               <div><strong style={{ color: '#f8bbd0' }}>Tür:</strong> {selectedFeature.type === 'Point' ? 'Nokta' : selectedFeature.type === 'Line' ? 'Çizgi' : 'Alan'}</div>
                               <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#f8bbd0' }}>Koordinatlar:</strong> {selectedFeature.coords}</div>
                           </div>
                       </div>
                       <button 
                           style={{
                               background: 'linear-gradient(45deg, #ff6b9d, #c77dff)',
                               border: 'none',
                               color: 'white',
                               borderRadius: '8px',
                               padding: '8px 14px',
                               cursor: 'pointer',
                               fontSize: '0.85rem',
                               fontWeight: '500'
                           }}
                           onClick={() => setSelectedFeature(null)}
                       >
                           ✕ Kapat
                       </button>
                   </div>
               </div>
           )}

           {/* Loading */}
           {loading && (
               <div style={{
                   position: 'fixed',
                   top: 0,
                   left: 0,
                   right: 0,
                   bottom: 0,
                   background: 'rgba(0, 0, 0, 0.8)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   zIndex: 10000
               }}>
                   <div style={{
                       background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 35, 0.95))',
                       borderRadius: '16px',
                       padding: '30px',
                       textAlign: 'center',
                       border: '1px solid rgba(248, 187, 208, 0.3)'
                   }}>
                       <div style={{
                           width: '40px',
                           height: '40px',
                           border: '3px solid rgba(248, 187, 208, 0.3)',
                           borderTop: '3px solid #f8bbd0',
                           borderRadius: '50%',
                           animation: 'spin 1s linear infinite',
                           margin: '0 auto 15px'
                       }}></div>
                       <div style={{
                           color: '#f8bbd0',
                           fontSize: '1.1rem',
                           fontWeight: '500'
                       }}>
                           Yükleniyor... 💖
                       </div>
                   </div>
               </div>
           )}
           
           <MessagePopup message={message} onClose={() => setMessage(null)} />
           
           <style>{`
               @keyframes spin {
                   0% { transform: rotate(0deg); }
                   100% { transform: rotate(360deg); }
               }
           `}</style>
       </div>
   );
}

export default MapComponent;