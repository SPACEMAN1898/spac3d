import { formatFileSize } from '@clinikchat/shared';

interface AttachmentData {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  thumbnailUrl?: string | null;
}

interface Props {
  attachments: AttachmentData[];
  onImageClick: (url: string, index: number) => void;
}

export default function AttachmentView({ attachments, onImageClick }: Props) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mimeType.startsWith('image/'));
  const files = attachments.filter((a) => !a.mimeType.startsWith('image/'));

  return (
    <div className="mt-1 space-y-1">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => onImageClick(img.url || '', idx)}
              className="overflow-hidden rounded border hover:opacity-90"
            >
              <img
                src={img.thumbnailUrl || img.url}
                alt={img.filename}
                className="max-h-48 max-w-xs object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {files.map((f) => (
        <a
          key={f.id}
          href={f.url}
          download={f.filename}
          className="flex items-center gap-3 rounded border bg-gray-50 px-3 py-2 hover:bg-gray-100"
        >
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium text-primary">{f.filename}</p>
            <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
          </div>
          <svg className="ml-auto h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      ))}
    </div>
  );
}
