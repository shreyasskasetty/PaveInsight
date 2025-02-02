'use client'

import { useState, useRef, useCallback, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Map component Component from library
import { GoogleMap, Marker, InfoWindow, DrawingManager } from '@react-google-maps/api';
import { FormModal } from './form-modal';
import { on } from "events";
import { userFormStore } from "@/store/form-store";
import { submitForm } from "@/lib/api/request-api";
import { getGeoJSON } from "@/lib/utils/map";
import { useMapControlContext } from "./MapControlContext";

//Default map container style
export const defaultMapContainerStyle = {
    width: '100%',
    height: 'Calc(100vh - 50px)',
};

//Default map options
const defaultMapZoom = 3
const defaultMapCenter = {
    lat: 34.495775, 
    lng: -100.867037
}
const defaultMapOptions = {
    zoomControl: true,
    tilt: 0,
    gestureHandling: 'auto',
    mapTypeId: 'roadmap',
    minZoom: 3,
};

const MapComponent: React.FC = () => {
    //State variables
    const mapRef = useRef<google.maps.Map | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLng | null>(null);
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<google.maps.LatLngLiteral | null>(null);

    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const [drawnPath, setDrawnPath] = useState<Array<google.maps.LatLngLiteral> | null>(null);
    const [drawnArea, setDrawnArea] = useState<number | null>(null);
    const [drawnOverlay, setDrawnOverlay] = useState<google.maps.Polygon | google.maps.Circle | google.maps.Rectangle | google.maps.Marker | null>(null);
    const [polygonCoordinates, setPolygonCoordinates] = useState<Array<{ lat: number; lng: number }> | null>(null);

    const {selectedPlace, drawingEnabled, tool } = useMapControlContext();

    const setModalIsOpen = userFormStore((state: any) => state.setOpen);
    const modalIsOpen = userFormStore((state: any) => state.open);
    //On load map callback function to set map options
    const onLoadMap = useCallback((mapInstance: any) => {
        setMap(mapInstance);
        mapRef.current = mapInstance;
        mapInstance.setOptions({
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DEFAULT,
          position: google.maps.ControlPosition.TOP_LEFT, // Change position here
          // You can also specify map types if needed
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        },
        mapTypeId: 'roadmap',
        gestureHandling: 'auto',
        });

        mapInstance.addListener('mousemove', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            setCursorPosition({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            });
          }
        });
    }, []);

    //On unmount map callback function to set map to null
    const onUnmountMap = useCallback(() => {
      setMap(null);
    }, []);
    
    const handlePolygonComplete = (polygon: google.maps.Polygon) => {
      setDrawnOverlay(polygon);
      
      // Get the path of the polygon
      const path = polygon.getPath();
      
      // Extract coordinates from the path
      const coordinates = path.getArray().map(latLng => ({
        lat: latLng.lat(),
        lng: latLng.lng()
      }));
      
      coordinates.push(coordinates[0]); // Close the polygon
      
      console.log('Polygon Coordinates:', coordinates); // Log the coordinates

      // Store the coordinates in the state variable
      setPolygonCoordinates(coordinates);
      
      // Optionally, you can also calculate the area
      const area = google.maps.geometry.spherical.computeArea(path);
      setDrawnArea(area);
      setModalIsOpen(true);
    };

    const handleRectangleComplete = (rectangle: google.maps.Rectangle) => {
      setDrawnOverlay(rectangle);
    
      // Get bounds (southwest and northeast corners)
      const bounds = rectangle.getBounds();
      const sw = bounds?.getSouthWest();
      const ne = bounds?.getNorthEast();
    
      if (sw && ne) {
        // Calculate width and height of the rectangle using the distance between SW and NE corners
        const width = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(sw.lat(), sw.lng()), 
          new google.maps.LatLng(sw.lat(), ne.lng())
        ); // Distance in meters between SW and SE (width)
    
        const height = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(sw.lat(), sw.lng()), 
          new google.maps.LatLng(ne.lat(), sw.lng())
        ); // Distance in meters between SW and NW (height)
    
        const area = width * height; // Area in square meters
    
        console.log('Rectangle bounds:', bounds?.toJSON(), 'Width:', width, 'Height:', height, 'Area:', area);
        
        // Set the coordinates in state
        const rectangleCoordinates = [
          { lat: sw.lat(), lng: sw.lng() }, // Southwest corner
          { lat: sw.lat(), lng: ne.lng() }, // Southeast corner
          { lat: ne.lat(), lng: ne.lng() }, // Northeast corner
          { lat: ne.lat(), lng: sw.lng() }, // Northwest corner
          { lat: sw.lat(), lng: sw.lng() }, // Close the polygon by repeating the Southwest corner
        ];
        setPolygonCoordinates(rectangleCoordinates); // Store the rectangle coordinates
      }
    
      setModalIsOpen(true);
    };

    const handleModalClose = () => {
      setModalIsOpen(false);
      setDrawnOverlay(null);
      drawnOverlay?.setMap(null);
    };

    const handleFormSubmit = async (formData: any) => {
      // Check if polygonCoordinates are present
      if (!polygonCoordinates || polygonCoordinates.length === 0) {
        handleError("Coordinates are required to submit the form."); // Show error message
        return; // Exit the function early
      }

      // Handle form submission
      console.log('Form Data:', formData);
      console.log(polygonCoordinates);
      // Convert polygonCoordinates to the expected format
      const geoJSON = getGeoJSON([polygonCoordinates.map(coord => [coord.lng, coord.lat])]);
      console.log(geoJSON)
      const data: {
        username: string;
        email: string;
        companyName: string | null,
        phoneNumber: string;
        geoJson: string;
        message: string;
      } = {
        username: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        companyName: formData.company,
        geoJson: JSON.stringify(geoJSON),
        message: formData.message
      }
      console.log(data)
      const response = await submitForm(data);
      console.log(response)
      toast.success("Form submitted successfully!");

      // Close the modal
      setModalIsOpen(false);
      // Clear the drawn overlay
      drawnOverlay?.setMap(null);
      setDrawnOverlay(null);
      
      // You might want to handle the KML file upload here
      // and send the form data to your server
    };

    const handleError = (errorMessage: string) => {
      toast.error(errorMessage);
    };

    //set the map center and zoom level on page load
    useEffect(() => {
      console.log('Location:', cursorPosition);
      if (selectedPlace && map) {
        const location = selectedPlace.geometry?.location;
        if (location) {
          if (selectedPlace.geometry?.viewport) {
            map.fitBounds(selectedPlace.geometry.viewport);
          } else {
            map.setCenter(location);
            map.setZoom(0);
          }
  
          setMarkerPosition(location);
          setInfoWindowOpen(true);
        }
      }
    }, [selectedPlace, map]);

    //Event listener to remove drawn polygon on escape key press
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (drawnOverlay) {
            drawnOverlay.setMap(null);
            setDrawnOverlay(null);
            setDrawnPath(null);
            setDrawnArea(null);
          }
    
          // If the DrawingManager is in drawing mode, exit drawing mode
          if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
          }
        }
      };
    
      window.addEventListener('keydown', handleKeyDown);
      // Clean up the event listener on component unmount
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [drawnOverlay]);
    
    return (
        <div className="w-full" style={ {marginTop: '50px' }}>
            <ToastContainer />
            <GoogleMap
              onLoad={onLoadMap}
              onUnmount={onUnmountMap}
              mapContainerStyle={defaultMapContainerStyle}
              center={defaultMapCenter}
              zoom={defaultMapZoom}
              options={defaultMapOptions}>
              {/* InfoWindow */}
              {infoWindowOpen && selectedPlace && markerPosition && (
                <InfoWindow position={markerPosition} onCloseClick={() => setInfoWindowOpen(false)}>
                  <div>
                    <strong>{selectedPlace.name}</strong>
                    <br />
                    <span>{selectedPlace.formatted_address}</span>
                  </div>
                </InfoWindow>
              )}

              {/* Drawing Manager */}
              <DrawingManager
                onLoad={(drawingManager) => {
                  drawingManagerRef.current = drawingManager;
                }}
                onPolygonComplete={handlePolygonComplete}
                onRectangleComplete={handleRectangleComplete}
                options={{
                  drawingControl: false,
                  drawingMode: drawingEnabled ? tool : null,
                }}
              />
            </GoogleMap>
              {/* Form Modal */}
            <FormModal
              open={modalIsOpen}
              onClose={handleModalClose}
              onSubmit={handleFormSubmit}
            />
        </div>
    )
};
export { MapComponent };