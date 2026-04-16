import type { ComponentProps } from 'react';
import { Button as BaseButton, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type ButtonProps = ComponentProps<typeof BaseButton> & {
  processing?: boolean;
};

function Button({ processing = false, disabled, children, className, ...props }: ButtonProps) {
  return (
    <BaseButton disabled={processing || disabled} className={cn('relative', className)} {...props}>
      <span className={cn('inline-flex items-center gap-[inherit]', processing && 'opacity-0')}>
        {children}
      </span>
      {processing && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </BaseButton>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
