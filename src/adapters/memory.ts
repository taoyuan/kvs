import LRUCache from 'lru-cache';
import minimatch from 'minimatch';
import isEmpty from '@tib/utils/is/empty';
import {Adapter} from '../types';

export interface MemoryOptions {
  max?: number;
  ttl?: number;
}

export default class Memory implements Adapter {
  readonly name = 'memory';

  protected cache: LRUCache<string, any>;

  static create(options: MemoryOptions = {}) {
    return new Memory(options);
  }

  constructor(options: MemoryOptions = {}) {
    options = options ?? {};
    this.cache = new LRUCache({
      max: options.max ?? 500,
      maxAge: options.ttl ? options.ttl * 1000 : undefined,
    });
  }

  async has(key: string): Promise<number> {
    return this.cache.has(key) ? 1 : 0;
  }

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, maxAge?: number): Promise<void> {
    this.cache.set(
      key,
      value,
      typeof maxAge === 'number' ? maxAge * 1000 : undefined,
    );
  }

  async getset(key: string, value: any): Promise<any> {
    const result = this.cache.get(key);
    this.cache.set(key, value);
    return result;
  }

  async getdel(key: string): Promise<any> {
    const result = this.cache.get(key);
    this.cache.del(key);
    return result;
  }

  async del(key: string): Promise<number> {
    this.cache.del(key);
    return 1;
  }

  async keys(pattern?: string): Promise<string[]> {
    const patternToUse = pattern ?? '*';
    const keys = this.cache.keys();
    if (patternToUse === '*') {
      return keys;
    }
    const answer: string[] = [];
    for (const key of keys) {
      if (minimatch(key, patternToUse)) {
        answer.push(key);
      }
    }
    return answer;
  }

  async clear(pattern?: string): Promise<number> {
    const patternToUse = pattern ?? '*';
    if (patternToUse === '*') {
      const count = this.cache.itemCount;
      this.cache.reset();
      return count;
    }

    const keys = await this.keys();
    if (isEmpty(keys)) {
      return 0;
    }

    let count = 0;
    for (const key of keys) {
      count += await this.del(key);
    }
    return count;
  }

  async close(): Promise<void> {
    this.cache.reset();
  }
}
