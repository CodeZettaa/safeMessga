import { afterEach } from 'vitest';
import { resetMemoryStores } from '@/lib/anti-abuse/memory-store';

afterEach(() => {
  resetMemoryStores();
});
