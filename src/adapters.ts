import {Adapter, AdapterCtor, isConstructor} from './types';
import {format} from './utils';

const debug = require('debug')('kvs:adapters');

export type ModuleLoader<T> = (name: string) => T | undefined;

export function createAdapter(name: string, options?: any): Adapter {
  const cls = getAdapter(name);
  return new cls(options);
}

// List possible adapter module names
function providerModuleNames(name: string) {
  const names = []; // Check the name as is
  if (!name.match(/^\//)) {
    names.push('./adapters/' + name); // Check built-in providers
    if (name.indexOf('kvs-') !== 0) {
      names.push('kvs-' + name); // Try limeo-adapter-<name>
    }
  }
  return names;
}

// testable with DI
function tryModules<T>(
  names: string[],
  loader?: ModuleLoader<T>,
): T | undefined {
  let mod: T | undefined = undefined;
  loader = loader ?? require;
  for (const name of names) {
    try {
      mod = loader(name);
    } catch (e) {
      const notFound =
        e.code === 'MODULE_NOT_FOUND' &&
        e.message &&
        e.message.indexOf(name) > 0;

      if (notFound) {
        debug('Module %s not found, will try another candidate.', name);
        continue;
      }

      debug('Cannot load adapter %s: %s', name, e.stack || e);
      throw e;
    }
    if (mod) {
      break;
    }
  }
  return mod;
}

export function resolveAdapter(
  name: string,
  loader?: ModuleLoader<AdapterCtor>,
): AdapterCtor | Error {
  const names = providerModuleNames(name);
  let adapter: any = tryModules(names, loader);
  adapter = adapter?.default ?? adapter;
  let error = null;
  if (!adapter) {
    error = new Error(
      format(
        '\nWARNING: KVS adapter "%s" is not installed ' +
          'as any of the following modules:\n\n %s\n\nTo fix, run:\n\n    {{npm install %s --save}}\n',
        name,
        names.join('\n'),
        names[names.length - 1],
      ),
    );
  }
  return adapter ?? error;
}

export function getAdapter(
  name: string,
  loader?: ModuleLoader<AdapterCtor>,
): AdapterCtor {
  const answer = resolveAdapter(name, loader);
  if (isConstructor(answer)) {
    return answer;
  }
  throw answer;
}
