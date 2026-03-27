import { formatFileSize } from '@clinikchat/shared';

interface StagedFile {
  file: File;
  preview?: string;
}

interface Props {
  files: StagedFile[];
  onRemove: (index: number) => void;
}

export default function FilePreview({ files, onRemove }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="flex gap-2 border-t border-gray-100 px-6 py-2 overflow-x-auto">
      {files.map((sf, i) => (
        <div key={i} className="relative flex-shrink-0 rounded border bg-gray-50 p-2">
          {sf.preview ? (
            <img src={sf.preview} alt="" className="h-16 w-16 rounded object-cover" />
          ) : (
            <div className="flex h-16 w-16 flex-col items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="mt-0.5 max-w-[60px] truncate text-[10px] text-gray-500">{sf.file.name}</span>
            </div>
          )}
          <span className="mt-1 block text-center text-[10px] text-gray-400">{formatFileSize(sf.file.size)}</span>
          <button
            onClick={() => onRemove(i)}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-white hover:bg-gray-800"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
