export function format(fmt: string, ...args: any[]): string {
  const re = /(%?)(%([jds]))/g;
  if (args.length) {
    fmt = fmt.replace(re, function (match, escaped, ptn, flag) {
      let arg: any = args.shift();
      switch (flag) {
        case 's':
          arg = '' + arg;
          break;
        case 'd':
          arg = Number(arg);
          break;
        case 'j':
          arg = JSON.stringify(arg);
          break;
      }
      if (!escaped) {
        return arg;
      }
      args.unshift(arg);
      return match;
    });
  }

  // arguments remain after formatting
  if (args.length) {
    fmt += ' ' + args.join(' ');
  }

  // update escaped %% values
  fmt = fmt.replace(/%{2}/g, '%');

  return fmt;
}
