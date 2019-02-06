import { existsSync } from "fs";
import { EventEmitter } from "events";
import PromiseA = require("bluebird");
import { Bucket, BucketOptions } from "./bucket";

import { AdapterFactory, AdapterInitializer } from "./adapter";

export interface StoreOptions {
  [name: string]: any;
}

export class Store extends EventEmitter {
  name: string;
  settings;
  defaultBucketOptions;
  defaultNamespace: string = "bucket";
  buckets;
  factory: AdapterFactory<any>;
  initialized;


  static create(name: string, settings?: StoreOptions): Store;
  static create(settings: StoreOptions): Store;
  static create(initializer: AdapterInitializer): Store;
  static create(name: string | StoreOptions | AdapterInitializer, settings?: StoreOptions): Store {
    return new Store(name, settings);
  }

  static async createAndWait(name: string, settings?: StoreOptions): Promise<Store>;
  static async createAndWait(settings: StoreOptions): Promise<Store>;
  static async createAndWait(initializer: AdapterInitializer): Promise<Store>;
  static async createAndWait(name: string | StoreOptions | AdapterInitializer, settings?: StoreOptions): Promise<Store> {
    const store = new Store(name, settings);
    await store.ready();
    return store;
  }

  constructor(name: string | StoreOptions | AdapterInitializer, settings?: StoreOptions) {
    super();

    if (typeof name !== "string") {
      settings = name;
      name = "";
    }

    this.name = name;
    this.settings = settings;

    this.defaultBucketOptions = {
      ttl: 0
    };
    this.buckets = {};

    // and initialize store using adapter
    // this is only one initialization entry point of adapter
    // this module should define `adapter` member of `this` (store)
    let initializer: AdapterInitializer;
    if (settings && typeof settings.initialize === "function") {
      initializer = <AdapterInitializer>settings;
    } else if (name.match(/^\//)) {
      // try absolute path
      initializer = require(name);
    } else if (hasScript(__dirname + "/adapters/" + name)) {
      // try built-in adapter
      initializer = require("./adapters/" + name);
    } else {
      // try foreign adapter
      try {
        initializer = require("kvs-" + name);
      } catch (e) {
        console.log("\nWARNING: KVS adapter \"" + name + "\" is not installed,\nso your models would not work, to fix run:\n\n    npm install kvs-" + name, "\n");
        process.exit(1);
        return;
      }
    }

    initializer.initialize(settings).then(factory => {
      this.factory = factory;
      this.name = factory.name;

      this.initialized = true;
      this.emit("ready");
    });
  }

  async ready() {
    if (!this.initialized) {
      return PromiseA.fromCallback(cb => this.once("ready", cb));
    }
  }

  bucketOptions(namespace: string) {
    let bucketOptions = {};
    if (this.settings && this.settings.buckets) {
      bucketOptions = this.settings.buckets[namespace] || {};
    }
    return Object.assign({}, this.defaultBucketOptions, bucketOptions);
  };

  async createBucket(options: BucketOptions): Promise<Bucket>;
  async createBucket(namespace: string, options?: BucketOptions): Promise<Bucket>;
  async createBucket(namespace: string | BucketOptions, options?: BucketOptions): Promise<Bucket> {
    await this.ready();

    if (typeof namespace !== "string") {
      options = namespace;
      namespace = "";
    }
    namespace = namespace || this.defaultNamespace;
    options = options || this.bucketOptions(namespace);

    return new Bucket(namespace, this.factory.create(options), options);
  };

  async bucket(namespace?: string): Promise<Bucket> {
    namespace = namespace || this.defaultNamespace;
    if (!this.buckets[namespace]) {
      this.buckets[namespace] = await this.createBucket(namespace);
    }
    return this.buckets[namespace];
  };

  /**
   * Close store connection
   */
  async close() {
    await this.factory.close();
  };

}

function hasScript(path: string) {
  return existsSync(path + ".js") || existsSync(path + ".ts");
}
