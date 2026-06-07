/**
 * Lógica de balance FB can be queried via proxy endpoints or client-side.
 * We prioritize proxying via Server-Side /api/wallet/fb-balance to keep the API keys secure.
 */

export async function getFBBalance(address: string): Promise<number> {
  if (!address) return 0;
  try {
    const res = await fetch(`/api/wallet/fb-balance/${address}`);
    if (!res.ok) {
      throw new Error(`Error al obtener balance de FB: ${res.statusText}`);
    }
    const data = await res.json();
    if (data && typeof data.balance === "number") {
      return data.balance;
    }
    return 0;
  } catch (error) {
    console.error("Error in getFBBalance client helper:", error);
    // Fallback/Simulado
    return 5.0; 
  }
}
