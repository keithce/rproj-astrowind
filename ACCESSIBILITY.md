# 🛡️ Accessibility Implementation Guide

This document provides comprehensive information about the accessibility
features implemented in this project and how to maintain and test them.

## 📋 Table of Contents

- [Overview](#overview)
- [Implemented Features](#implemented-features)
- [Testing](#testing)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## 🌟 Overview

This project implements comprehensive accessibility features that meet and
exceed WCAG 2.1 AA standards. Our accessibility implementation includes:

- **ARIA Live Regions** for dynamic content announcements
- **Advanced Focus Management** with skip links and focus trapping
- **Keyboard Navigation** support for all interactive elements
- **Screen Reader Compatibility** with proper semantic markup
- **Color Contrast Compliance** meeting WCAG AA standards
- **Motion Accessibility** with prefers-reduced-motion support
- **Automated Testing** integrated into CI/CD pipeline

## ✅ Implemented Features

### 1. ARIA Live Regions for Dynamic Content

**Location**: `src/components/ui/Form.astro`

**Features**:

- Status announcements (`aria-live="polite"`)
- Error announcements (`aria-live="assertive"`)
- Success confirmations (`aria-live="polite"`)
- Loading state announcements (`aria-live="polite"`)
- Field-specific error containers

**Usage**:

```html
<!-- Status updates -->
<div
  id="form-status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
></div>

<!-- Error announcements -->
<div
  id="form-errors"
  aria-live="assertive"
  aria-atomic="true"
  class="sr-only"
></div>
```

### 2. Skip Links and Navigation Enhancement

**Location**: `src/layouts/Layout.astro`

**Features**:

- Skip to main content
- Skip to navigation
- Skip to footer
- Skip to search
- Proper landmark roles

**Usage**:

```html
<div class="skip-links">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <a href="#navigation" class="skip-link">Skip to navigation</a>
  <a href="#footer" class="skip-link">Skip to footer</a>
  <a href="#search" class="skip-link">Skip to search</a>
</div>
```

### 3. Advanced Focus Management System

**Location**: `src/layouts/Layout.astro` (FocusManager class)

**Features**:

- Modal focus trapping with stacking support
- Keyboard navigation patterns (grid, tree, tab-list)
- Roving tabindex implementation
- Dynamic content focus management
- Focus restoration after interactions
- Nested interactive element management

**Usage Examples**:

#### Grid Navigation

```html
<div data-complex-navigation="grid" data-grid-columns="3">
  <div role="gridcell" tabindex="0">Item 1</div>
  <div role="gridcell" tabindex="-1">Item 2</div>
  <div role="gridcell" tabindex="-1">Item 3</div>
</div>
```

#### Roving Tabindex

```html
<div data-roving-tabindex>
  <button data-roving-item tabindex="0">Button 1</button>
  <button data-roving-item tabindex="-1">Button 2</button>
  <button data-roving-item tabindex="-1">Button 3</button>
</div>
```

#### Auto-Focus Dynamic Content

```html
<div data-auto-focus data-announce="New content loaded">
  <input data-focus-target type="text" />
</div>
```

### 4. Enhanced CSS and Visual Features

**Location**: `src/assets/styles/tailwind.css`

**Features**:

- Advanced focus indicators with box-shadow effects
- High contrast mode support
- Reduced motion compliance
- Skip links styling
- Complex navigation component styling

**Key Classes**:

```css
.skip-link:focus {
  top: 20px;
  outline: 3px solid #fbbf24;
}

.keyboard-focused {
  outline: 2px solid var(--color-primary, #0052ff) !important;
  box-shadow: 0 0 0 4px rgba(0, 82, 255, 0.1) !important;
}
```

## 🧪 Testing

### Automated Testing

#### Run All Accessibility Tests

```bash
npm run test:accessibility
```

#### Run Specific Test Types

```bash
# Axe-core tests
npm run axe:scan

# Lighthouse accessibility audit
npm run lighthouse:accessibility

# Custom accessibility tests
npm run test:accessibility:verbose

# Complete accessibility test suite
npm run test:a11y:full
```

#### Environment-Specific Testing

```bash
# Development environment
npm run test:accessibility:ci

# Staging environment
npm run test:accessibility:staging

# Production environment
npm run test:accessibility:production
```

### Manual Testing

#### Screen Reader Testing

1. **NVDA (Windows)**: Test with NVDA screen reader
2. **JAWS (Windows)**: Verify JAWS compatibility
3. **VoiceOver (macOS)**: Test with VoiceOver
4. **Orca (Linux)**: Validate with Orca screen reader

#### Keyboard Navigation Testing

1. **Tab Navigation**: Verify all interactive elements are reachable
2. **Skip Links**: Test skip link functionality (Tab → Enter)
3. **Modal Focus**: Verify focus trapping in modals
4. **Arrow Key Navigation**: Test grid and menu navigation

#### Visual Testing

1. **High Contrast Mode**: Test with high contrast enabled
2. **Zoom Testing**: Verify functionality at 200% zoom
3. **Color Contrast**: Use tools like WebAIM Color Contrast Checker
4. **Focus Indicators**: Verify visible focus indicators

### Debug Mode

Enable focus debugging by adding `?debug-focus` to any URL:

```
http://localhost:4321/contact?debug-focus
```

This will:

- Log focus movements to console
- Show visual focus indicators
- Display focus order numbers

## 👨‍💻 Development Guidelines

### Adding New Components

When creating new components, follow these accessibility guidelines:

#### 1. Semantic HTML

```astro
<!-- Good -->
<button type="button" aria-label="Close dialog">×</button>

<!-- Bad -->
<div onclick="closeDialog()">×</div>
```

#### 2. ARIA Labels and Descriptions

```astro
<!-- Form inputs -->
<input
  type="email"
  id="email"
  aria-label="Email address"
  aria-describedby="email-help"
  aria-required="true"
/>
<div id="email-help">We'll never share your email</div>

<!-- Buttons -->
<button aria-label="Search products">🔍</button>
```

#### 3. Focus Management

```astro
<!-- Modal with proper focus management -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Modal Title</h2>
  <button data-focus-target>First focusable element</button>
  <!-- modal content -->
  <button onclick="closeModal()">Close</button>
</div>
```

#### 4. Live Regions for Dynamic Content

```javascript
// Announce dynamic changes
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 2000);
}
```

### CSS Guidelines

#### Focus Indicators

```css
/* Always provide visible focus indicators */
.interactive-element:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .interactive-element:focus {
    outline: 3px solid #000;
    background-color: #fff;
    color: #000;
  }
}
```

#### Motion Accessibility

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

### JavaScript Guidelines

#### Event Handling

```javascript
// Support both mouse and keyboard interactions
function handleInteraction(event) {
  if (event.type === 'click' || (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' '))) {
    // Handle interaction
  }
}

element.addEventListener('click', handleInteraction);
element.addEventListener('keydown', handleInteraction);
```

#### Focus Management

```javascript
// Manage focus properly
function openModal(modal) {
  // Store current focus
  const previousFocus = document.activeElement;

  // Show modal
  modal.style.display = 'block';

  // Focus first element in modal
  const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) {
    firstFocusable.focus();
  }

  // Restore focus when modal closes
  modal.addEventListener('close', () => {
    previousFocus.focus();
  });
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Skip Links Not Working

**Problem**: Skip links don't navigate to target elements **Solution**: Ensure
target elements have proper IDs and tabindex="-1"

```html
<main id="main-content" tabindex="-1">
  <!-- content -->
</main>
```

#### 2. Screen Reader Not Announcing Changes

**Problem**: Dynamic content changes aren't announced **Solution**: Use proper
ARIA live regions

```html
<div aria-live="polite" id="status-updates"></div>
```

#### 3. Focus Trapped in Modal

**Problem**: Can't escape modal with keyboard **Solution**: Implement proper
escape key handling

```javascript
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOpen) {
    closeModal();
  }
});
```

#### 4. Poor Color Contrast

**Problem**: Text doesn't meet contrast requirements **Solution**: Use tools to
verify contrast ratios

```bash
npm run test:contrast
```

### Testing Issues

#### 1. Automated Tests Failing

**Check**:

- Server is running on correct port
- All dependencies are installed
- Browser can access the application

#### 2. Lighthouse Scores Low

**Common Causes**:

- Missing alt text on images
- Poor color contrast
- Missing form labels
- Improper heading hierarchy

#### 3. Axe Violations

**Review**:

- ARIA attributes are correctly used
- All interactive elements have accessible names
- Focus management is properly implemented

## 📚 Resources

### Standards and Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Screen Readers

- [NVDA (Free)](https://www.nvaccess.org/download/)
- [JAWS (Commercial)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS)](https://support.apple.com/guide/voiceover/)

### Browser Extensions

- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE Evaluation Tool](https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh)
- [Accessibility Insights](https://accessibilityinsights.io/)

## 🤝 Contributing

When contributing to this project:

1. **Run accessibility tests** before submitting PRs
2. **Follow accessibility guidelines** outlined in this document
3. **Test with keyboard navigation** and screen readers
4. **Verify color contrast** meets WCAG AA standards
5. **Update documentation** when adding new accessibility features

### Pre-commit Checklist

- [ ] All accessibility tests pass
- [ ] Keyboard navigation works properly
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets requirements
- [ ] Focus indicators are visible
- [ ] ARIA attributes are correctly implemented

## 📞 Support

For accessibility-related questions or issues:

1. Check this documentation first
2. Run automated tests to identify issues
3. Review the troubleshooting section
4. Create an issue with accessibility testing results

Remember: Accessibility is not a feature to be added later—it should be
considered from the beginning of the development process.
