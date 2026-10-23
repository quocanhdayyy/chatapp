import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';
import Icon from './Icon';

export default function Brand({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  return (
    <View style={styles.brand}>
      <View style={styles.mark}>
        <Icon name="comment" size={23} color={theme.colors.onPrimary} />
      </View>
      {!iconOnly && <View>
        <Text style={styles.name}>ChatApp</Text>
        {!compact && <Text style={styles.caption}>Thành viên</Text>}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 42, height: 42, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  name: { color: theme.colors.text, fontSize: 19, fontWeight: '700' },
  caption: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
});
