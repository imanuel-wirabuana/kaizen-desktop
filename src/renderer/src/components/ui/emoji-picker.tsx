"use client";

import {
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
  EmojiPicker as EmojiPickerPrimitive,
} from "frimousse";
import { LoaderIcon, SearchIcon, Smile, Trash2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function EmojiPicker({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Root>) {
  return (
    <EmojiPickerPrimitive.Root
      className={cn(
        "bg-popover text-popover-foreground isolate flex h-full w-fit flex-col overflow-hidden rounded-md",
        className
      )}
      data-slot="emoji-picker"
      {...props}
    />
  );
}

function EmojiPickerSearch({
  className,
  placeholder = "Search emoji...",
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Search>) {
  return (
    <div
      className={cn("flex h-9 items-center gap-2 border-b px-3", className)}
      data-slot="emoji-picker-search-wrapper"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <EmojiPickerPrimitive.Search
        placeholder={placeholder}
        className="outline-hidden placeholder:text-muted-foreground flex h-9 w-full rounded-md bg-transparent py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        data-slot="emoji-picker-search"
        {...props}
      />
    </div>
  );
}

function EmojiPickerRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="scroll-my-1 px-1.5" data-slot="emoji-picker-row">
      {children}
    </div>
  );
}

function EmojiPickerEmoji({
  emoji,
  className,
  ...props
}: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      className={cn(
        "data-[active]:bg-accent hover:bg-accent/80 flex size-8 items-center justify-center rounded-md text-lg transition-colors cursor-pointer select-none",
        className
      )}
      data-slot="emoji-picker-emoji"
    >
      {emoji.emoji}
    </button>
  );
}

function EmojiPickerCategoryHeader({
  category,
  ...props
}: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-popover text-muted-foreground px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider leading-none"
      data-slot="emoji-picker-category-header"
    >
      {category.label}
    </div>
  );
}

function EmojiPickerContent({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Viewport>) {
  return (
    <EmojiPickerPrimitive.Viewport
      className={cn("outline-hidden relative flex-1 overflow-y-auto custom-scrollbar", className)}
      data-slot="emoji-picker-viewport"
      {...props}
    >
      <EmojiPickerPrimitive.Loading
        className="absolute inset-0 flex items-center justify-center text-muted-foreground"
        data-slot="emoji-picker-loading"
      >
        <LoaderIcon className="size-4 animate-spin" />
      </EmojiPickerPrimitive.Loading>
      <EmojiPickerPrimitive.Empty
        className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs"
        data-slot="emoji-picker-empty"
      >
        No emoji found.
      </EmojiPickerPrimitive.Empty>
      <EmojiPickerPrimitive.List
        className="select-none pb-1"
        components={{
          Row: EmojiPickerRow,
          Emoji: EmojiPickerEmoji,
          CategoryHeader: EmojiPickerCategoryHeader,
        }}
        data-slot="emoji-picker-list"
      />
    </EmojiPickerPrimitive.Viewport>
  );
}

function EmojiPickerFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-(--frimousse-viewport-width) flex w-full min-w-0 items-center justify-between gap-1 border-t p-2 bg-muted/20",
        className
      )}
      data-slot="emoji-picker-footer"
      {...props}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <EmojiPickerPrimitive.ActiveEmoji>
          {({ emoji }) =>
            emoji ? (
              <>
                <div className="flex size-8 flex-none items-center justify-center text-2xl">
                  {emoji.emoji}
                </div>
                <span className="text-foreground truncate text-xs font-medium capitalize">
                  {emoji.label}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground ml-1 flex h-8 items-center truncate text-xs">
                Select an emoji…
              </span>
            )
          }
        </EmojiPickerPrimitive.ActiveEmoji>
      </div>
      {children}
    </div>
  );
}

interface InlineEmojiPickerProps {
  value?: string | null;
  onChange: (emoji: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  trigger?: React.ReactElement;
  className?: string;
  pickerClassName?: string;
  title?: string;
  placeholder?: string;
}

function InlineEmojiPicker({
  value,
  onChange,
  onClear,
  disabled = false,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  trigger,
  className,
  pickerClassName,
  title = "Choose emoji",
  placeholder = "Search emoji...",
}: InlineEmojiPickerProps) {
  const [open, setOpen] = React.useState(false);

  if (disabled) {
    if (trigger) {
      return trigger;
    }
    return value ? (
      <span className={cn("text-base select-none", className)}>{value}</span>
    ) : null;
  }

  const defaultTrigger = value ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      className={cn(
        "flex size-7 items-center justify-center rounded-md hover:bg-muted/80 text-lg shrink-0 transition-transform active:scale-95 cursor-pointer",
        className
      )}
      title={title}
    >
      {value}
    </button>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      className={cn(
        "flex size-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-opacity shrink-0 cursor-pointer",
        className
      )}
      title={title}
    >
      <Smile className="size-3.5" />
    </button>
  );

  const activeTrigger = trigger
    ? React.cloneElement(trigger as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          (trigger.props as { onClick?: (e: React.MouseEvent) => void })?.onClick?.(e);
          setOpen(true);
        },
      })
    : defaultTrigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={activeTrigger} />
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="w-fit p-0 z-50"
      >
        <EmojiPicker
          className={cn("h-[342px]", pickerClassName)}
          onEmojiSelect={async ({ emoji }) => {
            await onChange(emoji);
            setOpen(false);
          }}
        >
          <EmojiPickerSearch placeholder={placeholder} />
          <EmojiPickerContent />
          <EmojiPickerFooter>
            {onClear && value ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onClear();
                  setOpen(false);
                }}
                className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer transition-colors shrink-0"
                title="Remove emoji"
              >
                <Trash2 className="size-3" />
                <span>Remove</span>
              </button>
            ) : null}
          </EmojiPickerFooter>
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
}

export {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerEmoji,
  EmojiPickerRow,
  EmojiPickerCategoryHeader,
  InlineEmojiPicker,
};
export type { InlineEmojiPickerProps };

