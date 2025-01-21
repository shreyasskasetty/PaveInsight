export interface GeoJsonFeature {
    geometry: {
        coordinates: [number, number][];
    };
    properties: {
        StreetName: string;
        PCI: number;
        Surface?: string;
        color?: string;
    };
}

export interface SuperResolutionResultData{
    superResolutionImageURL: string;
    bounds: { north: number; south: number; east: number; west: number }
}
export interface ResultData {
    mapData: {
        center: { lat: number; lng: number };
        features: GeoJsonFeature[];
    };
    statistics: {
        average: number;
        distribution: {
            labels: string[];
            values: number[];
        };
    };
    summary: {
        streetName: string;
        pci: number;
        surface?: string;
    }[];
}
