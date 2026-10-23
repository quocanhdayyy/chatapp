import { Image, Text, View } from 'react-native';
import { theme } from '../../core/theme';

const palette = ['#E8E1F0', '#DDECE5', '#DDE8F1', '#F4E8D5'];

export default function Avatar({ name, size = 42, uri }: { name: string; size?: number; uri?: string | null }) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.slice(0, 2) ?? '?');
  const colorIndex = Array.from(name).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % palette.length;
  return <View accessibilityLabel={name} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: palette[colorIndex], alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {uri ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" accessibilityLabel={`Ảnh đại diện của ${name}`} /> : <Text style={{ fontSize: Math.round(size * 0.32), fontWeight: '700', color: theme.colors.text }}>{initials.toLocaleUpperCase('vi-VN')}</Text>}
  </View>;
}
