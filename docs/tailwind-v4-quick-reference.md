# Tailwind V4 Quick Reference Guide

## 🎨 **Semantic Color Tokens**

### Text Colors

```html
<!-- Primary content -->
<h1 class="text-foreground">Main heading</h1>
<p class="text-muted-foreground">Secondary text</p>

<!-- Brand colors -->
<span class="text-primary">Primary accent</span>
<span class="text-secondary">Secondary accent</span>
<span class="text-accent">Accent color</span>
```

### Background Colors

```html
<!-- Layout backgrounds -->
<div class="bg-background">Page background</div>
<div class="bg-card">Card background</div>
<div class="bg-muted">Muted background</div>

<!-- Brand backgrounds -->
<button class="bg-primary text-primary-foreground">Primary button</button>
<button class="bg-secondary text-secondary-foreground">Secondary button</button>
```

### Border Colors

```html
<div class="border border-border">Standard border</div>
<div class="border border-primary">Primary border</div>
<input class="border border-input focus:border-primary">Form input</input>
```

---

## 🧩 **Advanced Utility Patterns**

### Card Components

```html
<!-- Basic card -->
<div class="card-base">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

<!-- Interactive card -->
<div class="card-interactive">
  <h3>Clickable Card</h3>
  <p>Hover for lift effect</p>
</div>

<!-- Feature card -->
<div class="card-feature">
  <h3>Feature Card</h3>
  <p>Enhanced styling</p>
</div>
```

### Layout Patterns

```html
<!-- Responsive containers -->
<div class="container-responsive">Responsive container</div>
<div class="container-narrow">Narrow content</div>
<div class="container-wide">Wide content</div>

<!-- Flexbox patterns -->
<div class="flex-center">Centered content</div>
<div class="flex-between">Space between</div>

<!-- Grid patterns -->
<div class="grid-auto-fit">Auto-fitting grid</div>
<div class="grid-auto-fill">Auto-filling grid</div>
```

### Animation Utilities

```html
<!-- Fade animations -->
<div class="animate-fade-in-up">Fade in from bottom</div>
<div class="animate-fade-in-down">Fade in from top</div>

<!-- Scale animations -->
<div class="animate-scale-in">Scale in effect</div>
<div class="animate-bounce-in">Bounce in effect</div>

<!-- Hover effects -->
<div class="hover-lift">Hover to lift</div>
<div class="hover-scale">Hover to scale</div>
<div class="hover-glow">Hover for glow</div>
```

### Typography

```html
<!-- Heading utilities -->
<h1 class="heading-xl">Extra large heading</h1>
<h2 class="heading-lg">Large heading</h2>
<h3 class="heading-md">Medium heading</h3>

<!-- Text effects -->
<span class="text-gradient">Gradient text</span>
<p class="text-balance">Balanced text</p>
```

### State Utilities

```html
<!-- Loading states -->
<button class="loading">Loading...</button>
<div class="skeleton">Skeleton placeholder</div>

<!-- Disabled state -->
<button class="disabled">Disabled button</button>
```

---

## 🌙 **Theme Integration**

### Theme Toggle Usage

```astro
---
import ThemeToggle from '~/components/common/ThemeToggle.astro';
---

<!-- Add to header/navigation -->
<ThemeToggle class="ml-auto" iconClass="w-5 h-5" />
```

### Theme-Aware Components

```html
<!-- Automatic theme adaptation -->
<div class="bg-card text-card-foreground border-border border">Content adapts to light/dark theme automatically</div>

<!-- Manual theme targeting (if needed) -->
<div class="bg-white dark:bg-gray-900">Explicit light/dark values</div>
```

---

## 📱 **Responsive Utilities**

### Visibility Controls

```html
<!-- Show/hide by breakpoint -->
<div class="show-mobile">Mobile only</div>
<div class="show-tablet">Tablet only</div>
<div class="show-desktop">Desktop only</div>

<div class="hide-mobile">Hidden on mobile</div>
<div class="hide-tablet">Hidden on tablet</div>
<div class="hide-desktop">Hidden on desktop</div>
```

### Responsive Patterns

```html
<!-- Responsive spacing -->
<div class="space-section">Section spacing</div>
<div class="space-component">Component spacing</div>

<!-- Responsive containers -->
<div class="container-responsive px-4 sm:px-6 lg:px-8">Responsive padding</div>
```

---

## ✨ **Background Effects**

### Gradient Backgrounds

```html
<div class="bg-gradient-primary">Primary gradient</div>
<div class="bg-gradient-secondary">Secondary gradient</div>
<div class="bg-gradient-radial">Radial gradient</div>
```

### Pattern Backgrounds

```html
<div class="bg-dots">Dot pattern background</div>
<div class="bg-grid">Grid pattern background</div>
```

---

## 🎯 **Focus & Interaction**

### Focus States

```html
<button class="focus-ring">Standard focus ring</button>
<input class="focus-ring-inset">Inset focus ring</input>
```

### Interactive Effects

```html
<div class="hover-lift focus-ring">Interactive element</div>
<button class="btn-primary hover-glow">Enhanced button</button>
```

---

## 📋 **Migration Patterns**

### Old vs New Patterns

```html
<!-- ❌ Old pattern -->
<div class="text-myColor-400 dark:text-myColor-300">
  <!-- ✅ New pattern -->
  <div class="text-muted-foreground">
    <!-- ❌ Old pattern -->
    <div class="bg-myColor-900 dark:bg-myColor-800">
      <!-- ✅ New pattern -->
      <div class="bg-card">
        <!-- ❌ Old pattern -->
        <div class="border-myColor-200 dark:border-myColor-700">
          <!-- ✅ New pattern -->
          <div class="border-border"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Markdown Content

```html
<!-- ❌ Old pattern -->
<div class="prose prose-lg dark:prose-invert">
  <!-- ✅ New pattern -->
  <div class="prose-enhanced"></div>
</div>
```

---

## 🚀 **Quick Tips**

1. **Use semantic tokens** instead of hardcoded colors
2. **Leverage utility patterns** for consistent spacing and layouts
3. **Test theme switching** to ensure proper contrast and readability
4. **Use animation utilities** sparingly for performance
5. **Combine utilities** to create powerful component patterns

---

## 🔗 **Related Documentation**

- [Full Migration Guide](./tailwind-v4-migration-guide.md)
- [Complete Implementation Report](./tailwind-v4-completion-report.md)
- [Theme System Architecture](../src/components/CustomStyles.astro)
- [Utility Library](../src/assets/styles/tailwind.css)
