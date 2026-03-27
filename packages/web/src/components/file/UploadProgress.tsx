interface Upload {
  filename: string;
  progress: number;
}

interface Props {
  uploads: Upload[];
}

export default function UploadProgress({ uploads }: Props) {
  if (uploads.length === 0) return null;

  return (
    <div className="border-t border-gray-100 px-6 py-2 space-y-1">
      {uploads.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="max-w-[150px] truncate text-xs text-gray-500">{u.filename}</span>
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${u.progress}%` }} />
          </div>
          <span className="text-xs text-gray-400">{u.progress}%</span>
        </div>
      ))}
    </div>
  );
}
