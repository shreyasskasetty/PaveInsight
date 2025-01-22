import { useEffect, useState, useRef } from 'react';
import { ResultData } from '../../../types/resultData';
import useGoogleMapsScript from '@/hooks/useGoogleMapsScript';
import { Checkbox } from "@/components/ui/checkbox";

interface MapTabProps {
    data: ResultData['mapData'];
    imageUrl?: string;
    imageBounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}

const MapTab: React.FC<MapTabProps> = ({ data, imageUrl, imageBounds }) => {
    const isMapLoaded = useGoogleMapsScript();
    const [isOverlayVisible, setIsOverlayVisible] = useState(true);
    const [isPolylinesVisible, setIsPolylinesVisible] = useState(true);
    const overlayRef = useRef<google.maps.GroundOverlay | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const polylinesRef = useRef<google.maps.Polyline[]>([]);

    useEffect(() => {
        if (isMapLoaded && typeof google !== 'undefined') {
            const bounds = new google.maps.LatLngBounds();

            data.features.forEach((feature) => {
                feature.geometry.coordinates.forEach(([lng, lat]) => {
                    bounds.extend(new google.maps.LatLng(lat, lng));
                });
            });

            const center = bounds.getCenter();
            const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
                center: center,
                zoom: 17,
            });
            mapRef.current = map;

            // Create image overlay
            if (imageUrl && imageBounds) {
                const overlayBounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(imageBounds.south, imageBounds.west),
                    new google.maps.LatLng(imageBounds.north, imageBounds.east)
                );

                const imageOverlay = new google.maps.GroundOverlay(
                    imageUrl,
                    overlayBounds,
                    { clickable: false }
                );

                overlayRef.current = imageOverlay;
                if (isOverlayVisible) {
                    imageOverlay.setMap(map);
                }
            }

            // Create polylines
            const polylines = data.features.map((feature) => {
                const polyline = new google.maps.Polyline({
                    path: feature.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
                    strokeColor: feature.properties.color || 'blue',
                    strokeWeight: 4,
                    map: isPolylinesVisible ? map : null,
                });

                polyline.addListener('click', (event) => {
                    const streetName = feature.properties.StreetName
                        .split('_')[0]
                        .toLowerCase()
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    const pci = feature.properties.PCI.toFixed(2);
                    const surface = feature.properties.Surface;

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div class="custom-info-window">
                                <strong>Street Name:</strong> ${streetName}<br>
                                <strong>PCI:</strong> ${pci}<br>
                                <strong>Surface:</strong> ${surface}
                            </div>
                        `,
                        position: event.latLng,
                    });

                    infoWindow.open(map);
                });

                return polyline;
            });

            polylinesRef.current = polylines;

            // Add the legend
            const legend = document.getElementById('legend') as HTMLElement;
            if (legend) {
                map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
            }
        }
    }, [isMapLoaded, data, imageUrl, imageBounds]);

    // Handle overlay visibility changes
    useEffect(() => {
        if (overlayRef.current && mapRef.current) {
            overlayRef.current.setMap(isOverlayVisible ? mapRef.current : null);
        }
    }, [isOverlayVisible]);

    // Handle polylines visibility changes
    useEffect(() => {
        if (polylinesRef.current && mapRef.current) {
            polylinesRef.current.forEach(polyline => {
                polyline.setMap(isPolylinesVisible ? mapRef.current : null);
            });
        }
    }, [isPolylinesVisible]);

    return (
        <div style={{ position: 'relative' }}>
            <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-md space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="overlay-toggle"
                        checked={isOverlayVisible}
                        onCheckedChange={(checked) => setIsOverlayVisible(checked as boolean)}
                    />
                    <label 
                        htmlFor="overlay-toggle"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Super Resolution Image
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="polylines-toggle"
                        checked={isPolylinesVisible}
                        onCheckedChange={(checked) => setIsPolylinesVisible(checked as boolean)}
                    />
                    <label 
                        htmlFor="polylines-toggle"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        PCI Polyline
                    </label>
                </div>
            </div>
            <div id="map" style={{ height: '500px', width: '100%' }} />
            <div
                id="legend"
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    zIndex: 1000,
                    background: 'white',
                    padding: '10px',
                    border: '1px solid grey',
                    borderRadius: '8px',
                    fontSize: '0.875em',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
                }}
            >
                <div><strong>PCI</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '10px', background: 'red', marginRight: '10px' }}></div>
                    0 - 40
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '10px', background: 'orange', marginRight: '10px' }}></div>
                    40 - 55
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '10px', background: 'yellow', marginRight: '10px' }}></div>
                    55 - 70
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '10px', background: 'lightgreen', marginRight: '10px' }}></div>
                    70 - 85
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ width: '20px', height: '10px', background: 'darkgreen', marginRight: '10px' }}></div>
                    85 - 100
                </div>
            </div>
        </div>
    );
};

export default MapTab;