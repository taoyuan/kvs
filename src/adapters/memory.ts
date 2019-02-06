import _ = require('lodash');
import LRU = require("lru-cache");
import minimatch = require('minimatch');
import {AbstractAdapter, Adapter, AdapterFactory} from "../adapter";

export async function initialize(settings?): Promise<AdapterFactory<any>> {
  return new MemoryFactory();
}

class MemoryFactory implements AdapterFactory<any> {
  readonly name = 'memory';

  async close(): Promise<void> {
  }

  create(options?: { [p: string]: any }): Adapter<any> {
    return new Memory(options);
  }

}

class Memory extends AbstractAdapter<any> {

  protected _cache: LRU.Cache<string, any>;
  constructor(options) {
    super('memory');
    options = options || {};
    this._cache = new LRU({
      max: options.max || 500,
      maxAge: options.ttl ? options.ttl * 1000 : undefined
    });
  }

  async has(key: string): Promise<number> {
    return this._cache.has(key) ? 1 : 0;
  };

  async get(key: string): Promise<any> {
    return this._cache.get(key);
  };

  async set(key: string, value: any): Promise<void> {
    this._cache.set(key, value);
  };

  async getset(key: string, value: any): Promise<any> {
    const result = this._cache.get(key);
    this._cache.set(key, value);
    return result;
  };

  async getdel(key: string): Promise<any> {
    const result = this._cache.get(key);
    this._cache.del(key);
    return result;
  };

  async del(key: string): Promise<number> {
    this._cache.del(key);
    return 1;
  };

  async keys(pattern?: string): Promise<string[]> {
    const patternToUse = pattern || '*';
    const keys = this._cache.keys();
    if (patternToUse === '*') {
      return keys;
    }
    let answer: string[] = [];
    for (const key of keys) {
      if (minimatch(key, patternToUse)) {
        answer.push(key);
      }
    }
    return answer;
  };

  async clear(pattern?: string): Promise<number> {
    const patternToUse = pattern || '*';
    if (patternToUse === '*') {
      const count = this._cache.itemCount;
      this._cache.reset();
      return count;
    }

    const keys = await this.keys();
    if (_.isEmpty(keys)) {
      return 0;
    }

    let count = 0;
    for (const key of keys) {
      count += await this.del(key);
    }
    return count;
  };

  async close(): Promise<void> {
    this._cache.reset();
  }
}
