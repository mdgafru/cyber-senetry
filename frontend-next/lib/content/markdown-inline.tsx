import Link from 'next/link';
import type { ReactNode } from 'react';

/** Remove markdown symbols from plain headings/labels. */
export function stripMarkdown(text: unknown): string {
  if (text == null) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(?<![*\w])\*(?![*\w])/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

/** Clean AI markdown quirks before save (stray asterisks, wrapped quotes). */
export function sanitizeArticleMarkdown(content: unknown): string {
  if (content == null) return '';
  return String(content)
    .replace(/\*"([^"]+)"\*/g, '"$1"')
    .replace(/\*'([^']+)'\*/g, "'$1'")
    .replace(/(^|\s)\*(?=\s|[,.;:!?)]|$)/gm, '$1')
    .replace(/\*{3,}/g, '')
    .replace(/\n{3,}/g, '\n\n');
}

function cleanPlainText(text: string): string {
  return text.replace(/(?<![*\w])\*(?![*\w])/g, '');
}

/** Render inline markdown: links, bold, italic, code. */
export function inlineFormat(text: unknown, keyPrefix = 'inline'): ReactNode {
  if (text == null || text === '') return null;

  const str = String(text);
  const parts: ReactNode[] = [];
  let key = 0;
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|(?<!\*)\*([^*\n]+?)\*(?!\*)|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(str)) !== null) {
    if (m.index > last) {
      parts.push(cleanPlainText(str.slice(last, m.index)));
    }
    if (m[1] && m[2]) {
      const href = m[2];
      const isInternal = href.startsWith('/');
      parts.push(
        isInternal ? (
          <Link key={`${keyPrefix}-${key++}`} href={href} className="article-link">
            {m[1]}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="article-link"
          >
            {m[1]}
          </a>
        )
      );
    } else if (m[3]) {
      parts.push(<strong key={`${keyPrefix}-${key++}`}>{m[3]}</strong>);
    } else if (m[4]) {
      parts.push(<em key={`${keyPrefix}-${key++}`}>{m[4]}</em>);
    } else if (m[5]) {
      parts.push(
        <code
          key={`${keyPrefix}-${key++}`}
          className="px-1.5 py-0.5 bg-muted border border-foreground/20 font-mono text-[0.85em]"
        >
          {m[5]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }

  if (last < str.length) {
    parts.push(cleanPlainText(str.slice(last)));
  }

  return parts.length ? parts : cleanPlainText(str);
}
