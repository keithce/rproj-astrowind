# Product Requirements Document: NotionContact Form Enhancement

## Overview

Migrate the NotionContact form component from a standard HTML form POST to a
JavaScript client-side submission handler for improved user experience with
immediate visual feedback and smoother transitions.

## Current Implementation

The NotionContact component currently:

- Uses standard HTML form submission
- Provides no immediate feedback during submission
- Relies on full page reloads for redirects
- Has server-side validation with Notion integration

## Objectives

1. Implement client-side form submission via JavaScript
2. Provide immediate visual feedback during form submission
3. Handle redirects and errors smoothly without page reloads
4. Maintain existing server-side validation and error handling

## Technical Requirements

### Client-Side Form Enhancement

1. Create a new JavaScript handler that:
   - Prevents default form submission
   - Collects form data using FormData API
   - Submits data via fetch API to existing endpoint
   - Shows loading state during submission
   - Handles success/error responses appropriately

### User Feedback Implementation

1. Add loading state indicators:
   - Disable submit button during submission
   - Show spinner or progress indicator
   - Apply visual transitions for form state changes

2. Add success/error feedback:
   - Show inline success message before redirect
   - Display validation errors next to respective fields
   - Implement toast notifications for system errors

### Redirect Handling

1. Programmatically redirect to thank-you page on success
2. Implement smooth transition effects during redirect

## Implementation Plan

### Phase 1: JavaScript Form Handler

Create a client-side script that:

```javascript
// Form submission handler to be added to NotionContact.astro
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('notion-contact-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const formFields = form.querySelectorAll('input, textarea, select');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Show loading state
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner"></span> Sending...';

      // Clear previous errors
      document.querySelectorAll('.error-message').forEach(el => el.remove());

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
        });

        if (response.redirected) {
          // Show success message before redirect
          form.innerHTML = '<div class="success-message">Message sent successfully! Redirecting...</div>';
          setTimeout(() => {
            window.location.href = response.url;
          }, 1000);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          // Handle validation errors
          if (data.errors) {
            Object.entries(data.errors).forEach(([field, errors]) => {
              const fieldElement = form.querySelector(`[name="${field}"]`);
              if (fieldElement) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message text-red-500 text-sm mt-1';
                errorMessage.textContent = Array.isArray(errors) ? errors[0] : errors;
                fieldElement.parentNode.appendChild(errorMessage);
              }
            });
          } else {
            // Handle general error
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message text-red-500 text-sm mt-4';
            errorMessage.textContent = data.message || 'An unexpected error occurred. Please try again.';
            form.appendChild(errorMessage);
          }
        }
      } catch (error) {
        // Handle network or other errors
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message text-red-500 text-sm mt-4';
        errorMessage.textContent = 'Unable to send your message. Please try again later.';
        form.appendChild(errorMessage);
      } finally {
        // Reset button state if not redirected
        submitButton.disabled = false;
        submitButton.innerHTML = 'Start the Conversation';
      }
    });
  });
</script>
```

### Phase 2: NotionContact.astro Updates

Update NotionContact.astro to include:

- ID attribute for targeting the form
- Styling for feedback states
- Script import for the form handler

### Phase 3: API Response Standardization

Ensure the API endpoint returns consistent responses:

- Maintain 303 redirects for successful submissions
- Return JSON with clear error messages for client-side handling

## Design Specifications

### Loading State

- Submit button text changes to "Sending..."
- Spinning indicator appears within button
- Form fields become disabled

### Error State

- Red text appears below individual fields with validation errors
- System errors appear as a highlighted message below the form
- Submit button returns to active state

### Success State

- Brief success message appears replacing the form
- Smooth transition/fade to thank-you page

## Testing Requirements

1. Form validation:
   - Test all field validations with various inputs
   - Verify error messages are displayed correctly

2. API interaction:
   - Test successful submissions
   - Test submissions with validation errors
   - Test with network errors

3. Accessibility testing:
   - Ensure error states are screen-reader accessible
   - Verify keyboard navigation during loading states

## Browser Compatibility

Ensure functionality works on:

- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

## Success Metrics

1. Reduced form abandonment rate
2. Improved user satisfaction scores
3. Decreased page load times post-submission

## Timeline

- Design & Planning: 2 days
- Implementation: 3 days
- Testing: 2 days
- Deployment: 1 day
