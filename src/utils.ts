import util from 'util';

export function format(fmt: any, ...params: any[]): string {
  return util.format(fmt, ...params);
}

export async function asyncFromCallback<T>(
  fn: (cb: (err: any, data: T) => any) => any,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fn((err, data) => (err ? reject(err) : resolve(data)));
  });
}
