/**
 * Geocoding Service — converts address strings to Latitude/Longitude.
 * Uses OpenStreetMap Nominatim (Free, requires User-Agent).
 */
export async function getCoordinates(params: {
  logradouro: string;
  numero?: string;
  cidade: string;
  uf: string;
}): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = params.numero 
      ? `${params.logradouro}, ${params.numero}, ${params.cidade} - ${params.uf}, Brazil`
      : `${params.logradouro}, ${params.cidade} - ${params.uf}, Brazil`;
      
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MaisUm-Restaurant/1.0 (suporte@appmaisum.com.br)",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    
    if (Array.isArray(data) && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("[Geocoding] Error fetching coordinates:", error);
    return null;
  }
}
