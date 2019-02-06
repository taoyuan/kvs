import PromiseA = require('bluebird');
import {Adapter} from "./adapter";

export interface Loader {
  (query?: string): Promise<any>;
  (query?: string, cb?: (err, data) => void);
}

export interface BucketOptions {
  load?: Loader;
  stale?: boolean;
  delimiter?: string;
  [name: string]: any;
}

export class Bucket {
  namespace: string;
  adapter: Adapter<any>;
  protected _load?: Loader;
  protected _allowStale: boolean;
  protected _delimiter: string;

  constructor(namespace: string, adapter, options?: BucketOptions) {
    this.namespace = namespace;
    this.adapter = adapter;

    options = options || {};
    this._load = options.load;
    this._allowStale = !!options.stale;
    this._delimiter = options.delimiter || ':';
  }


  fullkey(key: string): string {
    if (!this.namespace) return key;
    return this.namespace + this._delimiter + key;
  };

  async has(key: string) {
    return this.adapter.has(this.fullkey(key));
  }

  async exists(key: string) {
    return this.adapter.has(this.fullkey(key));
  };

  async get(key: string, query?: any): Promise<any> {
    const fullkey = this.fullkey(key);
    let value = await this.adapter.get(fullkey);

    if (!this._load) {
      return value;
    }

    const exists = await this.adapter.has(fullkey);
    if (value != null && (exists || this._allowStale)) {
      return value;
    }

    if (this._load.length <= 1) {
      value = await this._load(query);
    } else {
      // @ts-ignore
      value = await PromiseA.fromCallback(cb => this._load(query, cb));
    }

    if (value === undefined) {
      return value;
    }

    await this.adapter.set(fullkey, value);
    return value;
  };

  async set(key: string, value: any): Promise<void> {
    return this.adapter.set(this.fullkey(key), value);
  };

  async getset(key: string, value: any): Promise<any> {
    return this.adapter.getset(this.fullkey(key), value);
  };

  async getdel(key: string): Promise<any> {
    return this.adapter.getdel(this.fullkey(key));
  };

  async del(key: string): Promise<number> {
    return this.adapter.del(this.fullkey(key));
  };

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
  };

  async clear(pattern?: string): Promise<number> {
    const patternToUse = pattern || '*';
    return this.adapter.clear(this.namespace + ':' + patternToUse);
  };

}

