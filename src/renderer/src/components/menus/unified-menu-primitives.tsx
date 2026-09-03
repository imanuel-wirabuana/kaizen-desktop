import * as React from 'react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu'

export type MenuVariant = 'dropdown' | 'context'

export const MenuVariantContext = React.createContext<MenuVariant>('dropdown')

export function useMenuVariant() {
  return React.useContext(MenuVariantContext)
}

export function MenuProvider({
  variant,
  children
}: {
  variant: MenuVariant
  children: React.ReactNode
}) {
  return <MenuVariantContext.Provider value={variant}>{children}</MenuVariantContext.Provider>
}

export function MenuItem({
  variant: propVariant,
  disabled,
  onClick,
  className,
  children,
  destructive
}: {
  variant?: MenuVariant
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  children: React.ReactNode
  destructive?: boolean
}) {
  const contextVariant = useMenuVariant()
  const variant = propVariant || contextVariant

  if (variant === 'context') {
    return (
      <ContextMenuItem
        disabled={disabled}
        onClick={onClick}
        variant={destructive ? 'destructive' : 'default'}
        className={className}
      >
        {children}
      </ContextMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      disabled={disabled}
      onClick={onClick}
      variant={destructive ? 'destructive' : 'default'}
      className={className}
    >
      {children}
    </DropdownMenuItem>
  )
}

export function MenuSeparator({
  variant: propVariant,
  className
}: {
  variant?: MenuVariant
  className?: string
}) {
  const contextVariant = useMenuVariant()
  const variant = propVariant || contextVariant

  if (variant === 'context') {
    return <ContextMenuSeparator className={className} />
  }

  return <DropdownMenuSeparator className={className} />
}

export function MenuSub({
  variant: propVariant,
  children,
  ...props
}: {
  variant?: MenuVariant
  children: React.ReactNode
}) {
  const contextVariant = useMenuVariant()
  const variant = propVariant || contextVariant

  if (variant === 'context') {
    return <ContextMenuSub {...props}>{children}</ContextMenuSub>
  }

  return <DropdownMenuSub {...props}>{children}</DropdownMenuSub>
}

export function MenuSubTrigger({
  variant: propVariant,
  children,
  className
}: {
  variant?: MenuVariant
  children: React.ReactNode
  className?: string
}) {
  const contextVariant = useMenuVariant()
  const variant = propVariant || contextVariant

  if (variant === 'context') {
    return <ContextMenuSubTrigger className={className}>{children}</ContextMenuSubTrigger>
  }

  return <DropdownMenuSubTrigger className={className}>{children}</DropdownMenuSubTrigger>
}

export function MenuSubContent({
  variant: propVariant,
  children,
  className
}: {
  variant?: MenuVariant
  children: React.ReactNode
  className?: string
}) {
  const contextVariant = useMenuVariant()
  const variant = propVariant || contextVariant

  if (variant === 'context') {
    return <ContextMenuSubContent className={className}>{children}</ContextMenuSubContent>
  }

  return <DropdownMenuSubContent className={className}>{children}</DropdownMenuSubContent>
}
