'use client';

import * as React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResizablePanelGroup({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      orientation={orientation}
      className={cn('flex h-full w-full', orientation === 'vertical' ? 'flex-col' : '', className)}
      {...props}
    />
  );
}

export function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof Panel>) {
  return <Panel className={cn('relative', className)} {...props} />;
}

export function ResizableHandle({
  withHandle = true,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) {
  return (
    <Separator
      className={cn(
        'relative flex w-2 items-center justify-center bg-slate-200 hover:bg-indigo-300 active:bg-indigo-500 dark:bg-slate-800 dark:hover:bg-indigo-700 transition-colors cursor-col-resize focus-visible:outline-hidden',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-7 w-3.5 items-center justify-center rounded-sm border border-slate-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <GripVertical className="h-3 w-3 text-slate-500" />
        </div>
      )}
    </Separator>
  );
}
