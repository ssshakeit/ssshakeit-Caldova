import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentWeather } from './weather';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCurrentWeather', () => {
  it('requests and normalizes current conditions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 18.4, weather_code: 2, is_day: 1 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentWeather(47.6, -122.3)).resolves.toEqual({
      temperatureCelsius: 18.4,
      isDay: true,
      description: 'Partly cloudy',
    });

    const [request] = fetchMock.mock.calls[0] as [URL];
    const url = new URL(request.toString());
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('47.6');
    expect(url.searchParams.get('longitude')).toBe('-122.3');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
  });

  it('rejects invalid coordinates without making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentWeather(91, 0)).rejects.toThrow(
      'Weather coordinates are invalid.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports unsuccessful weather requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    await expect(getCurrentWeather(47.6, -122.3)).rejects.toThrow(
      'Weather request failed with status 503.',
    );
  });

  it('rejects malformed current conditions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ current: { temperature_2m: 'warm' } })),
      ),
    );

    await expect(getCurrentWeather(47.6, -122.3)).rejects.toThrow(
      'Weather response contained invalid current conditions.',
    );
  });
});
