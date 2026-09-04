export type ThemePreset = {
  id: string
  label: string
  color: string
  style: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    label: 'Default',
    color: 'oklch(0.7686 0.1647 70.0804)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.2686 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.2686 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2686 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.9670 0.0029 264.5419);
  --secondary-foreground: oklch(0.4461 0.0263 256.8018);
  --muted: oklch(0.9846 0.0017 247.8389);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.9869 0.0214 95.2774);
  --accent-foreground: oklch(0.4732 0.1247 46.2007);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9276 0.0058 264.5313);
  --input: oklch(0.9276 0.0058 264.5313);
  --ring: oklch(0.7686 0.1647 70.0804);
  --chart-1: oklch(0.7686 0.1647 70.0804);
  --chart-2: oklch(0.6658 0.1574 58.3183);
  --chart-3: oklch(0.5553 0.1455 48.9975);
  --chart-4: oklch(0.4732 0.1247 46.2007);
  --chart-5: oklch(0.4137 0.1054 45.9038);
  --sidebar: oklch(0.9846 0.0017 247.8389);
  --sidebar-foreground: oklch(0.2686 0 0);
  --sidebar-primary: oklch(0.7686 0.1647 70.0804);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9869 0.0214 95.2774);
  --sidebar-accent-foreground: oklch(0.4732 0.1247 46.2007);
  --sidebar-border: oklch(0.9276 0.0058 264.5313);
  --sidebar-ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: -1px;
  --shadow-opacity: 0.1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2046 0 0);
  --foreground: oklch(0.9219 0 0);
  --card: oklch(0.2686 0 0);
  --card-foreground: oklch(0.9219 0 0);
  --popover: oklch(0.2686 0 0);
  --popover-foreground: oklch(0.9219 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.2686 0 0);
  --secondary-foreground: oklch(0.9219 0 0);
  --muted: oklch(0.2393 0 0);
  --muted-foreground: oklch(0.7155 0 0);
  --accent: oklch(0.4732 0.1247 46.2007);
  --accent-foreground: oklch(0.9243 0.1151 95.7459);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3715 0 0);
  --input: oklch(0.3715 0 0);
  --ring: oklch(0.7686 0.1647 70.0804);
  --chart-1: oklch(0.8369 0.1644 84.4286);
  --chart-2: oklch(0.6658 0.1574 58.3183);
  --chart-3: oklch(0.4732 0.1247 46.2007);
  --chart-4: oklch(0.5553 0.1455 48.9975);
  --chart-5: oklch(0.4732 0.1247 46.2007);
  --sidebar: oklch(0.1684 0 0);
  --sidebar-foreground: oklch(0.9219 0 0);
  --sidebar-primary: oklch(0.7686 0.1647 70.0804);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.4732 0.1247 46.2007);
  --sidebar-accent-foreground: oklch(0.9243 0.1151 95.7459);
  --sidebar-border: oklch(0.3715 0 0);
  --sidebar-ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: -1px;
  --shadow-opacity: 0.1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  },
  {
    id: 'neo-brutalism',
    label: 'Neo Brutalism',
    color: 'oklch(0.6489 0.2370 26.9728)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6489 0.2370 26.9728);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9680 0.2110 109.7692);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.9551 0 0);
  --muted-foreground: oklch(0.3211 0 0);
  --accent: oklch(0.5635 0.2408 260.8178);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0 0 0);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0 0 0);
  --ring: oklch(0.6489 0.2370 26.9728);
  --chart-1: oklch(0.6489 0.2370 26.9728);
  --chart-2: oklch(0.9680 0.2110 109.7692);
  --chart-3: oklch(0.5635 0.2408 260.8178);
  --chart-4: oklch(0.7323 0.2492 142.4953);
  --chart-5: oklch(0.5931 0.2726 328.3634);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.6489 0.2370 26.9728);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5635 0.2408 260.8178);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.6489 0.2370 26.9728);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-x: 4px;
  --shadow-y: 4px;
  --shadow-blur: 0px;
  --shadow-spread: 0px;
  --shadow-opacity: 1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(1.0000 0 0);
  --card: oklch(0.3211 0 0);
  --card-foreground: oklch(1.0000 0 0);
  --popover: oklch(0.3211 0 0);
  --popover-foreground: oklch(1.0000 0 0);
  --primary: oklch(0.7044 0.1872 23.1858);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.9691 0.2005 109.6228);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.2178 0 0);
  --muted-foreground: oklch(0.8452 0 0);
  --accent: oklch(0.6755 0.1765 252.2592);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(1.0000 0 0);
  --destructive-foreground: oklch(0 0 0);
  --border: oklch(1.0000 0 0);
  --input: oklch(1.0000 0 0);
  --ring: oklch(0.7044 0.1872 23.1858);
  --chart-1: oklch(0.7044 0.1872 23.1858);
  --chart-2: oklch(0.9691 0.2005 109.6228);
  --chart-3: oklch(0.6755 0.1765 252.2592);
  --chart-4: oklch(0.7395 0.2268 142.8504);
  --chart-5: oklch(0.6131 0.2458 328.0714);
  --sidebar: oklch(0 0 0);
  --sidebar-foreground: oklch(1.0000 0 0);
  --sidebar-primary: oklch(0.7044 0.1872 23.1858);
  --sidebar-primary-foreground: oklch(0 0 0);
  --sidebar-accent: oklch(0.6755 0.1765 252.2592);
  --sidebar-accent-foreground: oklch(0 0 0);
  --sidebar-border: oklch(1.0000 0 0);
  --sidebar-ring: oklch(0.7044 0.1872 23.1858);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-x: 4px;
  --shadow-y: 4px;
  --shadow-blur: 0px;
  --shadow-spread: 0px;
  --shadow-opacity: 1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  },
  {
    id: 'catppuccin',
    label: 'Catppuccin',
    color: 'oklch(0.5547 0.2503 297.0156)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.9578 0.0058 264.5321);
  --foreground: oklch(0.4355 0.0430 279.3250);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.4355 0.0430 279.3250);
  --popover: oklch(0.8575 0.0145 268.4756);
  --popover-foreground: oklch(0.4355 0.0430 279.3250);
  --primary: oklch(0.5547 0.2503 297.0156);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.8575 0.0145 268.4756);
  --secondary-foreground: oklch(0.4355 0.0430 279.3250);
  --muted: oklch(0.9060 0.0117 264.5071);
  --muted-foreground: oklch(0.5471 0.0343 279.0837);
  --accent: oklch(0.6820 0.1448 235.3822);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0.5505 0.2155 19.8095);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8083 0.0174 271.1982);
  --input: oklch(0.8575 0.0145 268.4756);
  --ring: oklch(0.5547 0.2503 297.0156);
  --chart-1: oklch(0.5547 0.2503 297.0156);
  --chart-2: oklch(0.6820 0.1448 235.3822);
  --chart-3: oklch(0.6250 0.1772 140.4448);
  --chart-4: oklch(0.6920 0.2041 42.4293);
  --chart-5: oklch(0.7141 0.1045 33.0967);
  --sidebar: oklch(0.9335 0.0087 264.5206);
  --sidebar-foreground: oklch(0.4355 0.0430 279.3250);
  --sidebar-primary: oklch(0.5547 0.2503 297.0156);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.6820 0.1448 235.3822);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0.8083 0.0174 271.1982);
  --sidebar-ring: oklch(0.5547 0.2503 297.0156);
  --font-sans: Montserrat, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.35rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 6px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.12;
  --shadow-color: hsl(240 30% 25%);
  --shadow-2xs: 0px 4px 6px 0px hsl(240 30% 25% / 0.06);
  --shadow-xs: 0px 4px 6px 0px hsl(240 30% 25% / 0.06);
  --shadow-sm: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 1px 2px -1px hsl(240 30% 25% / 0.12);
  --shadow: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 1px 2px -1px hsl(240 30% 25% / 0.12);
  --shadow-md: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 2px 4px -1px hsl(240 30% 25% / 0.12);
  --shadow-lg: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 4px 6px -1px hsl(240 30% 25% / 0.12);
  --shadow-xl: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 8px 10px -1px hsl(240 30% 25% / 0.12);
  --shadow-2xl: 0px 4px 6px 0px hsl(240 30% 25% / 0.30);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2155 0.0254 284.0647);
  --foreground: oklch(0.8787 0.0426 272.2767);
  --card: oklch(0.2429 0.0304 283.9110);
  --card-foreground: oklch(0.8787 0.0426 272.2767);
  --popover: oklch(0.4037 0.0320 280.1520);
  --popover-foreground: oklch(0.8787 0.0426 272.2767);
  --primary: oklch(0.7871 0.1187 304.7693);
  --primary-foreground: oklch(0.2429 0.0304 283.9110);
  --secondary: oklch(0.4765 0.0340 278.6430);
  --secondary-foreground: oklch(0.8787 0.0426 272.2767);
  --muted: oklch(0.2973 0.0294 276.2144);
  --muted-foreground: oklch(0.7510 0.0396 273.9320);
  --accent: oklch(0.8467 0.0833 210.2545);
  --accent-foreground: oklch(0.2429 0.0304 283.9110);
  --destructive: oklch(0.7556 0.1297 2.7642);
  --destructive-foreground: oklch(0.2429 0.0304 283.9110);
  --border: oklch(0.3240 0.0319 281.9784);
  --input: oklch(0.3240 0.0319 281.9784);
  --ring: oklch(0.7871 0.1187 304.7693);
  --chart-1: oklch(0.7871 0.1187 304.7693);
  --chart-2: oklch(0.8467 0.0833 210.2545);
  --chart-3: oklch(0.8577 0.1092 142.7153);
  --chart-4: oklch(0.8237 0.1015 52.6294);
  --chart-5: oklch(0.9226 0.0238 30.4919);
  --sidebar: oklch(0.1828 0.0204 284.2039);
  --sidebar-foreground: oklch(0.8787 0.0426 272.2767);
  --sidebar-primary: oklch(0.7871 0.1187 304.7693);
  --sidebar-primary-foreground: oklch(0.2429 0.0304 283.9110);
  --sidebar-accent: oklch(0.8467 0.0833 210.2545);
  --sidebar-accent-foreground: oklch(0.2429 0.0304 283.9110);
  --sidebar-border: oklch(0.4037 0.0320 280.1520);
  --sidebar-ring: oklch(0.7871 0.1187 304.7693);
  --font-sans: Montserrat, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.35rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 6px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.12;
  --shadow-color: hsl(240 30% 25%);
  --shadow-2xs: 0px 4px 6px 0px hsl(240 30% 25% / 0.06);
  --shadow-xs: 0px 4px 6px 0px hsl(240 30% 25% / 0.06);
  --shadow-sm: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 1px 2px -1px hsl(240 30% 25% / 0.12);
  --shadow: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 1px 2px -1px hsl(240 30% 25% / 0.12);
  --shadow-md: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 2px 4px -1px hsl(240 30% 25% / 0.12);
  --shadow-lg: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 4px 6px -1px hsl(240 30% 25% / 0.12);
  --shadow-xl: 0px 4px 6px 0px hsl(240 30% 25% / 0.12), 0px 8px 10px -1px hsl(240 30% 25% / 0.12);
  --shadow-2xl: 0px 4px 6px 0px hsl(240 30% 25% / 0.30);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  },
  {
    id: 'claude',
    label: 'Claude',
    color: 'oklch(0.6171 0.1375 39.0427)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  --card: oklch(0.9665 0.0067 97.3521);
  --card-foreground: oklch(0.1908 0.0020 106.5859);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2671 0.0196 98.9390);
  --primary: oklch(0.6171 0.1375 39.0427);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9245 0.0138 92.9892);
  --secondary-foreground: oklch(0.4334 0.0177 98.6048);
  --muted: oklch(0.9341 0.0153 90.2390);
  --muted-foreground: oklch(0.5341 0.0078 97.4503);
  --accent: oklch(0.9245 0.0138 92.9892);
  --accent-foreground: oklch(0.2671 0.0196 98.9390);
  --destructive: oklch(0.1908 0.0020 106.5859);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8847 0.0069 97.3627);
  --input: oklch(0.7621 0.0156 98.3528);
  --ring: oklch(0.6171 0.1375 39.0427);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.8816 0.0276 93.1280);
  --chart-4: oklch(0.8822 0.0403 298.1792);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.9663 0.0080 98.8792);
  --sidebar-foreground: oklch(0.3590 0.0051 106.6524);
  --sidebar-primary: oklch(0.6171 0.1375 39.0427);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.9245 0.0138 92.9892);
  --sidebar-accent-foreground: oklch(0.3250 0 0);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;
  --radius: 1rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2679 0.0036 106.6427);
  --foreground: oklch(0.9576 0.0027 106.4494);
  --card: oklch(0.2928 0.0018 106.5092);
  --card-foreground: oklch(0.9818 0.0054 95.0986);
  --popover: oklch(0.3085 0.0035 106.6039);
  --popover-foreground: oklch(0.9211 0.0040 106.4781);
  --primary: oklch(0.6724 0.1308 38.7559);
  --primary-foreground: oklch(0.1908 0.0020 106.5859);
  --secondary: oklch(0.9818 0.0054 95.0986);
  --secondary-foreground: oklch(0.3085 0.0035 106.6039);
  --muted: oklch(0.2213 0.0038 106.7070);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --accent: oklch(0.2130 0.0078 95.4245);
  --accent-foreground: oklch(0.9663 0.0080 98.8792);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.2130 0.0078 95.4245);
  --chart-4: oklch(0.3074 0.0516 289.3230);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.2357 0.0024 67.7077);
  --sidebar-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-primary: oklch(0.3250 0 0);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.1680 0.0020 106.6177);
  --sidebar-accent-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;
  --radius: 1rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  },
  {
    id: 'whatsapp',
    label: 'Whatsapp',
    color: 'oklch(0.4335 0.0754 182.2315)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.9605 0.0046 258.3248);
  --foreground: oklch(0.2153 0.0187 235.1251);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.2153 0.0187 235.1251);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2153 0.0187 235.1251);
  --primary: oklch(0.4335 0.0754 182.2315);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9644 0.0208 166.1014);
  --secondary-foreground: oklch(0.4335 0.0754 182.2315);
  --muted: oklch(0.9605 0.0046 258.3248);
  --muted-foreground: oklch(0.5589 0.0255 233.7233);
  --accent: oklch(0.7610 0.2015 149.7403);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0.6257 0.2058 29.0773);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9436 0.0051 228.8204);
  --input: oklch(0.9436 0.0051 228.8204);
  --ring: oklch(0.7610 0.2015 149.7403);
  --chart-1: oklch(0.7610 0.2015 149.7403);
  --chart-2: oklch(0.4335 0.0754 182.2315);
  --chart-3: oklch(0.5762 0.0995 182.3964);
  --chart-4: oklch(0.7356 0.1370 232.8053);
  --chart-5: oklch(0.6509 0.1283 170.4258);
  --sidebar: oklch(1.0000 0 0);
  --sidebar-foreground: oklch(0.2153 0.0187 235.1251);
  --sidebar-primary: oklch(0.4335 0.0754 182.2315);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9644 0.0208 166.1014);
  --sidebar-accent-foreground: oklch(0.4335 0.0754 182.2315);
  --sidebar-border: oklch(0.9436 0.0051 228.8204);
  --sidebar-ring: oklch(0.7610 0.2015 149.7403);
  --font-sans: Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  --radius: 1rem;
  --shadow-x: 0px;
  --shadow-y: 2px;
  --shadow-blur: 10px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: rgba(0,0,0,0.1);
  --shadow-2xs: 0px 2px 10px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 2px 10px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 2px 10px 0px hsl(0 0% 0% / 0.10), 0px 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0px 2px 10px 0px hsl(0 0% 0% / 0.10), 0px 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 2px 10px 0px hsl(0 0% 0% / 0.10), 0px 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 2px 10px 0px hsl(0 0% 0% / 0.10), 0px 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 2px 10px 0px hsl(0 0% 0% / 0.10), 0px 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 2px 10px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1854 0.0182 238.2143);
  --foreground: oklch(0.9436 0.0051 228.8204);
  --card: oklch(0.2848 0.0230 235.6578);
  --card-foreground: oklch(0.9436 0.0051 228.8204);
  --popover: oklch(0.2848 0.0230 235.6578);
  --popover-foreground: oklch(0.9436 0.0051 228.8204);
  --primary: oklch(0.6509 0.1283 170.4258);
  --primary-foreground: oklch(0.2153 0.0187 235.1251);
  --secondary: oklch(0.2933 0.0423 172.8195);
  --secondary-foreground: oklch(0.6509 0.1283 170.4258);
  --muted: oklch(0.2456 0.0195 239.1061);
  --muted-foreground: oklch(0.6637 0.0236 235.1968);
  --accent: oklch(0.7610 0.2015 149.7403);
  --accent-foreground: oklch(0.2153 0.0187 235.1251);
  --destructive: oklch(0.6257 0.2058 29.0773);
  --destructive-foreground: oklch(0.9436 0.0051 228.8204);
  --border: oklch(0.3351 0.0253 234.8586);
  --input: oklch(0.3351 0.0253 234.8586);
  --ring: oklch(0.6509 0.1283 170.4258);
  --chart-1: oklch(0.7610 0.2015 149.7403);
  --chart-2: oklch(0.6509 0.1283 170.4258);
  --chart-3: oklch(0.5762 0.0995 182.3964);
  --chart-4: oklch(0.7356 0.1370 232.8053);
  --chart-5: oklch(0.4335 0.0754 182.2315);
  --sidebar: oklch(0.2153 0.0187 235.1251);
  --sidebar-foreground: oklch(0.9436 0.0051 228.8204);
  --sidebar-primary: oklch(0.6509 0.1283 170.4258);
  --sidebar-primary-foreground: oklch(0.2153 0.0187 235.1251);
  --sidebar-accent: oklch(0.2933 0.0423 172.8195);
  --sidebar-accent-foreground: oklch(0.6509 0.1283 170.4258);
  --sidebar-border: oklch(0.3351 0.0253 234.8586);
  --sidebar-ring: oklch(0.6509 0.1283 170.4258);
  --font-sans: Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  --radius: 1rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 12px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.4;
  --shadow-color: rgba(0,0,0,0.4);
  --shadow-2xs: 0px 4px 12px 0px hsl(0 0% 0% / 0.20);
  --shadow-xs: 0px 4px 12px 0px hsl(0 0% 0% / 0.20);
  --shadow-sm: 0px 4px 12px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40);
  --shadow: 0px 4px 12px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40);
  --shadow-md: 0px 4px 12px 0px hsl(0 0% 0% / 0.40), 0px 2px 4px -1px hsl(0 0% 0% / 0.40);
  --shadow-lg: 0px 4px 12px 0px hsl(0 0% 0% / 0.40), 0px 4px 6px -1px hsl(0 0% 0% / 0.40);
  --shadow-xl: 0px 4px 12px 0px hsl(0 0% 0% / 0.40), 0px 8px 10px -1px hsl(0 0% 0% / 0.40);
  --shadow-2xl: 0px 4px 12px 0px hsl(0 0% 0% / 1.00);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  },
  {
    id: 'discord',
    label: 'Discord',
    color: 'oklch(0.5772 0.2129 274)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.9940 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1 0 180);
  --card-foreground: oklch(0.2560 0 180);
  --popover: oklch(1 0 180);
  --popover-foreground: oklch(0.2560 0 180);
  --primary: oklch(0.5772 0.2129 274);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(0.8880 0 172.4050);
  --secondary-foreground: oklch(0.2160 0 180);
  --muted: oklch(0.9612 0 0);
  --muted-foreground: oklch(0.6050 0 180);
  --accent: oklch(0.7037 0.1568 277.9576);
  --accent-foreground: oklch(1 0 180);
  --destructive: oklch(0.6540 0.2320 28.6600);
  --destructive-foreground: oklch(1 0 180);
  --border: oklch(0.9401 0 0);
  --input: oklch(0.8510 0 180);
  --ring: oklch(0.6830 0 180);
  --chart-1: oklch(0.5772 0.2129 274);
  --chart-2: oklch(0.8726 0.0593 270.4500);
  --chart-3: oklch(0.6792 0.1659 272.9200);
  --chart-4: oklch(0.9310 0.0312 269.6900);
  --chart-5: oklch(0.7896 0.1050 270.5900);
  --sidebar: oklch(0.9761 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.5772 0.2129 274);
  --sidebar-primary-foreground: oklch(1 0 180);
  --sidebar-accent: oklch(0.7037 0.1568 277.9576);
  --sidebar-accent-foreground: oklch(1 0 180);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.6830 0 180);
  --font-sans: Google Sans Flex, ui-sans-serif, sans-serif, system-ui;
  --font-serif: Google Sans Flex, ui-sans-serif, sans-serif, system-ui;
  --font-mono: Source Code Pro, ui-monospace, monospace;
  --radius: 0.75rem;
  --shadow-x: 0;
  --shadow-y: 8px;
  --shadow-blur: 12px;
  --shadow-spread: 2px;
  --shadow-opacity: 0.005;
  --shadow-color: #000000;
  --shadow-2xs: 0 8px 12px 2px hsl(0 0% 0% / 0.00);
  --shadow-xs: 0 8px 12px 2px hsl(0 0% 0% / 0.00);
  --shadow-sm: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 1px 2px 1px hsl(0 0% 0% / 0.01);
  --shadow: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 1px 2px 1px hsl(0 0% 0% / 0.01);
  --shadow-md: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 2px 4px 1px hsl(0 0% 0% / 0.01);
  --shadow-lg: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 4px 6px 1px hsl(0 0% 0% / 0.01);
  --shadow-xl: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 8px 10px 1px hsl(0 0% 0% / 0.01);
  --shadow-2xl: 0 8px 12px 2px hsl(0 0% 0% / 0.01);
  --tracking-normal: 0em;
  --spacing: 0.275rem;
}

.dark {
  --background: oklch(0.2195 0.0077 285.7400);
  --foreground: oklch(0.9881 0 0);
  --card: oklch(0.2624 0.0093 285.7400);
  --card-foreground: oklch(0.9881 0 0);
  --popover: oklch(0.2460 0.0070 248.1220);
  --popover-foreground: oklch(0.9830 0.0040 348.8510);
  --primary: oklch(0.5774 0.2091 273.8500);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.8880 0 172.4050);
  --secondary-foreground: oklch(0.2160 0 180);
  --muted: oklch(0.2387 0.0114 293.1598);
  --muted-foreground: oklch(0.6890 0 164.0550);
  --accent: oklch(0.6615 0.1490 277.6548);
  --accent-foreground: oklch(1 0 180);
  --destructive: oklch(0.5880 0.1990 24.3930);
  --destructive-foreground: oklch(1 0 180);
  --border: oklch(0.3089 0.0038 264.5091);
  --input: oklch(0.2568 0.0076 274.6500);
  --ring: oklch(0.7157 0.1532 235.7100);
  --chart-1: oklch(0.5772 0.2129 274);
  --chart-2: oklch(0.8726 0.0593 270.4500);
  --chart-3: oklch(0.6792 0.1659 272.9200);
  --chart-4: oklch(0.9310 0.0312 269.6900);
  --chart-5: oklch(0.7896 0.1050 270.5900);
  --sidebar: oklch(0.2452 0.0075 285.8300);
  --sidebar-foreground: oklch(0.9881 0 0);
  --sidebar-primary: oklch(0.5774 0.2091 273.8500);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.6615 0.1490 277.6548);
  --sidebar-accent-foreground: oklch(1 0 180);
  --sidebar-border: oklch(0.3089 0.0038 264.5091);
  --sidebar-ring: oklch(0.7157 0.1532 235.7100);
  --font-sans: Google Sans Flex, ui-sans-serif, sans-serif, system-ui;
  --font-serif: Google Sans Flex, ui-sans-serif, sans-serif, system-ui;
  --font-mono: Source Code Pro, ui-monospace, monospace;
  --radius: 0.75rem;
  --shadow-x: 0;
  --shadow-y: 8px;
  --shadow-blur: 12px;
  --shadow-spread: 2px;
  --shadow-opacity: 0.005;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 8px 12px 2px hsl(0 0% 0% / 0.00);
  --shadow-xs: 0 8px 12px 2px hsl(0 0% 0% / 0.00);
  --shadow-sm: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 1px 2px 1px hsl(0 0% 0% / 0.01);
  --shadow: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 1px 2px 1px hsl(0 0% 0% / 0.01);
  --shadow-md: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 2px 4px 1px hsl(0 0% 0% / 0.01);
  --shadow-lg: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 4px 6px 1px hsl(0 0% 0% / 0.01);
  --shadow-xl: 0 8px 12px 2px hsl(0 0% 0% / 0.01), 0 8px 10px 1px hsl(0 0% 0% / 0.01);
  --shadow-2xl: 0 8px 12px 2px hsl(0 0% 0% / 0.01);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  },
  {
    id: 'optimus',
    label: 'Optimus',
    color: 'oklch(0.5412 0.2127 24.7912)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.2500 0.0112 254.0422);
  --foreground: oklch(0.8717 0.0093 258.3382);
  --card: oklch(0.2212 0.0108 260.6784);
  --card-foreground: oklch(0.8717 0.0093 258.3382);
  --popover: oklch(0.2212 0.0108 260.6784);
  --popover-foreground: oklch(0.8717 0.0093 258.3382);
  --primary: oklch(0.5412 0.2127 24.7912);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.4244 0.1809 265.6377);
  --secondary-foreground: oklch(1.0000 0 0);
  --muted: oklch(0.3186 0.0165 255.6397);
  --muted-foreground: oklch(0.7137 0.0192 261.3246);
  --accent: oklch(0.6658 0.1574 58.3183);
  --accent-foreground: oklch(0.2212 0.0108 260.6784);
  --destructive: oklch(0.4437 0.1613 26.8994);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3729 0.0306 259.7328);
  --input: oklch(0.2212 0.0108 260.6784);
  --ring: oklch(0.5412 0.2127 24.7912);
  --chart-1: oklch(0.5412 0.2127 24.7912);
  --chart-2: oklch(0.4244 0.1809 265.6377);
  --chart-3: oklch(0.6658 0.1574 58.3183);
  --chart-4: oklch(0.4461 0.0263 256.8018);
  --chart-5: oklch(0.4907 0.2412 292.5809);
  --sidebar: oklch(0.2212 0.0108 260.6784);
  --sidebar-foreground: oklch(0.8717 0.0093 258.3382);
  --sidebar-primary: oklch(0.5412 0.2127 24.7912);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.3186 0.0165 255.6397);
  --sidebar-accent-foreground: oklch(0.6658 0.1574 58.3183);
  --sidebar-border: oklch(0.3729 0.0306 259.7328);
  --sidebar-ring: oklch(0.5412 0.2127 24.7912);
  --font-sans: 'Orbitron', sans-serif;
  --font-serif: 'Georgia', serif;
  --font-mono: 'Share Tech Mono', monospace;
  --radius: 0rem;
  --shadow-x: 2px;
  --shadow-y: 2px;
  --shadow-blur: 12px;
  --shadow-spread: 2px;
  --shadow-opacity: 0.5;
  --shadow-color: #000000;
  --shadow-2xs: 2px 2px 12px 2px hsl(0 0% 0% / 0.25);
  --shadow-xs: 2px 2px 12px 2px hsl(0 0% 0% / 0.25);
  --shadow-sm: 2px 2px 12px 2px hsl(0 0% 0% / 0.50), 2px 1px 2px 1px hsl(0 0% 0% / 0.50);
  --shadow: 2px 2px 12px 2px hsl(0 0% 0% / 0.50), 2px 1px 2px 1px hsl(0 0% 0% / 0.50);
  --shadow-md: 2px 2px 12px 2px hsl(0 0% 0% / 0.50), 2px 2px 4px 1px hsl(0 0% 0% / 0.50);
  --shadow-lg: 2px 2px 12px 2px hsl(0 0% 0% / 0.50), 2px 4px 6px 1px hsl(0 0% 0% / 0.50);
  --shadow-xl: 2px 2px 12px 2px hsl(0 0% 0% / 0.50), 2px 8px 10px 1px hsl(0 0% 0% / 0.50);
  --shadow-2xl: 2px 2px 12px 2px hsl(0 0% 0% / 1.25);
  --tracking-normal: 0.1em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1773 0.0089 264.3183);
  --foreground: oklch(0.9276 0.0058 264.5313);
  --card: oklch(0.2086 0.0128 264.2461);
  --card-foreground: oklch(0.9276 0.0058 264.5313);
  --popover: oklch(0.2086 0.0128 264.2461);
  --popover-foreground: oklch(0.9276 0.0058 264.5313);
  --primary: oklch(0.5771 0.2152 27.3250);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.5461 0.2152 262.8809);
  --secondary-foreground: oklch(1.0000 0 0);
  --muted: oklch(0.2875 0.0163 259.7887);
  --muted-foreground: oklch(0.7137 0.0192 261.3246);
  --accent: oklch(0.7686 0.1647 70.0804);
  --accent-foreground: oklch(0.1773 0.0089 264.3183);
  --destructive: oklch(0.5054 0.1905 27.5181);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3230 0.0219 259.3809);
  --input: oklch(0.1773 0.0089 264.3183);
  --ring: oklch(0.5771 0.2152 27.3250);
  --chart-1: oklch(0.5771 0.2152 27.3250);
  --chart-2: oklch(0.5461 0.2152 262.8809);
  --chart-3: oklch(0.7686 0.1647 70.0804);
  --chart-4: oklch(0.3729 0.0306 259.7328);
  --chart-5: oklch(0.5413 0.2466 293.0090);
  --sidebar: oklch(0.2086 0.0128 264.2461);
  --sidebar-foreground: oklch(0.9276 0.0058 264.5313);
  --sidebar-primary: oklch(0.5771 0.2152 27.3250);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.1773 0.0089 264.3183);
  --sidebar-accent-foreground: oklch(0.7686 0.1647 70.0804);
  --sidebar-border: oklch(0.3230 0.0219 259.3809);
  --sidebar-ring: oklch(0.5771 0.2152 27.3250);
  --font-sans: 'Orbitron', sans-serif;
  --font-serif: 'Georgia', serif;
  --font-mono: 'Share Tech Mono', monospace;
  --radius: 0rem;
  --shadow-x: 4px;
  --shadow-y: 4px;
  --shadow-blur: 20px;
  --shadow-spread: 4px;
  --shadow-opacity: 0.8;
  --shadow-color: #000000;
  --shadow-2xs: 4px 4px 20px 4px hsl(0 0% 0% / 0.40);
  --shadow-xs: 4px 4px 20px 4px hsl(0 0% 0% / 0.40);
  --shadow-sm: 4px 4px 20px 4px hsl(0 0% 0% / 0.80), 4px 1px 2px 3px hsl(0 0% 0% / 0.80);
  --shadow: 4px 4px 20px 4px hsl(0 0% 0% / 0.80), 4px 1px 2px 3px hsl(0 0% 0% / 0.80);
  --shadow-md: 4px 4px 20px 4px hsl(0 0% 0% / 0.80), 4px 2px 4px 3px hsl(0 0% 0% / 0.80);
  --shadow-lg: 4px 4px 20px 4px hsl(0 0% 0% / 0.80), 4px 4px 6px 3px hsl(0 0% 0% / 0.80);
  --shadow-xl: 4px 4px 20px 4px hsl(0 0% 0% / 0.80), 4px 8px 10px 3px hsl(0 0% 0% / 0.80);
  --shadow-2xl: 4px 4px 20px 4px hsl(0 0% 0% / 2.00);
  --tracking-normal: 0.1em;
  --spacing: 0.25rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);

  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    letter-spacing: var(--tracking-normal);
  }
}
`
  },
  {
    id: 'terminal',
    label: 'Terminal',
    color: 'oklch(0.8686 0.2776 144.4661)',
    style: `
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0 0 0);
  --foreground: oklch(0.8686 0.2776 144.4661);
  --card: oklch(0.1149 0 0);
  --card-foreground: oklch(0.8686 0.2776 144.4661);
  --popover: oklch(0 0 0);
  --popover-foreground: oklch(0.8686 0.2776 144.4661);
  --primary: oklch(0.8686 0.2776 144.4661);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.3053 0.1039 142.4953);
  --secondary-foreground: oklch(0.8686 0.2776 144.4661);
  --muted: oklch(0.1887 0.0642 142.4953);
  --muted-foreground: oklch(0.5638 0.1872 143.2450);
  --accent: oklch(0.8686 0.2776 144.4661);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(0.6280 0.2577 29.2339);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3053 0.1039 142.4953);
  --input: oklch(0 0 0);
  --ring: oklch(0.8686 0.2776 144.4661);
  --chart-1: oklch(0.8686 0.2776 144.4661);
  --chart-2: oklch(0.5638 0.1872 143.2450);
  --chart-3: oklch(0.3053 0.1039 142.4953);
  --chart-4: oklch(0.1179 0.0327 343.3438);
  --chart-5: oklch(0.8686 0.2776 144.4661);
  --sidebar: oklch(0.1149 0 0);
  --sidebar-foreground: oklch(0.8686 0.2776 144.4661);
  --sidebar-primary: oklch(0.8686 0.2776 144.4661);
  --sidebar-primary-foreground: oklch(0 0 0);
  --sidebar-accent: oklch(0.3053 0.1039 142.4953);
  --sidebar-accent-foreground: oklch(0.8686 0.2776 144.4661);
  --sidebar-border: oklch(0.3053 0.1039 142.4953);
  --sidebar-ring: oklch(0.8686 0.2776 144.4661);
  --font-sans: "VT323", "Courier New", monospace;
  --font-serif: Georgia, serif;
  --font-mono: "VT323", monospace;
  --radius: 0rem;
  --shadow-x: 0px;
  --shadow-y: 0px;
  --shadow-blur: 10px;
  --shadow-spread: 1px;
  --shadow-opacity: 0.2;
  --shadow-color: #00FF41;
  --shadow-2xs: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.10);
  --shadow-xs: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.10);
  --shadow-sm: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.20), 0px 1px 2px 0px hsl(135.2941 100% 50% / 0.20);
  --shadow: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.20), 0px 1px 2px 0px hsl(135.2941 100% 50% / 0.20);
  --shadow-md: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.20), 0px 2px 4px 0px hsl(135.2941 100% 50% / 0.20);
  --shadow-lg: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.20), 0px 4px 6px 0px hsl(135.2941 100% 50% / 0.20);
  --shadow-xl: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.20), 0px 8px 10px 0px hsl(135.2941 100% 50% / 0.20);
  --shadow-2xl: 0px 0px 10px 1px hsl(135.2941 100% 50% / 0.50);
  --tracking-normal: 0.1em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(0.8686 0.2776 144.4661);
  --card: oklch(0.1149 0 0);
  --card-foreground: oklch(0.8686 0.2776 144.4661);
  --popover: oklch(0 0 0);
  --popover-foreground: oklch(0.8686 0.2776 144.4661);
  --primary: oklch(0.8686 0.2776 144.4661);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.3053 0.1039 142.4953);
  --secondary-foreground: oklch(0.8686 0.2776 144.4661);
  --muted: oklch(0.1887 0.0642 142.4953);
  --muted-foreground: oklch(0.5638 0.1872 143.2450);
  --accent: oklch(0.8686 0.2776 144.4661);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(0.6280 0.2577 29.2339);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3053 0.1039 142.4953);
  --input: oklch(0 0 0);
  --ring: oklch(0.8686 0.2776 144.4661);
  --chart-1: oklch(0.8686 0.2776 144.4661);
  --chart-2: oklch(0.5638 0.1872 143.2450);
  --chart-3: oklch(0.3053 0.1039 142.4953);
  --chart-4: oklch(0.1179 0.0327 343.3438);
  --chart-5: oklch(0.8686 0.2776 144.4661);
  --sidebar: oklch(0.1149 0 0);
  --sidebar-foreground: oklch(0.8686 0.2776 144.4661);
  --sidebar-primary: oklch(0.8686 0.2776 144.4661);
  --sidebar-primary-foreground: oklch(0 0 0);
  --sidebar-accent: oklch(0.3053 0.1039 142.4953);
  --sidebar-accent-foreground: oklch(0.8686 0.2776 144.4661);
  --sidebar-border: oklch(0.3053 0.1039 142.4953);
  --sidebar-ring: oklch(0.8686 0.2776 144.4661);
  --font-sans: "VT323", "Courier New", monospace;
  --font-serif: Georgia, serif;
  --font-mono: "VT323", monospace;
  --radius: 0rem;
  --shadow-x: 0px;
  --shadow-y: 0px;
  --shadow-blur: 15px;
  --shadow-spread: 2px;
  --shadow-opacity: 0.4;
  --shadow-color: #00FF41;
  --shadow-2xs: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.20);
  --shadow-xs: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.20);
  --shadow-sm: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.40), 0px 1px 2px 1px hsl(135.2941 100% 50% / 0.40);
  --shadow: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.40), 0px 1px 2px 1px hsl(135.2941 100% 50% / 0.40);
  --shadow-md: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.40), 0px 2px 4px 1px hsl(135.2941 100% 50% / 0.40);
  --shadow-lg: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.40), 0px 4px 6px 1px hsl(135.2941 100% 50% / 0.40);
  --shadow-xl: 0px 0px 15px 2px hsl(135.2941 100% 50% / 0.40), 0px 8px 10px 1px hsl(135.2941 100% 50% / 0.40);
  --shadow-2xl: 0px 0px 15px 2px hsl(135.2941 100% 50% / 1.00);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  }
]
