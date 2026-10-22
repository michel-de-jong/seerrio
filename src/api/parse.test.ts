import { parseCollection, parsePerson, parseSeason } from './parse';

describe('rich media parsers', () => {
  it('parses a TV season and ignores malformed episodes', () => {
    expect(
      parseSeason({
        id: 10,
        name: 'Season 1',
        seasonNumber: 1,
        posterPath: '/season.jpg',
        episodes: [
          { id: 11, name: 'Pilot', episodeNumber: 1, stillPath: '/pilot.jpg' },
          { id: 'bad', name: 'Invalid', episodeNumber: 2 },
        ],
      }),
    ).toEqual({
      id: 10,
      name: 'Season 1',
      seasonNumber: 1,
      posterPath: '/season.jpg',
      episodes: [{ id: 11, name: 'Pilot', episodeNumber: 1, stillPath: '/pilot.jpg' }],
    });
  });

  it('combines person details with movie and TV credits', () => {
    const person = parsePerson(
      { id: 20, name: 'Example Person', profilePath: '/person.jpg' },
      {
        cast: [
          { id: 1, mediaType: 'movie', title: 'Movie', posterPath: null, backdropPath: null },
          { id: 2, mediaType: 'person', name: 'Ignored' },
        ],
        crew: [{ id: 3, mediaType: 'tv', name: 'Series', posterPath: null, backdropPath: null }],
      },
    );

    expect(person?.credits.map(({ id, mediaType }) => ({ id, mediaType }))).toEqual([
      { id: 1, mediaType: 'movie' },
      { id: 3, mediaType: 'tv' },
    ]);
  });

  it('parses collection titles', () => {
    const collection = parseCollection({
      id: 30,
      name: 'Example Collection',
      posterPath: null,
      backdropPath: '/collection.jpg',
      parts: [{ id: 31, mediaType: 'movie', title: 'Part One', posterPath: null, backdropPath: null }],
    });

    expect(collection?.name).toBe('Example Collection');
    expect(collection?.parts).toHaveLength(1);
  });
});
