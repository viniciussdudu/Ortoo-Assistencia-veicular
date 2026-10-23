import * as Location from "expo-location";

export type Coordinates = { latitude: number; longitude: number };
export type LocationWatcher = { remove(): void };

export async function watchLocation(
  onPosition: (coordinates: Coordinates) => void,
  onError: (message: string) => void,
): Promise<LocationWatcher> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Permissão de localização negada.");

  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
    ({ coords }) => onPosition({ latitude: coords.latitude, longitude: coords.longitude }),
    onError,
  );
}
