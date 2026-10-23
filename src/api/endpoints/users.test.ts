import type { SeerrRequest } from '../client';
import { createUser } from './users';

describe('createUser', () => {
  it('accepts the filtered user Seerr returns after creating an account', async () => {
    const request = jest.fn().mockResolvedValue({ id: 7, permissions: 32, userType: 2, displayName: 'Guest' });

    const user = await createUser(request as unknown as SeerrRequest, {
      email: 'user@example.test',
      username: 'Guest',
      password: 'correct horse',
    });

    expect(request).toHaveBeenCalledWith('/user', {
      method: 'POST',
      body: { email: 'user@example.test', username: 'Guest', password: 'correct horse' },
    });
    expect(user).toEqual({ id: 7, email: 'user@example.test', permissions: 32, userType: 2, displayName: 'Guest' });
  });
});
