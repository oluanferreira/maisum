export async function fetchCoordinates(params: {
  address: string;
  city?: string;
  state?: string;
}) {
  const { address, city, state } = params;
  
  // Nivel 1: Endereco completo
  try {
    const q = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      { headers: { 'User-Agent': 'Maisum-Admin' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error('Geocoding Level 1 error:', e);
  }

  // Nivel 2: Apenas cidade (Centro da Cidade) como fallback de seguranca
  if (city) {
    try {
      const q = `${city}${state ? `, ${state}` : ''}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'User-Agent': 'Maisum-Admin' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error('Geocoding Level 2 error:', e);
    }
  }

  return null;
}
