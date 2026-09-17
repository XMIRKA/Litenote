/**
 * LiteNote Lightweight Real-time Code Syntax Tokenizer & Highlighter
 * Supports JS, TS, Python, JSON with zero external bundle overhead
 */

export function highlightCode(code: string, language: string): string {
  if (!code) return '';

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const isPython = language === 'python';
  const isJson = language === 'json';

  // Regular expression tokens
  // Order matters: comments first, then strings, then keywords, builtins, numbers
  const tokens: { type: string; regex: RegExp }[] = [
    // Comments
    { type: 'comment', regex: isPython ? /#.*$/m : /\/\/.*$|\/\*[\s\S]*?\*\//m },
    // Strings (including template literals)
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    // Numbers
    { type: 'number', regex: /\b\d+(?:\.\d+)?\b/ },
    // Booleans & Null
    { type: 'atom', regex: /\b(true|false|null|undefined|None|True|False)\b/ },
  ];

  if (!isJson) {
    if (isPython) {
      tokens.push(
        {
          type: 'keyword',
          regex: /\b(def|return|if|elif|else|for|in|while|import|from|class|pass|break|continue|lambda|with|as|try|except|raise|finally|and|or|not|is)\b/,
        },
        {
          type: 'builtin',
          regex: /\b(print|range|len|sum|max|min|round|abs|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool)\b/,
        }
      );
    } else {
      tokens.push(
        {
          type: 'keyword',
          regex: /\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|interface|type|async|await|try|catch|new|this|typeof|instanceof|switch|case|break|continue)\b/,
        },
        {
          type: 'builtin',
          regex: /\b(console|Math|JSON|Promise|Array|Object|String|Number|Boolean|setTimeout|clearTimeout|setInterval|clearInterval|document|window)\b/,
        }
      );
    }
  }

  // Combine into single regex with capture groups
  let pos = 0;
  let result = '';

  const masterRegex = new RegExp(
    tokens.map((t) => `(${t.regex.source})`).join('|'),
    'g'
  );

  let match: RegExpExecArray | null;
  while ((match = masterRegex.exec(code)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];

    // Unmatched chunk before token
    if (matchIndex > pos) {
      result += escapeHtml(code.slice(pos, matchIndex));
    }

    // Determine which token group matched
    let tokenType = 'plain';
    for (let i = 0; i < tokens.length; i++) {
      if (match[i + 1] !== undefined) {
        tokenType = tokens[i].type;
        break;
      }
    }

    const escapedMatch = escapeHtml(matchStr);
    switch (tokenType) {
      case 'comment':
        result += `<span class="text-slate-500 italic">${escapedMatch}</span>`;
        break;
      case 'string':
        result += `<span class="text-emerald-300">${escapedMatch}</span>`;
        break;
      case 'keyword':
        result += `<span class="text-cyan-400 font-semibold">${escapedMatch}</span>`;
        break;
      case 'builtin':
        result += `<span class="text-indigo-300 font-medium">${escapedMatch}</span>`;
        break;
      case 'number':
        result += `<span class="text-amber-300">${escapedMatch}</span>`;
        break;
      case 'atom':
        result += `<span class="text-rose-400 font-semibold">${escapedMatch}</span>`;
        break;
      default:
        result += escapedMatch;
        break;
    }

    pos = matchIndex + matchStr.length;
  }

  if (pos < code.length) {
    result += escapeHtml(code.slice(pos));
  }

  return result;
}
