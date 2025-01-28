"use client";
import React, { useState } from 'react';
import { MapComponent } from "@/app/ui/map/map";
import { MapProvider } from "@/providers/map-provider";
import Header from "@/app/ui/map/header";
import { SessionProvider } from 'next-auth/react';
import { MapControlProvider } from './ui/map/MapControlContext';

export default function Home() {
  return (
    <main>
      <MapProvider>
        <SessionProvider>
          <MapControlProvider>
            <Header/>
            <MapComponent />
          </MapControlProvider>
        </SessionProvider>
      </MapProvider>
    </main>
  );
}
