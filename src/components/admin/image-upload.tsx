'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { uploadImage } from '@/app/(admin)/admin/actions/media';
import { useFeedback } from '@/components/ui/feedback';

export type Uploaded = { url: string; path: string };

export function ImageUpload({ folder, onUploaded, multiple = false, remaining = 12, label = 'Upload image', hint = 'JPG, PNG, WebP or AVIF · max 8 MB' }: {
  folder: 'products' | 'categories' | 'slides' | 'settings'; onUploaded: (u: Uploaded) => void; multiple?: boolean; remaining?: number; label?: string; hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useFeedback();

  const handle = async (files: FileList | File[]) => {
    setError('');
    if (multiple && files.length > remaining) { setError(`You can add ${remaining} more ${remaining === 1 ? 'photo' : 'photos'} (maximum 12). Please select fewer files.`); return; }
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) { setError('Please choose a JPG, PNG, WebP or AVIF photo.'); continue; }
      if (!file.size) { setError('This file is empty. Please choose another photo.'); continue; }
      if (file.size > 8 * 1024 * 1024) { setError(`${file.name} is over 8 MB. Please choose a smaller photo.`); continue; }
      setBusy((n) => n + 1);
      try {
        const preview = new Image();
        const url = URL.createObjectURL(file);
        try { preview.src = url; await preview.decode(); } finally { URL.revokeObjectURL(url); }
        const fd = new FormData();
        fd.set('file', file); fd.set('folder', folder);
        const r = await uploadImage(fd);
        if (r.ok) { onUploaded({ url: r.url, path: r.path }); if (r.warning) toast({ kind: 'info', title: 'Image cleanup needs attention', message: r.warning }); }
        else { setError(r.error); toast({ kind: 'error', title: 'Upload failed', message: r.error }); }
      } catch { setError('This photo could not be uploaded. Check the file and your connection, then try again.'); }
      finally { setBusy((n) => n - 1); }
      if (!multiple) break;
    }
    if (input.current) input.current.value = '';
  };

  return (
    <div className="grid gap-2"><button type="button" onClick={() => input.current?.click()} disabled={busy > 0}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) void handle(e.dataTransfer.files); }}
      className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${drag ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/60'}`}>
      <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={(e) => e.target.files && handle(e.target.files)} />
      {busy > 0 ? <Loader2 className="size-6 animate-spin text-accent" /> : <ImagePlus className="size-6 text-accent" />}
      <span className="text-sm font-medium">{busy > 0 ? 'Uploading…' : label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>{error && <p role="alert" className="text-sm text-danger">{error}</p>}</div>
  );
}
