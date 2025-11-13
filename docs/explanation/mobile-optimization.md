# Mobile Optimization

**Status:** 📋 Coming in Phase 3

This document will explain Carzo's mobile-first design strategy and responsive patterns.

## Planned Content

- Mobile-first development approach
- Touch target sizing (40x40px minimum for WCAG Level AAA)
- Responsive breakpoints strategy
- Performance optimization for mobile
- Mobile user experience patterns
- Image optimization for mobile
- Mobile gestures and interactions
- PWA considerations

## For Now

See these related documents:
- [Architecture Overview](./architecture-overview.md) - Mentions mobile-first approach
- [Component Library Overview](../reference/components/overview.md) - Responsive component examples
- [Card Component](../reference/components/card.md) - Mobile-responsive layout patterns

## Mobile-First Pattern (Quick Reference)

Carzo uses a mobile-first approach with Tailwind CSS:

**Base Styles = Mobile (320px+)**
```tsx
// Default styles apply to mobile
<div className="p-4 text-base">
  {/* Mobile layout */}
</div>
```

**Desktop Overrides = lg: prefix (1024px+)**
```tsx
// Override for desktop
<div className="p-4 lg:p-8 text-base lg:text-lg">
  {/* Larger padding and text on desktop */}
</div>
```

**Common Responsive Patterns:**
```tsx
// Stack on mobile, horizontal on desktop
<div className="flex flex-col lg:flex-row gap-3">

// Full width on mobile, auto on desktop
<Button className="w-full lg:w-auto">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Show on mobile, hide on desktop
<div className="block lg:hidden">
```

**Touch Targets (WCAG Level AAA):**
```tsx
// Minimum 40x40px touch target
<button className="min-h-[40px] min-w-[40px] p-3">
  <Icon className="h-4 w-4" />
</button>
```

**Test Viewports:**
- Mobile: 375px (iPhone SE/12/13/14)
- Tablet: 768px (iPad)
- Desktop: 1024px+ (standard breakpoint)

---

**Last Updated**: 2025-11-13
