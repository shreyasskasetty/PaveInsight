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


export interface ResultData {
    mapData: {
        center: { lat: number; lng: number };
        features: GeoJsonFeature[];
    };
    statistics: {
        average: number;
        distribution: {
            labels: string[];
            counts: number[];
            percentages: number[];
        };
    };
    summary: {
        streetName: string;
        pci: number;
        surface?: string;
    }[];
}
