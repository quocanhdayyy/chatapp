import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { getProfile, updateProfile, PROFILE_TEXT_LIMITS, type Profile } from '../api/profile';
import AppButton from '../components/ui/AppButton';
import AppTextField from '../components/ui/AppTextField';
import Page from '../components/ui/Page';
import { ErrorState, LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';

type Props = { userId: string; onBack: () => void; onSaved: (profile: Profile) => void };
const fields = [
  { key: 'name', label: 'Họ tên' }, { key: 'bio', label: 'Giới thiệu' },
  { key: 'city', label: 'Nơi sống hiện tại' }, { key: 'hometown', label: 'Quê quán' },
  { key: 'workplace', label: 'Công việc / Nơi làm việc' }, { key: 'education', label: 'Học vấn / Trường học' },
] as const;
const emptyForm = { name: '', bio: '', city: '', hometown: '', workplace: '', education: '' };

export default function EditProfileScreen({ userId, onBack, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setLoadError('');
      try {
        const profile = await getProfile(userId);
        if (active) setForm({ name: profile.name, bio: profile.bio, city: profile.city, hometown: profile.hometown, workplace: profile.workplace, education: profile.education });
      } catch (err) { if (active) setLoadError(err instanceof Error ? err.message : 'Không tải được hồ sơ.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [userId, reload]);

  async function handleSave() {
    if (saving) return;
    if (!form.name.trim()) { setError('Họ tên không được để trống.'); return; }
    setSaving(true); setError('');
    try { onSaved(await updateProfile(userId, form)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không lưu được hồ sơ.'); }
    finally { setSaving(false); }
  }

  return <Page title="Chỉnh sửa hồ sơ" onBack={onBack} busy={saving}>
    {loading ? <LoadingState /> : loadError ? <ErrorState message={loadError} onRetry={() => setReload((value) => value + 1)} /> : <>
      {fields.map((field) => <AppTextField key={field.key} label={field.label} value={form[field.key]} onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))} multiline={field.key === 'bio'} maxLength={PROFILE_TEXT_LIMITS[field.key]} editable={!saving} />)}
      {!!error && <Text style={{ color: theme.colors.error }} accessibilityRole="alert">{error}</Text>}
      <AppButton label={saving ? 'Đang lưu…' : 'Lưu hồ sơ'} onPress={handleSave} loading={saving} />
      <AppButton label="Hủy" onPress={onBack} disabled={saving} variant="secondary" />
    </>}
  </Page>;
}
