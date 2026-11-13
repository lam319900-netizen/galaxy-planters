import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

/**
 * Parses inline markdown tokens: **bold**, *italic*, `code`, and [label](url).
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split on bold, inline code, links, and italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Pattern matches:
  // 1. Bold: \*\*(.+?)\*\*
  // 2. Inline code: `([^`]+)`
  // 3. Link: \[(.+?)\]\((https?:\/\/[^\s)]+)\)
  // 4. Italic: \*(.+?)\*
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*[^*]+\*)/g;
  
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong key={`b_${keyIdx++}`} className="font-semibold text-stone-900">
          {inner}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const inner = token.slice(1, -1);
      parts.push(
        <code key={`c_${keyIdx++}`} className="px-1.5 py-0.5 rounded bg-emerald-50/80 text-emerald-800 text-xs font-mono font-medium border border-emerald-100">
          {inner}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const labelMatch = token.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      if (labelMatch) {
        parts.push(
          <a
            key={`a_${keyIdx++}`}
            href={labelMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline font-medium hover:text-emerald-900"
          >
            {labelMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const inner = token.slice(1, -1);
      parts.push(
        <em key={`i_${keyIdx++}`} className="italic text-stone-700">
          {inner}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.substring(lastIndex));
  }

  return parts;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({
  content,
  className = '',
  isUser = false
}) => {
  if (isUser) {
    return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1.5 my-2 ps-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: string) => {
    if (inTable && tableRows.length > 0) {
      const headerRow = tableRows[0];
      const dataRows = tableRows.slice(1).filter(r => !r.every(c => c.trim().match(/^:?-+:?$/)));

      elements.push(
        <div key={key} className="my-3 overflow-x-auto rounded-lg border border-[#DCE4D8] shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            {headerRow && (
              <thead className="bg-[#EEF3EA] text-[#174C35] font-semibold">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 border-b border-[#D5DDD2]">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#E9EFE6] bg-white">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F9FAF8]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-stone-700">
                      {parseInlineMarkdown(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check for Markdown Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(`fl_${idx}`);
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable(`ft_${idx}`);
    }

    // Check for Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(`fl_${idx}`);
      elements.push(<hr key={`hr_${idx}`} className="my-3 border-[#E3E8DE]" />);
      return;
    }

    // Check for Headings
    if (trimmed.startsWith('### ')) {
      flushList(`fl_${idx}`);
      elements.push(
        <h3 key={`h3_${idx}`} className="text-sm sm:text-base font-bold text-[#174C35] mt-3.5 mb-1.5 flex items-center gap-1.5">
          {parseInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList(`fl_${idx}`);
      elements.push(
        <h2 key={`h2_${idx}`} className="text-base sm:text-lg font-bold text-[#174C35] mt-4 mb-2">
          {parseInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList(`fl_${idx}`);
      elements.push(
        <h1 key={`h1_${idx}`} className="text-lg sm:text-xl font-extrabold text-[#174C35] mt-4 mb-2">
          {parseInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      return;
    }

    // Check for Blockquote
    if (trimmed.startsWith('> ')) {
      flushList(`fl_${idx}`);
      elements.push(
        <blockquote key={`bq_${idx}`} className="border-s-4 border-[#174C35] ps-3 py-1.5 bg-[#EEF3EA]/70 rounded-e-md text-xs sm:text-sm text-stone-800 my-2">
          {parseInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Check for Bulleted List
    if (trimmed.match(/^[-*•]\s+/)) {
      inList = true;
      const text = trimmed.replace(/^[-*•]\s+/, '');
      listItems.push(
        <li key={`li_${idx}`} className="flex items-start gap-2 text-xs sm:text-sm text-stone-800">
          <span className="text-[#174C35] font-bold select-none leading-relaxed">•</span>
          <span className="flex-1 leading-relaxed">{parseInlineMarkdown(text)}</span>
        </li>
      );
      return;
    }

    // Check for Numbered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      inList = true;
      listItems.push(
        <li key={`li_${idx}`} className="flex items-start gap-2 text-xs sm:text-sm text-stone-800">
          <span className="text-[#174C35] font-semibold text-xs min-w-[18px] select-none leading-relaxed">
            {numMatch[1]}.
          </span>
          <span className="flex-1 leading-relaxed">{parseInlineMarkdown(numMatch[2])}</span>
        </li>
      );
      return;
    }

    // If empty line, flush list and output small spacer
    if (!trimmed) {
      flushList(`fl_${idx}`);
      elements.push(<div key={`sp_${idx}`} className="h-1.5" />);
      return;
    }

    // Regular paragraph
    flushList(`fl_${idx}`);
    elements.push(
      <p key={`p_${idx}`} className="text-xs sm:text-sm leading-relaxed text-stone-800 my-1">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });

  // Final flushes
  flushList('final_list');
  flushTable('final_table');

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
