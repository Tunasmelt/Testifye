/**
 * SimpleMarkdown — lightweight inline markdown renderer.
 * Handles: **bold**, *italic*, `code`, numbered lists, bullet lists.
 * No external dependency — pure regex splitting.
 */

interface Props {
  text: string;
}

/** Split a single paragraph into inline tokens and render. */
function InlineParagraph({ text }: { text: string }) {
  // Split on **bold** and `code` spans
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              style={{
                background:    'var(--bg-3)',
                padding:       '1px 5px',
                borderRadius:  4,
                fontSize:      11,
                fontFamily:    'JetBrains Mono, monospace',
                color:         'var(--accent-2)',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function SimpleMarkdown({ text }: Props) {
  if (!text) return null;

  // Split into lines for list detection
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list item  "1. foo"
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: 20, margin: '6px 0' }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ marginBottom: 3 }}>
              <InlineParagraph text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item  "- foo" or "• foo"
    if (/^[-•]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-•]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 20, margin: '6px 0' }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ marginBottom: 3 }}>
              <InlineParagraph text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line — spacing
    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
      i++;
      continue;
    }

    // Regular paragraph line
    elements.push(
      <span key={`p-${i}`} style={{ display: 'block', marginBottom: 4 }}>
        <InlineParagraph text={line} />
      </span>
    );
    i++;
  }

  return <>{elements}</>;
}
