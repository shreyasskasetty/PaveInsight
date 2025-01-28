import React, { createContext, useContext, useState } from "react";

// Define the context type
interface RefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

// Create the context
const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

// Provider component
export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to trigger re-render
  };

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

// Custom hook to use the context
export const useRefreshContext = (): RefreshContextType => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefreshContext must be used within a RefreshProvider");
  }
  return context;
};
