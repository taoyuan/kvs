import {Adapter} from './types';

export type Loader = (query?: string) => any;

export interface BucketOptions {
  ttl?: number;
  stale?: boolean;
  delimiter?: string;
  load?: Loader;
}

export class Bucket {
  namespace: string;
  adapter: Adapter;
  protected ttl: number;
  protected load?: Loader;
  protected allowStale: boolean;
  protected delimiter: string;

  constructor(
    namespace: string,
    adapter: Adapter,
    options: BucketOptions = {},
  ) {
    this.namespace = namespace;
    this.adapter = adapter;

    this.ttl = options.ttl ?? 0;
    this.load = options.load;
    this.allowStale = !!options.stale;
    this.delimiter = options.delimiter || ':';
  }

  fullkey(key: string): string {
    if (!this.namespace) return key;
    return this.namespace + this.delimiter + key;
  }

  async has(key: string) {
    return this.adapter.has(this.fullkey(key));
  }

  async exists(key: string) {
    return this.adapter.has(this.fullkey(key));
  }

  async get(key: string, query?: any): Promise<any> {
    const fullkey = this.fullkey(key);
    let value = await this.adapter.get(fullkey);

    if (!this.load) {
      return value;
    }

    const exists = await this.adapter.has(fullkey);
    if (value != null && (exists || this.allowStale)) {
      return value;
    }

    value = await this.load(query);

    if (value === undefined) {
      return value;
    }

    await this.adapter.set(fullkey, value);
    return value;
  }

  async set(key: string, value: any, maxAge?: number): Promise<void> {
    return this.adapter.set(this.fullkey(key), value, maxAge ?? this.ttl);
  }

  async getset(key: string, value: any): Promise<any> {
    return this.adapter.getset(this.fullkey(key), value);
  }

  async getdel(key: string): Promise<any> {
    return this.adapter.getdel(this.fullkey(key));
  }

  async del(key: string): Promise<number> {
    return this.adapter.del(this.fullkey(key));
  }

  async keys(pattern?: string): Promise<string[]> {
    const patternToUse = pattern || '*';
    const len = this.namespace.length + 1;
    const keys = await this.adapter.keys(this.namespace + ':' + patternToUse);
    if (!keys) {
      return [];
    }
    for (let i = 0, l = keys.length; i < l; i++) {
      keys[i] = keys[i].substr(len);
    }
    return keys;
  }

  async clear(pattern?: string): Promise<number> {
    const patternToUse = pattern || '*';
    return this.adapter.clear(this.namespace + ':' + patternToUse);
  }
}
