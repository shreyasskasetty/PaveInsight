import React, { createContext, useContext, useState } from "react";

// Define the shape of the shared state
interface MapControlContextType {
  selectedPlace: google.maps.places.PlaceResult | null;
  setSelectedPlace: (place: google.maps.places.PlaceResult | null) => void;
  drawingEnabled: boolean;
  setDrawingEnabled: (enabled: boolean) => void;
  tool: google.maps.drawing.OverlayType | null;
  setTool: (tool: google.maps.drawing.OverlayType | null) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  onToggleDrawing: (tool: boolean) => void;
  setDrawingTool: (tool: google.maps.drawing.OverlayType | null) => void;
}


const MapControlContext = createContext<MapControlContextType | undefined>(undefined);


export const MapControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [tool, setTool] = useState<google.maps.drawing.OverlayType | null>(null);
  
  const onPlaceSelected = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
  };
  const onToggleDrawing = (state: boolean) => {
    setDrawingEnabled(state);
  };

  const setDrawingTool = (toolType: google.maps.drawing.OverlayType | null) => {
    setTool(toolType);
  };

 return (
    <MapControlContext.Provider
      value={{
        selectedPlace,
        onPlaceSelected,
        drawingEnabled,
        onToggleDrawing,
        tool,
        setDrawingTool,
      }}
    >
      {children}
    </MapControlContext.Provider>
  );
};

export const useMapControlContext = (): MapControlContextType => {
    const context = useContext(MapControlContext);
    if (!context) {
      throw new Error("useMapControlContext must be used within a MapControlProvider");
    }
    return context;
};