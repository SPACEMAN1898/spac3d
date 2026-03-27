declare module '@emoji-mart/data' {
  const data: unknown;
  export default data;
}

declare module '@emoji-mart/react' {
  import type { ComponentType } from 'react';
  interface PickerProps {
    data: unknown;
    onEmojiSelect: (emoji: { native: string; id: string }) => void;
    theme?: 'light' | 'dark' | 'auto';
    previewPosition?: 'top' | 'bottom' | 'none';
    skinTonePosition?: 'preview' | 'search' | 'none';
  }
  const Picker: ComponentType<PickerProps>;
  export default Picker;
}
