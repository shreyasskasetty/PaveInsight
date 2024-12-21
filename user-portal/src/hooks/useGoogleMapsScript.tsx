import { useEffect, useState } from 'react';

const useGoogleMapsScript = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof google !== 'undefined') {
            setIsLoaded(true);
            return; // Google Maps is already loaded
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry,drawing`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => {
            console.error('Failed to load Google Maps API');
            setIsLoaded(false);
        };
        document.head.appendChild(script);
    }, []);

    return isLoaded;
};

export default useGoogleMapsScript;
