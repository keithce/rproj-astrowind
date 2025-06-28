/**
 * Simple Form Handler for NotionContact Form
 * Handles client-side form submission with basic validation and feedback
 */

class SimpleFormHandler {
  constructor(formId = 'notion-contact-form') {
    this.formId = formId;
    this.form = null;
    this.submitButton = null;
    this.isSubmitting = false;
    this.initCompleted = false;
    
    this.init();
  }

  /**
   * Initialize the form handler when DOM is ready
   */
  init() {
    // Prevent double initialization
    if (this.initCompleted) {
      console.warn('Form handler already initialized');
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupForm());
    } else {
      this.setupForm();
    }
  }

  /**
   * Set up form element selection and event listeners
   */
  setupForm() {
    // Prevent double setup
    if (this.initCompleted) return;
    
    try {
      this.form = document.getElementById(this.formId);
      
      if (!this.form) {
        console.warn(`Form with ID '${this.formId}' not found`);
        return;
      }

      this.submitButton = this.form.querySelector('button[type="submit"]');
      
      if (!this.submitButton) {
        console.warn('Submit button not found in form');
        return;
      }

      // Store original button HTML
      this.originalButtonHTML = this.submitButton.innerHTML;
      
      // Add single event listener to form
      this.form.addEventListener('submit', (event) => {
        this.handleSubmit(event);
      });
      
      // Mark initialization as complete
      this.initCompleted = true;
      console.log('✅ Simple form handler initialized successfully');
      
    } catch (error) {
      console.error('Error setting up form handler:', error);
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    console.log('🚀 Form submission started');
    
    // Prevent double submission
    if (this.isSubmitting) {
      console.log('⏳ Form submission already in progress');
      return;
    }

    try {
      this.isSubmitting = true;
      this.setLoadingState(true);
      this.clearErrors();
      
      console.log('✅ Validating form data...');
      
      // Validate form
      const validation = this.validateForm();
      if (!validation.isValid) {
        console.log('❌ Form validation failed:', validation.errors);
        this.showErrors(validation.errors);
        return;
      }
      
      console.log('✅ Form validation passed, submitting...');
      
      // Submit form
      const formData = new FormData(this.form);
      console.log('📤 Sending form data to server...');
      
      const response = await this.submitForm(formData);
      
      console.log('📡 Server response received:', response.status);
      
      if (response.status >= 300 && response.status < 400) {
        // Handle redirects manually when fetch keeps the original 3xx response (e.g., 303)
        const locationHeader = response.headers.get('Location');
        console.log('✅ Form submitted: redirect received to location header:', locationHeader);
        console.log('✅ Form submitted: redirect received to response url:', response.url);
        
        const redirectTo = response.redirected ? response.url : locationHeader;
        if (redirectTo) {
          console.log('✅ Form submitted – redirecting to thank-you page:', redirectTo);
          window.location.href = redirectTo;
          return; // Stop further processing
        }
      }
      if (response.ok) {
        console.log('✅ Form submitted successfully');
        const redirectTo = response.redirected ? response.url : response.headers.get('X-Redirect-URL');
        console.log('✅ Form submitted: redirect received to location header:', response.headers.get('X-Redirect-URL'));
        console.log('✅ Form submitted: redirect received to response url:', response.url);
        
        if (redirectTo) {
          console.log('✅ Form submitted – redirecting to thank-you page:', redirectTo);
          window.location.href = redirectTo;
          return; // Stop further processing
        }
        this.showSuccess();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Submission failed' }));
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('❌ Form submission error:', error);
      this.showError(error.message);
    } finally {
      this.isSubmitting = false;
      this.setLoadingState(false);
      console.log('🏁 Form submission completed');
    }
  }

  /**
   * Submit form data
   */
  async submitForm(formData) {
    const formAction = this.form.action || '/api/submit-to-notion';
    
    console.log('🌐 Making request to:', formAction);
    
    return fetch(formAction, {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Validate form fields
   */
  validateForm() {
    const errors = {};
    let isValid = true;
    
    // Get form data
    const formData = new FormData(this.form);
    
    // Name validation
    const name = formData.get('name')?.toString().trim();
    if (!name) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    // Email validation
    const email = formData.get('email')?.toString().trim();
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Service validation
    const service = formData.get('service')?.toString().trim();
    if (!service || service === '') {
      errors.service = 'Please select a service';
      isValid = false;
    }
    
    // Message validation
    const message = formData.get('message')?.toString().trim();
    if (!message) {
      errors.message = 'Message is required';
      isValid = false;
    } else if (message.length < 10) {
      errors.message = 'Message must be at least 10 characters long';
      isValid = false;
    }
    
    return { isValid, errors };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Set loading state
   */
  setLoadingState(isLoading) {
    if (!this.submitButton) return;
    
    if (isLoading) {
      this.submitButton.disabled = true;
      this.submitButton.innerHTML = 'Sending...';
      this.submitButton.classList.add('btn-loading');
      console.log('⏳ Loading state enabled');
    } else {
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = this.originalButtonHTML;
      this.submitButton.classList.remove('btn-loading');
      console.log('✅ Loading state disabled');
    }
  }

  /**
   * Clear all error messages
   */
  clearErrors() {
    // Clear field errors
    const errorElements = this.form.querySelectorAll('.field-error');
    errorElements.forEach(error => error.remove());
    
    // Clear form error
    const formError = this.form.querySelector('.form-error');
    if (formError) formError.remove();
    
    // Remove error styling from fields
    const fields = this.form.querySelectorAll('.error');
    fields.forEach(field => field.classList.remove('error'));
  }

  /**
   * Show field validation errors
   */
  showErrors(errors) {
    console.log('🔍 Displaying validation errors:', errors);
    
    Object.entries(errors).forEach(([fieldName, message]) => {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        // Add error styling to field
        field.classList.add('error');
        
        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'mt-1 text-sm text-red-500 field-error';
        errorElement.textContent = message;
        
        // Insert error after field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
        
        // Focus first error field
        if (Object.keys(errors)[0] === fieldName) {
          field.focus();
        }
      }
    });
  }

  /**
   * Show form-level error
   */
  showError(message) {
    console.log('❌ Showing error message:', message);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'px-4 py-2 mb-4 text-sm text-red-800 bg-red-100 rounded-md border border-red-200 form-error';
    errorElement.innerHTML = `
      <div class="flex gap-2 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M9 21h6a2 2 0 002-2V9l-3-3H7a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <span>${message}</span>
      </div>
    `;
    
    // Insert at top of form
    this.form.insertBefore(errorElement, this.form.firstChild);
  }

  /**
   * Show success message
   */
  showSuccess() {
    console.log('🎉 Showing success message');
    
    const successElement = document.createElement('div');
    successElement.className = 'px-4 py-3 mb-4 text-green-700 bg-green-50 rounded border border-green-200 form-success';
    successElement.innerHTML = `
      <div class="flex">
        <span class="mr-2">✅</span>
        <span>Message sent successfully!</span>
      </div>
    `;
    
    // Replace form content with success message
    this.form.innerHTML = '';
    this.form.appendChild(successElement);
  }
}

// Initialize form handler when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if not already done
  if (!window.simpleFormHandler) {
    window.simpleFormHandler = new SimpleFormHandler();
  }
});

// Fallback initialization for when DOM is already loaded
if (document.readyState !== 'loading') {
  if (!window.simpleFormHandler) {
    window.simpleFormHandler = new SimpleFormHandler();
  }
} 