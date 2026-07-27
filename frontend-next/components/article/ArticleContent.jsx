'use client';
import { normalizeDashesMultiline } from '@/lib/content/meta';
import { inlineFormat, sanitizeArticleMarkdown, stripMarkdown } from '@/lib/content/markdown-inline';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function parseTable(lines, startIdx) {
  const rows = [];
  let i = startIdx;
  while (i < lines.length && lines[i].includes('|')) {
    const cells = lines[i]
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => !(idx === 0 && arr[0] === '') && !(idx === arr.length - 1 && arr[arr.length - 1] === ''));
    if (!cells.every((c) => /^:?-+:?$/.test(c))) {
      rows.push(cells);
    }
    i++;
  }
  return { rows, end: i };
}

function restoreMarkdownLines(text) {
  if (!text || text.includes('\n')) return text;
  if (text.length < 400) return text;
  return text
    .replace(/\s+(#{1,3}\s)/g, '\n\n$1')
    .replace(/\s+(\*\*[A-Z][^*]+\*\*)/g, '\n\n$1')
    .replace(/\s+(- \*\*)/g, '\n$1')
    .replace(/\s+(\d+\.\s)/g, '\n$1');
}

export default function ArticleContent({ content }) {
  if (!content) return null;

  const normalized = sanitizeArticleMarkdown(normalizeDashesMultiline(content));
  const restored = restoreMarkdownLines(normalized);
  const lines = restored.split(/\r?\n/);
  const out = [];
  let list = null;
  let listType = 'ul';
  let skipToc = false;
  let i = 0;
  let h1Skipped = false;

  const flushList = () => {
    if (!list) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    out.push(
      <Tag key={`list-${out.length}`} className={listType === 'ol' ? 'article-ol' : 'article-ul'}>
        {list}
      </Tag>
    );
    list = null;
  };

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      if (!h1Skipped) {
        h1Skipped = true;
        i++;
        continue;
      }
    }

    if (/^##\s+table of contents$/i.test(trimmed)) {
      skipToc = true;
      i++;
      continue;
    }
    if (skipToc) {
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        skipToc = false;
      } else {
        i++;
        continue;
      }
    }

    if (!trimmed) {
      flushList();
      i++;
      continue;
    }

    if (trimmed.includes('|') && lines[i + 1]?.includes('|') && /[-|]{3,}/.test(lines[i + 1] || '')) {
      flushList();
      const { rows, end } = parseTable(lines, i);
      if (rows.length) {
        const [header, ...body] = rows;
        out.push(
          <div key={`table-${i}`} className="article-table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  {header.map((cell, ci) => (
                    <th key={ci}>{inlineFormat(cell, `th-${i}-${ci}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{inlineFormat(cell, `td-${i}-${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      i = end;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      const title = stripMarkdown(trimmed.slice(3).trim());
      out.push(
        <h2 key={`h2-${i}`} id={slugify(title)} className="scroll-mt-20">
          {title}
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      const title = stripMarkdown(trimmed.slice(4).trim());
      out.push(
        <h3 key={`h3-${i}`} id={slugify(title)} className="scroll-mt-20">
          {title}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      out.push(
        <blockquote key={`bq-${i}`} className="article-quote">
          {inlineFormat(trimmed.slice(2), `bq-${i}`)}
        </blockquote>
      );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listType = 'ul';
      list = list || [];
      list.push(<li key={`li-${i}`}>{inlineFormat(trimmed.replace(/^[-*]\s+/, ''), `li-${i}`)}</li>);
      i++;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      listType = 'ol';
      list = list || [];
      list.push(<li key={`li-${i}`}>{inlineFormat(trimmed.replace(/^\d+\.\s+/, ''), `li-${i}`)}</li>);
      i++;
      continue;
    }

    flushList();
    out.push(
      <p key={`p-${i}`}>{inlineFormat(trimmed, `p-${i}`)}</p>
    );
    i++;
  }

  flushList();
  return <div className="prose-editorial w-full max-w-none break-words">{out}</div>;
}
