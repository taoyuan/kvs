import {EventEmitter} from 'events';
import {AdapterOptions} from './options';
import {Adapter, AdapterCtor, isAdapter, isConstructor} from './types';
import {Bucket, BucketOptions} from './bucket';
import {createAdapter} from './adapters';

export type StoreOptions = AdapterOptions & {
  name?: string;
  adapter?: Adapter | AdapterCtor;
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
    nameOrOptions: string | StoreOptions | Adapter | AdapterCtor,
    options?: StoreOptions,
  ): Store {
    return new Store(nameOrOptions, options);
  }

  constructor(
    nameOrOptions: string | StoreOptions | Adapter | AdapterCtor | undefined,
    options?: StoreOptions,
  ) {
    super();

    let name: string | undefined;
    let adapter: Adapter | AdapterCtor | undefined;

    if (typeof nameOrOptions === 'string') {
      name = nameOrOptions;
    } else if (isAdapter(nameOrOptions) || isConstructor(nameOrOptions)) {
      adapter = nameOrOptions;
    } else if (typeof nameOrOptions === 'object' && options === undefined) {
      options = nameOrOptions;
    }

    adapter = adapter ?? options?.adapter;
    options = options ?? {};
    name = name ?? options.name;

    if (isAdapter(adapter)) {
      this.adapter = adapter;
    } else if (isConstructor(adapter)) {
      this.adapter = new adapter(options);
    } else if (typeof name === 'string') {
      this.adapter = createAdapter(name, options);
    } else {
      throw new Error('name or adapter is required');
    }

    this.name = name ?? this.adapter.name;
    this.options = options;
  }

  bucketOptions(namespace: string) {
    return {
      ...this.defaultBucketOptions,
      ...(this.options.buckets?.[namespace] ?? {}),
    };
  }

  async createBucket<T = Record<string, any>>(
    options: BucketOptions,
  ): Promise<Bucket<T>>;
  async createBucket<T = Record<string, any>>(
    namespace: string,
    options?: BucketOptions,
  ): Promise<Bucket<T>>;
  async createBucket<T = Record<string, any>>(
    namespace: string | BucketOptions,
    options?: BucketOptions,
  ): Promise<Bucket<T>> {
    if (typeof namespace !== 'string') {
      options = namespace;
      namespace = '';
    }
    namespace = namespace ?? this.defaultNamespace;
    options = options ?? this.bucketOptions(namespace);

    return new Bucket(namespace, this.adapter, options);
  }

  async bucket<T = Record<string, any>>(
    namespace?: string,
  ): Promise<Bucket<T>> {
    namespace = namespace ?? this.defaultNamespace;
    if (!this.buckets[namespace]) {
      this.buckets[namespace] = await this.createBucket(namespace);
    }
    return <Bucket<T>>this.buckets[namespace];
  }

  /**
   * Close store connection
   */
  async close() {
    await this.adapter.close();
  }
}
