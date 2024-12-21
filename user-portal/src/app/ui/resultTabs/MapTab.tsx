import { useEffect } from 'react';
import { ResultData } from '../../../types/resultData';
import useGoogleMapsScript from '@/hooks/useGoogleMapsScript';

interface MapTabProps {
    data: ResultData['mapData'];
}

const MapTab: React.FC<MapTabProps> = ({ data }) => {
    const isMapLoaded = useGoogleMapsScript(); // Returns true once Google Maps is loaded

    useEffect(() => {
        if (isMapLoaded && typeof google !== 'undefined') {
            // Initialize LatLngBounds
            const bounds = new google.maps.LatLngBounds();

            // Extend the bounds with each coordinate from the GeoJSON features
            data.features.forEach((feature) => {
                feature.geometry.coordinates.forEach(([lng, lat]) => {
                    const latLng = new google.maps.LatLng(lat, lng);
                    bounds.extend(latLng);
                });
            });

            // Get the center of the bounds
            const center = bounds.getCenter();

            // Create the map centered around the calculated bounds center
            const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
                center: center,
                zoom: 20,
            });

            // Add the features (polylines) to the map
            data.features.forEach((feature) => {
                const polyline = new google.maps.Polyline({
                    path: feature.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
                    strokeColor: feature.properties.color || 'blue',
                    strokeWeight: 4,
                    map,
                });

                // Add click event listener to each polyline
                polyline.addListener('click', (event) => {
                    const streetName = feature.properties.StreetName
                        .split('_')[0]
                        .toLowerCase()
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    const pci = feature.properties.PCI.toFixed(2);
                    const surface = feature.properties.Surface;

                    // Create an info window with feature details
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

                    // Open the info window
                    infoWindow.open(map);
                });
            });

            // Add the legend
            const legend = document.getElementById('legend') as HTMLElement;
            if (legend) {
                map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
            }
        }
    }, [isMapLoaded, data]);

    return (
        <div style={{ position: 'relative' }}>
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