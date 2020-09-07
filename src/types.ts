export interface Adapter {
  readonly name: string;

  has(key: string): Promise<number>;

  get(key: string): Promise<any>;

  set(key: string, value: any, maxAge?: number): Promise<void>;

  getset(key: string, value: any): Promise<any>;

  getdel(key: string): Promise<any>;

  del(key: string): Promise<number>;

  keys(pattern?: string): Promise<string[]>;

  clear(pattern?: string): Promise<number>;

  close(): Promise<void>;
}

export interface AdapterCtor<
  T extends Record<string, any> = Record<string, any>
> {
  create(options: T): Adapter;
}

export function isAdapter(x: any): x is Adapter {
  return (
    typeof x === 'object' &&
    typeof x.has === 'function' &&
    typeof x.get === 'function' &&
    typeof x.set === 'function'
  );
}

export function isAdapterCtor(x: any): x is AdapterCtor {
  return typeof x === 'function' && typeof x.create === 'function';
}
