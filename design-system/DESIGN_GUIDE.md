# TripPlanner Design System

## Brand Identity
- **App Feel:** Ultra-premium, modern, sophisticated like Airbnb
- **Target User:** Groups planning trips together (families, friends)
- **Design Philosophy:** Clean, spacious, professional, trustworthy

## Color Palette

### Primary Colors
- **Purple Gradient:** `bg-gradient-to-r from-purple-600 to-purple-700`
- **Purple Hover:** `hover:from-purple-700 hover:to-purple-800`
- **Dark Background:** `bg-gradient-to-br from-slate-900 to-slate-800`

### Text Colors
- **On Dark BG:** `text-white` (primary), `text-slate-300` (secondary), `text-slate-400` (tertiary)
- **On Light BG:** `text-slate-900` (primary), `text-slate-600` (secondary), `text-slate-400` (tertiary)

### UI Colors
- **Borders:** `border-slate-200` (light), `border-slate-700` (dark)
- **Backgrounds:** White cards on dark gradients
- **Success:** `text-green-600`, `bg-green-50`
- **Warning:** `text-amber-600`, `bg-amber-50`
- **Error:** `text-red-600`, `bg-red-50`

## Typography

### Font Family
- **All Text:** `font-inter` (already configured in Tailwind)

### Font Sizes
- **Hero/Display:** `text-5xl` (48px), `font-bold`, `tracking-tight`
- **Page Titles:** `text-3xl` (30px), `font-bold`, `tracking-tight`
- **Section Titles:** `text-2xl` (24px), `font-semibold`
- **Card Titles:** `text-lg` (18px), `font-semibold`
- **Body Text:** `text-base` (16px), `font-normal`
- **Small Text:** `text-sm` (14px)
- **Tiny Text:** `text-xs` (12px)

### Letter Spacing
- Headlines: `tracking-tight` (-0.02em)
- Body: Default
- Small caps/labels: `tracking-wide` (0.05em)

## Spacing & Layout

### Container
- **Max Width:** `max-w-md` (448px) for forms/cards
- **Max Width:** `max-w-7xl` for dashboards
- **Padding:** `p-8` for cards, `p-6` for smaller cards
- **Mobile:** Always mobile-first, responsive design

### Gaps & Spacing
- **Between sections:** `space-y-8` or `mb-8`
- **Between elements:** `space-y-4` or `mb-4`
- **Between inline items:** `gap-4` or `gap-3`
- **Form fields:** `space-y-6` (generous spacing)

### Borders & Shadows
- **Card Shadow:** `shadow-lg` for important cards
- **Subtle Shadow:** `shadow-sm` for less important elements
- **Borders:** `border border-slate-200`
- **Focus Ring:** `focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`

## Components

### Buttons

**Primary Button:**
```
bg-gradient-to-r from-purple-600 to-purple-700
text-white
px-8 py-3
rounded-xl
font-semibold
hover:from-purple-700 hover:to-purple-800
transition-all
shadow-lg
```

**Secondary Button:**
```
border-2 border-white/20
text-white
px-8 py-3
rounded-xl
font-semibold
hover:bg-white/10
transition-all
```

**Tertiary Button (on light):**
```
border-2 border-slate-200
text-slate-700
px-6 py-2
rounded-lg
font-medium
hover:bg-slate-50
transition-all
```

### Form Inputs

**Text Input:**
```
w-full
px-4 py-3
border border-slate-300
rounded-lg
text-base
focus:outline-none
focus:ring-2
focus:ring-purple-600
focus:border-transparent
placeholder:text-slate-400
```

**Label:**
```
block
text-sm
font-medium
text-slate-700
mb-2
```

### Cards

**White Card on Dark:**
```
bg-white
rounded-2xl
shadow-xl
p-8
border border-slate-100
```

**Card on Light Background:**
```
bg-white
rounded-xl
shadow-sm
p-6
border border-slate-200
hover:shadow-md
transition-shadow
```

### Navigation

**Bottom Nav (Mobile):**
```
fixed bottom-0
bg-white/95
backdrop-blur-lg
border-t border-slate-200
```

**Top Header (Dark):**
```
bg-gradient-to-r from-slate-900 to-slate-800
text-white
px-6 py-4
```

## Animations & Interactions

### Transitions
- **Buttons:** `transition-all duration-200`
- **Cards:** `transition-shadow duration-300`
- **Hovers:** Subtle scale or shadow changes

### Active States
- **Buttons:** Slight scale down `active:scale-95`
- **Cards:** Border color change or shadow increase

### Loading States
- Use skeleton screens (gray animated placeholders)
- Purple spinner for button loading states

## Page Layouts

### Auth Pages (Sign Up, Login)
- Dark gradient background (full screen)
- Centered white card (max-w-md)
- Form fields with generous spacing
- Large, clear buttons
- Subtle footer text

### Dashboard/App Pages
- White/light background
- Sticky header (if needed)
- Content area with max-w-7xl centered
- Bottom navigation (mobile)
- Cards with shadow and borders

### Empty States
- Centered content
- Large icon (text-6xl)
- Clear heading and description
- Single CTA button

## Icons & Emojis
- Use emojis for category icons (✈️, 🏠, 🍴, etc.)
- Keep consistent emoji style throughout
- Icons should be 24px for inline, 48-64px for headers

## Best Practices

### DO:
✅ Always use the purple gradient for primary actions
✅ Maintain generous white space
✅ Use consistent border radius (rounded-xl, rounded-2xl)
✅ Follow the mobile-first approach
✅ Use semantic HTML
✅ Ensure all interactive elements have hover states
✅ Make tap targets at least 44px × 44px

### DON'T:
❌ Mix flat colors with gradients randomly
❌ Use more than 2-3 font sizes per page
❌ Overcrowd pages - embrace white space
❌ Use bright, saturated colors except purple
❌ Create jarring transitions or animations
❌ Use borders without purpose

## Accessibility
- Color contrast ratio: Minimum 4.5:1 for text
- Focus states: Always visible with purple ring
- Touch targets: Minimum 44×44px
- Form labels: Always present and associated
- Error messages: Clear and helpful
