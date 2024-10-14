"use client";
import React, { useState } from 'react';
import { MapComponent } from "@/app/ui/map/map";
import { MapProvider } from "@/providers/map-provider";
import Header from "@/app/ui/map/header";
import { SessionProvider } from 'next-auth/react';
type FormOptions = {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
};

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [tool, setTool] = useState< google.maps.drawing.OverlayType | null>(null);
  const [modalOpen, openFormModal] = useState<Boolean>(false);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
  };

  const handleToggleDrawing = (state : boolean) => {
    setDrawingEnabled(state);
  };

  const setDrawingTool = (toolType: google.maps.drawing.OverlayType | null) => {
    setTool(toolType);
  };

  const setFormalModalOpen = () => {
    openFormModal(true);
  };
  return (
      
        <main>
          
          <MapProvider>
          <SessionProvider>
          <Header onPlaceSelected={handlePlaceSelected} onToggleDrawing={handleToggleDrawing} setDrawingTool={setDrawingTool}/>
          <MapComponent selectedPlace={selectedPlace} drawingEnabled={drawingEnabled} tool = {tool}/>
          </SessionProvider>
          </MapProvider>
         
        </main>
      
  );
}
