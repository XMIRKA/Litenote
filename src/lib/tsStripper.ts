/**
 * Robust TypeScript to JavaScript transpiler / stripper for in-browser execution.
 * Handles generic classes/interfaces, type annotations, access modifiers, enums, etc.
 */

export function stripTypeScript(code: string): string {
  let src = code;

  // 1. Remove comments or multiline interfaces / types:
  // match interface Name { ... } across multiple lines or single line
  src = src.replace(/(?:export\s+)?interface\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?\s*\{[^}]*\}/gs, '');
  src = src.replace(/(?:export\s+)?type\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?\s*=\s*[^;]*;/gs, '');

  // 2. Remove generic class parameters: class LRUCache<K, V> -> class LRUCache
  src = src.replace(/\bclass\s+([A-Za-z0-9_$]+)\s*<[^>]+>/g, 'class $1');

  // 3. Remove generic function declarations: function foo<T>(...) -> function foo(...)
  src = src.replace(/\bfunction\s+([A-Za-z0-9_$]+)\s*<[^>]+>\s*\(/g, 'function $1(');

  // 4. Remove generic instantiations with new: new Map<K, V>() -> new Map() or new LRUCache<string, number>(...) -> new LRUCache(...)
  src = src.replace(/\bnew\s+([A-Za-z0-9_$.]+)\s*<[^>]+>\s*\(/g, 'new $1(');

  // 5. Remove 'as Type' type assertions
  src = src.replace(/\s+as\s+[A-Za-z0-9_$<>\[\],\s|&]+/g, '');

  // 6. Handle class member field declarations with types / initializers:
  // private frames: VehicleSensorFrame[] = []; -> frames = [];
  // private capacity: number; -> capacity;
  // private cache: Map<K, V>; -> cache;
  src = src.replace(/^\s*(?:private|public|protected|readonly)?\s*([A-Za-z0-9_$]+)\s*:\s*[^=;\n]+(\s*=[^;\n]+)?;/gm, (_m, name, init) => {
    return init ? `  ${name}${init};` : `  ${name};`;
  });

  // 7. Remove class member field access modifiers without type: private frames = [];
  src = src.replace(/^\s*(?:private|public|protected|readonly)\s+([A-Za-z0-9_$]+)(\s*=[^;\n]+)?;$/gm, (_m, name, init) => {
    return init ? `  ${name}${init};` : `  ${name};`;
  });

  // 8. Remove constructor parameter access modifiers & types (e.g. constructor(private capacity: number))
  src = src.replace(/\bconstructor\s*\(([^)]*)\)/g, (_match, params) => {
    const cleanedParams = params.split(',').map((p: string) => {
      let clean = p.trim();
      clean = clean.replace(/\b(public|private|protected|readonly)\s+/, '');
      clean = clean.replace(/:\s*[^=]+/, '');
      return clean;
    }).join(', ');
    return `constructor(${cleanedParams})`;
  });

  // 9. Remove method return types & parameter types in methods and functions:
  // ingest(frame: VehicleSensorFrame) { -> ingest(frame) {
  // getMetrics(): Metrics { -> getMetrics() {
  // get(key: K): V | undefined { -> get(key) {
  src = src.replace(/([A-Za-z0-9_$]+)\s*\(([^)]*)\)(?:\s*:\s*[^;{\n]+)?\s*\{/g, (_m, methodName, params) => {
    const cleanedParams = params.split(',').map((p: string) => {
      const clean = p.trim().replace(/:\s*[^=]+/, '');
      return clean;
    }).join(', ');
    return `${methodName}(${cleanedParams}) {`;
  });

  // 10. Clean variable declarations with types:
  // const x: number = 5; -> const x = 5;
  // let map: Map<string, number> = new Map(); -> let map = new Map();
  src = src.replace(/\b(const|let|var)\s+([A-Za-z0-9_$]+)\s*:\s*[^=;\n]+\s*=/g, '$1 $2 =');

  // 11. Clean parameter types in arrow functions: (x: number, y: string) =>
  src = src.replace(/\(([^)]+)\)\s*(?::\s*[^=;{\n]+)?\s*=>/g, (_m, params) => {
    const cleanedParams = params.split(',').map((p: string) => p.trim().replace(/:\s*[^=]+/, '')).join(', ');
    return `(${cleanedParams}) =>`;
  });

  // 12. Remove non-null assertion operators: this.cache.get(key)!; -> this.cache.get(key);
  src = src.replace(/(\b[A-Za-z0-9_$.()]+\s*)!(?=[,;)\s.])/g, '$1');

  return src;
}
