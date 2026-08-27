import type { ComponentProps } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'

type Appearance = NonNullable<
  ComponentProps<typeof ClerkProvider>['appearance']
>

export const clerkAppearance: Appearance = {
  cssLayerName: 'clerk',
  variables: {
    colorPrimary: 'var(--primary)',
    colorBackground: 'var(--background)',
    colorForeground: 'var(--foreground)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
  },
  elements: {
    card: {
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
    },
    formButtonPrimary: {
      backgroundColor: 'var(--primary)',
      color: 'var(--primary-foreground)',
      '&:hover': {
        backgroundColor:
          'color-mix(in oklch, var(--primary) 85%, var(--foreground))',
      },
    },
    input: {
      backgroundColor: 'var(--background)',
      borderColor: 'var(--input)',
      color: 'var(--foreground)',
    },
    dividerLine: {
      backgroundColor: 'var(--border)',
    },
    socialButtonsIconButton: {
      borderColor: 'var(--border)',
      '&:hover': {
        backgroundColor: 'var(--muted)',
      },
    },
    footerActionLink: {
      color: 'var(--primary)',
    },
  },
}
