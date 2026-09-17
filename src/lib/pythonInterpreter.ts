/**
 * High-performance In-Browser Python Transpiler & Interpreter
 */

export function runPythonInBrowser(code: string): string[] {
  let outputBuffer = '';
  const outputLogs: string[] = [];

  const flushBuffer = () => {
    if (outputBuffer.length > 0) {
      outputLogs.push(outputBuffer);
      outputBuffer = '';
    }
  };

  const print = (...args: any[]) => {
    // Check if the last arg or an option is end="..." or sep="..."
    let end = '\n';
    let sep = ' ';
    const formattedArgs: any[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === 'object' && arg !== null && '__py_kwarg__' in arg) {
        if (arg.end !== undefined) end = String(arg.end);
        if (arg.sep !== undefined) sep = String(arg.sep);
      } else {
        formattedArgs.push(arg);
      }
    }

    const str = formattedArgs
      .map((a) => {
        if (a === null) return 'None';
        if (a === true) return 'True';
        if (a === false) return 'False';
        if (typeof a === 'object') return JSON.stringify(a);
        return String(a);
      })
      .join(sep);

    if (end === '\n') {
      if (outputBuffer.length > 0) {
        outputLogs.push(outputBuffer + str);
        outputBuffer = '';
      } else {
        outputLogs.push(str);
      }
    } else {
      outputBuffer += str + end;
    }
  };

  const scope: Record<string, any> = {
    math: Math,
    len: (obj: any) => (obj !== undefined && obj !== null ? obj.length || Object.keys(obj).length : 0),
    range: (start: number, stop?: number, step = 1) => {
      if (stop === undefined) {
        stop = start;
        start = 0;
      }
      const arr: number[] = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) arr.push(i);
      } else if (step < 0) {
        for (let i = start; i > stop; i += step) arr.push(i);
      }
      return arr;
    },
    sum: (arr: any) => (Array.isArray(arr) ? arr.reduce((acc, v) => acc + (Number(v) || 0), 0) : 0),
    max: (...args: any[]) => (Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args)),
    min: (...args: any[]) => (Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args)),
    abs: Math.abs,
    round: (val: number, decimals = 0) => {
      const factor = Math.pow(10, decimals);
      return Math.round(val * factor) / factor;
    },
    zip: (...arrays: any[][]) => {
      if (arrays.length === 0) return [];
      const minLen = Math.min(...arrays.map((a) => (Array.isArray(a) ? a.length : 0)));
      const res = [];
      for (let i = 0; i < minLen; i++) {
        res.push(arrays.map((a) => a[i]));
      }
      return res;
    },
    enumerate: (arr: any[]) => (Array.isArray(arr) ? arr : []).map((item, idx) => [idx, item]),
    str: (v: any) => String(v),
    int: (v: any) => parseInt(v, 10) || 0,
    float: (v: any) => parseFloat(v) || 0.0,
    list: (v: any) => (Array.isArray(v) ? v : Array.from(v || [])),
    True: true,
    False: false,
    None: null,
  };

  try {
    const rawLines = code.split(/\r?\n/);
    const processedLines: string[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i];
      const trimmed = rawLine.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        processedLines.push('');
        continue;
      }

      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        processedLines.push(`${indent}// ${trimmed}`);
        continue;
      }

      let line = trimmed;

      // Convert print(..., end="...") or print(...)
      line = line.replace(/\bprint\s*\((.*?)\)/g, (_match, printArgs) => {
        let transformedArgs = printArgs;
        // Check for end=... or sep=...
        if (/end\s*=\s*([^\s,)]+)/.test(transformedArgs) || /sep\s*=\s*([^\s,)]+)/.test(transformedArgs)) {
          let endVal = '"\\n"';
          let sepVal = '" "';
          
          const endMatch = transformedArgs.match(/end\s*=\s*(["'][^"']*["']|[^\s,)]+)/);
          if (endMatch) endVal = endMatch[1];
          
          const sepMatch = transformedArgs.match(/sep\s*=\s*(["'][^"']*["']|[^\s,)]+)/);
          if (sepMatch) sepVal = sepMatch[1];

          // Clean keyword args from positional args
          const cleanArgs = transformedArgs
            .replace(/end\s*=\s*(["'][^"']*["']|[^\s,)]+)/g, '')
            .replace(/sep\s*=\s*(["'][^"']*["']|[^\s,)]+)/g, '')
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .join(', ');

          return cleanArgs
            ? `__print(${cleanArgs}, { __py_kwarg__: true, end: ${endVal}, sep: ${sepVal} })`
            : `__print({ __py_kwarg__: true, end: ${endVal}, sep: ${sepVal} })`;
        }
        return `__print(${printArgs})`;
      });

      // f-strings
      line = line.replace(/\bf(["'])(.*?)\1/g, (_match, _quote, content) => {
        const interpolated = content.replace(/\{([^}]+)\}/g, (_m: string, expr: string) => {
          if (expr.includes(':.')) {
            const [varName, format] = expr.split(':.');
            const decimals = parseInt(format.replace('f', ''), 10) || 2;
            return `\${Number(${varName.trim()}).toFixed(${decimals})}`;
          }
          return `\${${expr.trim()}}`;
        });
        return `\`${interpolated}\``;
      });

      // Boolean constants
      line = line.replace(/\bTrue\b/g, 'true')
                 .replace(/\bFalse\b/g, 'false')
                 .replace(/\bNone\b/g, 'null');

      // def func(a, b): -> function func(a, b) {
      if (/^def\s+([A-Za-z0-9_$]+)\s*\((.*?)\)\s*:/.test(line)) {
        line = line.replace(/^def\s+([A-Za-z0-9_$]+)\s*\((.*?)\)\s*:/, 'function $1($2) {');
      }

      // for x in iter:
      else if (/^for\s+([A-Za-z0-9_$,\s]+)\s+in\s+([^:]+)\s*:/.test(line)) {
        const forMatch = line.match(/^for\s+([A-Za-z0-9_$,\s]+)\s+in\s+([^:]+)\s*:/);
        if (forMatch) {
          const varPart = forMatch[1].trim();
          const iterable = forMatch[2].trim();
          if (varPart.includes(',')) {
            line = `for (let [${varPart}] of ${iterable}) {`;
          } else {
            line = `for (let ${varPart} of ${iterable}) {`;
          }
        }
      }

      // while condition:
      else if (/^while\s+([^:]+)\s*:/.test(line)) {
        line = line.replace(/^while\s+([^:]+)\s*:/, 'while ($1) {');
      }

      // if / elif / else:
      else if (/^if\s+([^:]+)\s*:/.test(line)) {
        line = line.replace(/^if\s+([^:]+)\s*:/, 'if ($1) {');
      } else if (/^elif\s+([^:]+)\s*:/.test(line)) {
        line = line.replace(/^elif\s+([^:]+)\s*:/, 'else if ($1) {');
      } else if (/^else\s*:/.test(line)) {
        line = line.replace(/^else\s*:/, 'else {');
      }

      // Multiple variable assignment: a, b = 0, 1 OR a, b = b, a + b
      else if (/^([A-Za-z0-9_$\s,]+)\s*=\s*(.+)$/.test(line) && line.includes(',') && !line.startsWith('return ') && !line.includes('==')) {
        const parts = line.split('=');
        const left = parts[0].trim();
        const right = parts.slice(1).join('=').trim();
        if (left.includes(',')) {
          const leftVars = left.split(',').map(s => s.trim());
          line = `var [${leftVars.join(', ')}] = [${right}];`;
        } else {
          line = `var ${line};`;
        }
      }

      // Single assignment: x = 10
      else if (/^[A-Za-z0-9_$]+\s*=\s*[^=]/.test(line) && !line.startsWith('return ') && !line.startsWith('var ') && !line.startsWith('let ') && !line.startsWith('const ')) {
        line = `var ${line};`;
      }

      processedLines.push(`${indent}${line}`);
    }

    // Indentation-based block builder
    const balancedLines: string[] = [];
    const indentStack: number[] = [];

    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        balancedLines.push(line);
        continue;
      }

      const indentLen = line.search(/\S/);

      while (indentStack.length > 0 && indentLen <= indentStack[indentStack.length - 1]) {
        const closedIndent = indentStack.pop() || 0;
        balancedLines.push(`${' '.repeat(closedIndent)}}`);
      }

      balancedLines.push(line);

      if (trimmed.endsWith('{')) {
        indentStack.push(indentLen);
      }
    }

    while (indentStack.length > 0) {
      const closedIndent = indentStack.pop() || 0;
      balancedLines.push(`${' '.repeat(closedIndent)}}`);
    }

    const transpiledJs = balancedLines.join('\n');

    const runner = new Function(
      '__print',
      'scope',
      'math',
      'range',
      'sum',
      'len',
      'max',
      'min',
      'abs',
      'round',
      'zip',
      'enumerate',
      'str',
      'int',
      'float',
      'list',
      `
      with (scope) {
        try {
          ${transpiledJs}
        } catch (e) {
          __print("❌ Python Runtime Error: " + e.message);
        }
      }
    `
    );

    runner(
      print,
      scope,
      Math,
      scope.range,
      scope.sum,
      scope.len,
      scope.max,
      scope.min,
      scope.abs,
      scope.round,
      scope.zip,
      scope.enumerate,
      scope.str,
      scope.int,
      scope.float,
      scope.list
    );

    flushBuffer();

    if (outputLogs.length === 0) {
      outputLogs.push('✓ Process finished with exit code 0 (no output logs)');
    }

    return outputLogs;
  } catch (err: any) {
    return [`❌ Python Parser Error: ${err.message || String(err)}`];
  }
}
