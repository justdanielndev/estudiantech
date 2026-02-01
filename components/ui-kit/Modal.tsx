import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function Modal({ open, onOpenChange, title, children, size = 'md' }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClass + ' rounded-xl shadow-xl p-0'}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold leading-snug px-6 pt-6">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
