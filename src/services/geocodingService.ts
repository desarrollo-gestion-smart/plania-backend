export const geocodeAddress = async (address) => {
  if (!address) {
    return { latitude: null, longitude: null };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("[geocodeAddress] GOOGLE_MAPS_API_KEY no configurada. Retornando null.");
    return { latitude: null, longitude: null };
  }

  try {
    const encodedAddress = encodeURIComponent(String(address).trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      console.warn(`[geocodeAddress] No se encontró ubicación para: ${address}`);
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    console.error("[geocodeAddress] Error geocodificando dirección:", error);
    return { latitude: null, longitude: null };
  }
};
