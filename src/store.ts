import {EventEmitter} from 'events';
import {AdapterOptions} from './options';
import {Adapter, AdapterCtor, isAdapterCtor} from './types';
import {Bucket, BucketOptions} from './bucket';
import {createAdapter} from './adapters';

export type StoreOptions = AdapterOptions & {
  buckets?: Record<string, BucketOptions>;
};

export class Store extends EventEmitter {
  name: string;
  adapter: Adapter;
  protected options: StoreOptions;
  protected defaultNamespace = 'bucket';
  protected defaultBucketOptions: BucketOptions = {ttl: 0};
  protected buckets: Record<string, Bucket> = {};

  static create(
    nameOrAdapter: string | Adapter | AdapterCtor,
    options?: StoreOptions,
  ): Store {
    return new Store(nameOrAdapter, options);
  }

  constructor(
    nameOrAdapter: string | Adapter | AdapterCtor,
    options: StoreOptions = {},
  ) {
    super();

    if (typeof nameOrAdapter === 'string') {
      this.adapter = createAdapter(nameOrAdapter, options);
    } else if (isAdapterCtor(nameOrAdapter)) {
      this.adapter = nameOrAdapter.create(options);
    } else {
      this.adapter = nameOrAdapter;
    }

    this.name = this.adapter.name;
    this.options = options;
  }

  bucketOptions(namespace: string) {
    return {...this.defaultBucketOptions, ...(this.options.buckets ?? {})};
  }

  async createBucket(options: BucketOptions): Promise<Bucket>;
  async createBucket(
    namespace: string,
    options?: BucketOptions,
  ): Promise<Bucket>;
  async createBucket(
    namespace: string | BucketOptions,
    options?: BucketOptions,
  ): Promise<Bucket> {
    if (typeof namespace !== 'string') {
      options = namespace;
      namespace = '';
    }
    namespace = namespace ?? this.defaultNamespace;
    options = options ?? this.bucketOptions(namespace);

    return new Bucket(namespace, this.adapter, options);
  }

  async bucket(namespace?: string): Promise<Bucket> {
    namespace = namespace ?? this.defaultNamespace;
    if (!this.buckets[namespace]) {
      this.buckets[namespace] = await this.createBucket(namespace);
    }
    return this.buckets[namespace];
  }

  /**
   * Close store connection
   */
  async close() {
    await this.adapter.close();
  }
}
