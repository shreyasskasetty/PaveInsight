function getGeoJSON(coordinates: number[][][]): GeoJSON.Feature{
    // Create a GeoJSON feature from the polygon coordinates
    return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: coordinates,
            },
            properties: []
        } 
}

export { getGeoJSON };