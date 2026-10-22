import type { SeerrRequest } from '../client';
import { changeServerJob, flushCache } from './admin';

describe('admin endpoint paths', () => {
  it('rejects unsafe server-controlled identifiers before making a request', async () => {
    const request = jest.fn();
    await expect(changeServerJob(request as SeerrRequest, '../secret', 'run')).rejects.toThrow();
    await expect(flushCache(request as SeerrRequest, 'cache/name')).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
