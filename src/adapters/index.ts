import {Adapter, AdapterCtor, isAdapterCtor} from '../types';

export function load(name: string): AdapterCtor {
  let ctor: AdapterCtor;
  try {
    ctor = require(`./${name}`).default;
  } catch (e) {
    throw new Error(`Unsupported adapter named: ${name}`);
  }
  if (!isAdapterCtor(ctor)) {
    throw new Error(`${name} is not a adapter`);
  }
  return ctor;
}

export function createAdapter(name: string, options?: any): Adapter {
  return load(name).create(options);
}
