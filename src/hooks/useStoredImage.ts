import { useEffect, useState } from 'react';
import { getImage } from '../api/media';

export function useStoredImage(id: string | null) {
  const [reload, setReload] = useState(0);
  const [image, setImage] = useState<{ id: string | null; uri: string | null; error: string }>({ id: null, uri: null, error: '' });
  useEffect(() => {
    let active = true;
    const request = id ? getImage(id) : Promise.resolve(null);
    void request.then(
      (stored) => { if (active) setImage({ id, uri: stored?.uri ?? null, error: '' }); },
      () => { if (active) setImage({ id, uri: null, error: 'Không tải được ảnh đã lưu.' }); },
    );
    return () => { active = false; };
  }, [id, reload]);
  return { uri: image.id === id ? image.uri : null, error: image.id === id ? image.error : '', retry: () => setReload((value) => value + 1) };
}
