import { Text } from 'react-native';
// Match the current playground's bold, emphasis and inline code; no HTML execution.
export default function MessageText({ message, style }) {
  const parts = String(message).split(/(\*\*[^\n]+?\*\*|\*[^\n]+?\*|`[^`]+`)/g);
  return <Text selectable style={style}>{parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <Text key={index} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>;
    if (part.startsWith('*') && part.endsWith('*')) return <Text key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
    if (part.startsWith('`') && part.endsWith('`')) return <Text key={index} style={{ fontFamily: 'monospace', backgroundColor: 'rgba(128,128,128,0.15)' }}>{part.slice(1, -1)}</Text>;
    return part;
  })}</Text>;
}
