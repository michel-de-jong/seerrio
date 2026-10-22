import type { SeerrRequest } from '../client';
import { discoverCategory, discoverPath } from './discover';

describe('discover endpoints', () => {
  it('maps every primary feed', () => {
    expect(discoverPath('trending')).toBe('/discover/trending');
    expect(discoverPath('movies')).toBe('/discover/movies');
    expect(discoverPath('tv')).toBe('/discover/tv');
    expect(discoverPath('upcomingMovies')).toBe('/discover/movies/upcoming');
    expect(discoverPath('upcomingTv')).toBe('/discover/tv/upcoming');
  });

  it('loads valid category paths', async () => {
    const request = jest.fn().mockResolvedValue({ page: 1, totalPages: 1, results: [] });
    await discoverCategory(request as SeerrRequest, 'tv', 'network', '49', 2);
    expect(request).toHaveBeenCalledWith('/discover/tv/network/49', {
      query: { page: 2 },
      signal: undefined,
    });
  });

  it('rejects invalid and incompatible path values before sending a request', async () => {
    const request = jest.fn();
    await expect(discoverCategory(request as SeerrRequest, 'movie', 'language', '../admin', 1)).rejects.toThrow();
    await expect(discoverCategory(request as SeerrRequest, 'tv', 'studio', '2', 1)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
