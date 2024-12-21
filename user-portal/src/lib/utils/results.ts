import { ResultData, GeoJsonFeature } from '../../types/resultData';

export const extractResultData = (geoJson: any): ResultData => {
    console.log(geoJson)
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
        throw new Error('Invalid GeoJSON data');
    }

    const features: GeoJsonFeature[] = geoJson.features.map((feature: any) => {
        const coordinates = feature.geometry.coordinates;
        const { StreetName, PCI, Surface } = feature.properties;
        // Assign color based on PCI ranges
        let color = 'blue';
        if (PCI < 40) color = 'red';
        else if (PCI < 55) color = 'orange';
        else if (PCI < 70) color = 'yellow';
        else if (PCI < 85) color = 'lightgreen';
        else color = 'darkgreen';

        return {
            geometry: { coordinates },
            properties: {
                StreetName: StreetName.split('_')[0],
                PCI,
                Surface : Number(Surface) === 0 ? 'Concrete' : (Number(Surface) === 1 ? 'Asphalt':'N/A'),
                color,
            },
        };
    });

    // Calculate statistics
    const pciValues = features.map((f) => f.properties.PCI);
    const totalPCI = pciValues.reduce((sum, pci) => sum + pci, 0);
    const averagePCI = totalPCI / pciValues.length;

    // Categorize PCI
    const distribution = {
        '0-40': 0,
        '40-55': 0,
        '55-70': 0,
        '70-85': 0,
        '85-100': 0,
    };

    pciValues.forEach((pci) => {
        if (pci < 40) distribution['0-40']++;
        else if (pci < 55) distribution['40-55']++;
        else if (pci < 70) distribution['55-70']++;
        else if (pci < 85) distribution['70-85']++;
        else distribution['85-100']++;
    });

    const distributionLabels = Object.keys(distribution);
    const distributionValues = Object.values(distribution);

    // Prepare summary data
    const summary = features.map((feature) => ({
        streetName: feature.properties.StreetName,
        pci: feature.properties.PCI,
        surface: feature.properties.Surface,
    }));

    // Define the map center (use the first feature as the center point)
    const centerCoordinates = features[0].geometry.coordinates[0];
    const center = { lat: centerCoordinates[1], lng: centerCoordinates[0] };

    return {
        mapData: {
            center,
            features,
        },
        statistics: {
            average: parseFloat(averagePCI.toFixed(2)),
            distribution: {
                labels: distributionLabels,
                values: distributionValues,
            },
        },
        summary,
    };
};
