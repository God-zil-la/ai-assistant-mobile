import { Text } from 'react-native';
// Match the current playground's bold, emphasis and inline code; no HTML execution.
export default function MessageText({ message, style }) {
  const text = String(message);
  // Decode only the server's reserved trailing source rows, exactly once.
  const footer = text.match(/\n\n\*\*Källor i sökunderlaget\*\*\n((?:- [^\n]+ \(KB \d+\)(?:\n|$))+)$/);
  const sourceText = footer ? footer[1].replace(/\\([\\`*_{}\[\]()#!|])/g, '$1').replace(/&(amp|lt|gt);/g, (_, entity) => ({ amp: '&', lt: '<', gt: '>' })[entity]) : '';
  const parts = (footer ? text.slice(0, footer.index) : text).split(/(\*\*[^\n]+?\*\*|\*[^\n]+?\*|`[^`]+`)/g);
  return <Text selectable style={style}>{parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <Text key={index} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>;
    if (part.startsWith('*') && part.endsWith('*')) return <Text key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
    if (part.startsWith('`') && part.endsWith('`')) return <Text key={index} style={{ fontFamily: 'monospace', backgroundColor: 'rgba(128,128,128,0.15)' }}>{part.slice(1, -1)}</Text>;
    return part;
  })}{footer ? <Text>{'\n\n'}<Text style={{ fontWeight: '700' }}>Källor i sökunderlaget</Text>{'\n' + sourceText}</Text> : null}</Text>;
}
