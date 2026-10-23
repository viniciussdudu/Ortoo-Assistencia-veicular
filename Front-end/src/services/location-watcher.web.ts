import type { Coordinates, LocationWatcher } from "./location-watcher";

// No SDK 54, a limpeza do watcher Expo na web chama removeSubscription,
// ausente no emissor web. Use o ID real retornado pelo próprio navegador.
export async function watchLocation(
  onPosition: (coordinates: Coordinates) => void,
  onError: (message: string) => void,
): Promise<LocationWatcher> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocalização indisponível. Use HTTPS ou localhost e um navegador compatível.");
  }

  const geolocation = navigator.geolocation;
  let removed = false;
  const watchId = geolocation.watchPosition(
    ({ coords }) => {
      if (!removed) onPosition({ latitude: coords.latitude, longitude: coords.longitude });
    },
    (error) => {
      if (!removed) onError(error.code === 1 ? "Permissão de localização negada." : error.message);
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
  );

  return {
    remove() {
      if (removed) return;
      removed = true;
      geolocation.clearWatch(watchId);
    },
  };
}
