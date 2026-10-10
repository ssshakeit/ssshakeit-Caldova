export interface CurrentWeather {
  temperatureCelsius: number;
  isDay: boolean;
  description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorms';
  return 'Current conditions';
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new RangeError('Weather coordinates are invalid.');
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code,is_day',
    temperature_unit: 'celsius',
    timezone: 'auto',
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !isRecord(payload.current)) {
    throw new Error('Weather response did not contain current conditions.');
  }

  const { temperature_2m: temperature, weather_code: code, is_day: isDay } =
    payload.current;
  if (
    typeof temperature !== 'number' ||
    !Number.isFinite(temperature) ||
    typeof code !== 'number' ||
    !Number.isInteger(code) ||
    typeof isDay !== 'number' ||
    (isDay !== 0 && isDay !== 1)
  ) {
    throw new Error('Weather response contained invalid current conditions.');
  }

  return {
    temperatureCelsius: temperature,
    isDay: isDay === 1,
    description: getWeatherDescription(code),
  };
}
