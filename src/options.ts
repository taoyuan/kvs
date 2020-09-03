import {MemoryOptions} from './adapters/memory';
import {RedisOptions} from './adapters/redis';

export type AdapterOptions = MemoryOptions | RedisOptions;
