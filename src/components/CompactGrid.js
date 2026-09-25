import { Children } from 'react';
import { View, useWindowDimensions } from 'react-native';

// Keep controls readable with enlarged system text; never fix a card's height.
export default function CompactGrid({ children, columns = 1, tabletColumns = 2 }) {
  const { width, height, fontScale } = useWindowDimensions();
  const isLandscape = width > height;
  const count = fontScale > 1.4 ? 1 : isLandscape ? tabletColumns : columns;
  const items = Children.toArray(children);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {items.map((child, index) => <View key={child.key || index}
      style={{ flexBasis: count === 1 ? '100%' : `${100 / count - 2}%`, flexGrow: 1, minWidth: 0 }}>
      {child}
    </View>)}
  </View>;
}
