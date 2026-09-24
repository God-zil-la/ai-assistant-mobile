import { Children } from 'react';
import { View, useWindowDimensions } from 'react-native';

// Keep controls readable with enlarged system text; never fix a card's height.
export default function CompactGrid({ children, columns = 2, tabletColumns = columns }) {
  const { width, fontScale } = useWindowDimensions();
  const count = fontScale > 1.4 || width < 300 ? 1 : width >= 700 ? tabletColumns : columns;
  const items = Children.toArray(children);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {items.map((child, index) => <View key={child.key || index}
      style={{ flexBasis: count === 1 ? '100%' : `${100 / count - 2}%`, flexGrow: 1, minWidth: 0 }}>
      {child}
    </View>)}
  </View>;
}
