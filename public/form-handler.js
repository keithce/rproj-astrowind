/**
 * Form Handler Module for NotionContact Form
 * Handles client-side form submission with visual feedback, ARIA live regions, and smooth error/success handling
 */

class FormHandler {
  constructor(formId = 'notion-contact-form') {
    this.formId = formId;
    this.form = null;
    this.submitButton = null;
    this.isSubmitting = false;
    
    // ARIA Live Region Elements
    this.liveRegions = {
      status: null,
      errors: null,
      success: null,
      loading: null
    };
    
    // Message containers
    this.messageContainers = {
      error: null,
      success: null,
      loading: null
    };
    
    this.init();
  }

  /**
   * Initialize the form handler when DOM is ready
   */
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupFormHandler());
    } else {
      this.setupFormHandler();
    }
  }

  /**
   * Set up form element selection and event listeners
   */
  setupFormHandler() {
    try {
      // Select the target form element
      this.form = document.getElementById(this.formId);
      
      if (!this.form) {
        console.warn(`Form with ID '${this.formId}' not found. Form handler will not be initialized.`);
        return;
      }

      // Initialize ARIA live regions
      this.initializeLiveRegions();
      
      // Initialize message containers
      this.initializeMessageContainers();

      // Find the submit button within the form
      this.submitButton = this.form.querySelector('button[type="submit"]');
      
      if (!this.submitButton) {
        console.warn('Submit button not found in form. Looking for alternative submit elements.');
        this.submitButton = this.form.querySelector('input[type="submit"]');
      }

      console.log('Form handler initialized successfully for:', this.formId);
      
      // Set up form submission event listener
      this.attachSubmitListener();
      
      // Set up real-time validation listeners
      this.attachValidationListeners();
      
      // Set up network connectivity monitoring
      this.setupNetworkMonitoring();
      
      // Set up global error handling
      this.setupGlobalErrorHandling();
      
      // Set up keyboard navigation for accessibility
      this.setupKeyboardNavigation();
      
      // Announce form ready state
      this.announceToScreenReader('Contact form is ready for input', 'status');
      
    } catch (error) {
      console.error('Error initializing form handler:', error);
    }
  }

  /**
   * Initialize ARIA live region elements
   */
  initializeLiveRegions() {
    this.liveRegions.status = document.getElementById('form-status');
    this.liveRegions.errors = document.getElementById('form-errors');
    this.liveRegions.success = document.getElementById('form-success');
    this.liveRegions.loading = document.getElementById('form-loading');
    
    // Create live regions if they don't exist
    if (!this.liveRegions.status) {
      this.liveRegions.status = this.createLiveRegion('form-status', 'polite');
    }
    if (!this.liveRegions.errors) {
      this.liveRegions.errors = this.createLiveRegion('form-errors', 'assertive');
    }
    if (!this.liveRegions.success) {
      this.liveRegions.success = this.createLiveRegion('form-success', 'polite');
    }
    if (!this.liveRegions.loading) {
      this.liveRegions.loading = this.createLiveRegion('form-loading', 'polite');
    }
    
    console.log('ARIA live regions initialized');
  }

  /**
   * Initialize visible message containers
   */
  initializeMessageContainers() {
    this.messageContainers.error = document.getElementById('error-container');
    this.messageContainers.success = document.getElementById('success-container');
    this.messageContainers.loading = document.getElementById('loading-container');
    
    console.log('Message containers initialized');
  }

  /**
   * Create a live region element if it doesn't exist
   * @param {string} id - Element ID
   * @param {string} politeness - ARIA live politeness level
   * @returns {HTMLElement} Created live region element
   */
  createLiveRegion(id, politeness = 'polite') {
    const liveRegion = document.createElement('div');
    liveRegion.id = id;
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    
    // Append to form or body
    if (this.form) {
      this.form.appendChild(liveRegion);
    } else {
      document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
  }

  /**
   * Announce message to screen readers via live regions
   * @param {string} message - Message to announce
   * @param {string} type - Type of announcement ('status', 'error', 'success', 'loading')
   * @param {boolean} clearAfterDelay - Whether to clear the message after a delay
   */
  announceToScreenReader(message, type = 'status', clearAfterDelay = true) {
    const liveRegion = this.liveRegions[type];
    
    if (!liveRegion || !message) return;
    
    // Clear existing content first to ensure announcement
    liveRegion.textContent = '';
    
    // Use setTimeout to ensure the clearing is processed before new content
    setTimeout(() => {
      liveRegion.textContent = message;
      console.log(`Screen reader announcement (${type}):`, message);
      
      // Clear after delay to prevent repetitive announcements
      if (clearAfterDelay) {
        setTimeout(() => {
          if (liveRegion.textContent === message) {
            liveRegion.textContent = '';
          }
        }, 5000);
      }
    }, 100);
  }

  /**
   * Show visual message with ARIA live region announcement
   * @param {string} message - Message to display
   * @param {string} type - Message type ('error', 'success', 'loading')
   * @param {boolean} persistent - Whether message should persist
   */
  showMessageWithAnnouncement(message, type, persistent = false) {
    // Show visual message
    this.showVisualMessage(message, type);
    
    // Announce to screen readers
    const announcementType = type === 'loading' ? 'loading' : type === 'success' ? 'success' : 'error';
    this.announceToScreenReader(message, announcementType, !persistent);
  }

  /**
   * Show visual message in appropriate container
   * @param {string} message - Message to display
   * @param {string} type - Message type ('error', 'success', 'loading')
   */
  showVisualMessage(message, type) {
    const container = this.messageContainers[type];
    if (!container) return;
    
    // Clear other message types
    Object.keys(this.messageContainers).forEach(key => {
      if (key !== type && this.messageContainers[key]) {
        this.messageContainers[key].style.display = 'none';
        this.messageContainers[key].classList.remove('show');
      }
    });
    
    // Show current message
    container.textContent = message;
    container.style.display = 'block';
    container.classList.add('show');
  }

  /**
   * Clear all visual messages and announcements
   */
  clearAllMessages() {
    // Clear visual containers
    Object.values(this.messageContainers).forEach(container => {
      if (container) {
        container.style.display = 'none';
        container.classList.remove('show');
        container.textContent = '';
      }
    });
    
    // Clear live regions
    Object.values(this.liveRegions).forEach(region => {
      if (region) {
        region.textContent = '';
      }
    });
  }

  /**
   * Show field-specific error with ARIA announcement
   * @param {string} fieldName - Name of the field
   * @param {string} message - Error message
   */
  showFieldErrorWithAnnouncement(fieldName, message) {
    const field = this.form?.querySelector(`[name="${fieldName}"]`);
    const errorContainer = document.getElementById(`${fieldName}-error`);
    
    if (field && errorContainer) {
      // Update field attributes
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('field-error');
      
      // Show error message
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      errorContainer.classList.add('show');
      
      // Announce to screen readers
      this.announceToScreenReader(`${field.labels?.[0]?.textContent || fieldName}: ${message}`, 'error');
    }
  }

  /**
   * Clear field-specific error with ARIA update
   * @param {string} fieldName - Name of the field
   */
  clearFieldErrorWithAnnouncement(fieldName) {
    const field = this.form?.querySelector(`[name="${fieldName}"]`);
    const errorContainer = document.getElementById(`${fieldName}-error`);
    
    if (field && errorContainer) {
      // Update field attributes
      field.setAttribute('aria-invalid', 'false');
      field.classList.remove('field-error');
      
      // Hide error message
      errorContainer.style.display = 'none';
      errorContainer.classList.remove('show');
      errorContainer.textContent = '';
    }
  }

  /**
   * Attach submit event listener to prevent default submission
   */
  attachSubmitListener() {
    if (!this.form) return;

    this.form.addEventListener('submit', async (event) => {
      await this.handleFormSubmission(event);
    });
  }

  /**
   * Attach validation listeners for real-time field error clearing
   */
  attachValidationListeners() {
    if (!this.form) return;

    // Get all form fields that need validation
    const fields = this.form.querySelectorAll('input[name], select[name], textarea[name]');
    
    fields.forEach(field => {
      const fieldName = field.getAttribute('name');
      
      // Clear field error on input (real-time feedback)
      field.addEventListener('input', () => {
        this.clearFieldError(fieldName);
      });
      
      // Clear field error on change (for select fields)
      field.addEventListener('change', () => {
        this.clearFieldError(fieldName);
      });
      
      // Clear field error on focus (when user starts interacting)
      field.addEventListener('focus', () => {
        this.clearFieldError(fieldName);
      });
    });
    
    console.log('Real-time validation listeners attached to', fields.length, 'fields');
  }

  /**
   * Setup network connectivity monitoring for enhanced error handling
   */
  setupNetworkMonitoring() {
    // Monitor online/offline events
    window.addEventListener('online', () => {
      this.handleConnectionRestored();
    });
    
    window.addEventListener('offline', () => {
      this.handleConnectionLost();
    });
    
    // Initial connectivity check
    if (!this.isOnline()) {
      this.handleConnectionLost();
    }
    
    console.log('Network connectivity monitoring enabled');
  }

  /**
   * Handle when internet connection is restored
   */
  handleConnectionRestored() {
    console.log('Internet connection restored');
    
    // Clear any offline error messages
    const offlineErrors = this.form?.querySelectorAll('.error-message');
    offlineErrors?.forEach(error => {
      if (error.textContent?.includes('offline') || error.textContent?.includes('connection')) {
        error.remove();
      }
    });
    
    // Re-enable form submission when back online
    if (this.submitButton && !this.isSubmitting) {
      this.submitButton.disabled = false;
      this.submitButton.removeAttribute('title');
    }
    
    // Show connection restored notification briefly
    this.showConnectionStatus('Connection restored', 'success');
  }

  /**
   * Handle when internet connection is lost
   */
  handleConnectionLost() {
    console.log('Internet connection lost');
    
    // Show offline notification
    this.showConnectionStatus('You are currently offline', 'warning');
    
    // Disable form submission when offline
    if (this.submitButton) {
      this.submitButton.disabled = true;
      this.submitButton.title = 'Form submission unavailable while offline';
    }
  }

  /**
   * Show connection status message to user
   * @param {string} message - Status message
   * @param {string} type - Message type ('success', 'warning', 'error')
   */
  showConnectionStatus(message, type = 'info') {
    if (!this.form) return;
    
    // Remove existing connection status messages
    const existingStatus = this.form.querySelector('.connection-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    // Create status element
    const statusElement = document.createElement('div');
    statusElement.className = `fixed top-4 right-4 z-50 p-3 text-sm rounded-md transition-opacity duration-200 connection-status`;
    
    // Add type-specific styling
    switch (type) {
      case 'success':
        statusElement.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-200');
        break;
      case 'warning':
        statusElement.classList.add('bg-yellow-100', 'text-yellow-700', 'border', 'border-yellow-200');
        break;
      case 'error':
        statusElement.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-200');
        break;
      default:
        statusElement.classList.add('bg-blue-100', 'text-blue-700', 'border', 'border-blue-200');
    }
    
    statusElement.textContent = message;
    statusElement.setAttribute('role', 'alert');
    statusElement.setAttribute('aria-live', 'polite');
    
    // Add to page
    document.body.appendChild(statusElement);
    
    // Auto-remove after delay
    setTimeout(() => {
      if (statusElement.parentNode) {
        statusElement.style.opacity = '0';
        setTimeout(() => statusElement.remove(), 200);
      }
         }, type === 'success' ? 3000 : 5000);
  }

  /**
   * Setup global error handling for unexpected errors and exceptions
   */
  setupGlobalErrorHandling() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, 'JavaScript Error', event.filename, event.lineno);
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
      event.preventDefault(); // Prevent default browser error logging
    });
    
    console.log('Global error handling enabled');
  }

  /**
   * Handle unexpected global errors and exceptions
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   * @param {string} filename - File where error occurred (optional)
   * @param {number} lineno - Line number where error occurred (optional)
   */
  handleGlobalError(error, context = 'System Error', filename = '', lineno = 0) {
    // Log error for debugging
    console.error(`${context}:`, error, filename ? `at ${filename}:${lineno}` : '');
    
    // Only handle errors related to form submission to avoid interfering with other parts of the app
    if (this.isSubmitting || this.isFormRelatedError(error)) {
      this.handleSystemError(error, context);
    }
  }

  /**
   * Determine if an error is related to form submission
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is form-related
   */
  isFormRelatedError(error) {
    if (!error || !error.stack) return false;
    
    const formRelatedKeywords = [
      'FormHandler',
      'submit',
      'form-handler',
      'validation',
      'fetch',
      'handleFormSubmission',
      'collectFormData',
      'validateForm'
    ];
    
    return formRelatedKeywords.some(keyword => 
      error.stack.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Handle system errors and unexpected exceptions
   * @param {Error} error - The system error
   * @param {string} context - Error context for debugging
   */
  handleSystemError(error, context = 'System Error') {
    console.error(`System error in ${context}:`, error);
    
    try {
      // Reset form state if we're in a submission
      if (this.isSubmitting) {
        this.isSubmitting = false;
        this.setLoadingState(false);
      }
      
      // Clear any existing errors
      this.clearAllErrorMessages();
      
      // Determine error type and show appropriate message
      const errorMessage = this.getSystemErrorMessage(error, context);
      
      // Show system error with fallback handling
      this.showSystemError(errorMessage, error);
      
    } catch (handlingError) {
      // Fallback error handling if our error handler fails
      console.error('Error in system error handler:', handlingError);
      this.showFallbackError();
    }
  }

  /**
   * Get user-friendly message for system errors
   * @param {Error} error - The system error
   * @param {string} context - Error context
   * @returns {string} User-friendly error message
   */
  getSystemErrorMessage(error, context) {
    // Check for specific error types
    if (error.name === 'TypeError') {
      if (error.message.includes('fetch')) {
        return 'Network connection problem. Please check your internet and try again.';
      }
      if (error.message.includes('null') || error.message.includes('undefined')) {
        return 'A technical issue occurred while processing your form. Please refresh the page and try again.';
      }
    }
    
    if (error.name === 'ReferenceError') {
      return 'A technical issue occurred with the form. Please refresh the page and try again.';
    }
    
    if (error.name === 'SyntaxError') {
      return 'A technical issue occurred. Please refresh the page and try again.';
    }
    
    if (error.name === 'RangeError') {
      return 'Invalid data provided. Please check your form entries and try again.';
    }
    
    if (context === 'Unhandled Promise Rejection') {
      return 'An unexpected error occurred during form submission. Please try again.';
    }
    
    // Generic system error message
    return 'An unexpected error occurred. Please refresh the page and try again, or contact support if the issue persists.';
  }

  /**
   * Show system error with enhanced UI feedback
   * @param {string} message - Error message to display
   * @param {Error} error - Original error for logging
   */
  showSystemError(message, error = null) {
    try {
      // Log the system error for debugging
      if (error) {
        this.logError(error, 'System Error Display', { userMessage: message });
      }
      
      // Show error state on button
      this.showErrorState();
      
      // Create enhanced system error display
      const errorContainer = this.getFormErrorContainer();
      if (errorContainer) {
        // Create system error element
        const systemErrorElement = document.createElement('div');
        systemErrorElement.className = 'p-4 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 system-error';
        systemErrorElement.setAttribute('role', 'alert');
        systemErrorElement.setAttribute('aria-live', 'assertive');
        
        // Add error icon
        const errorIcon = document.createElement('div');
        errorIcon.className = 'flex items-start';
        errorIcon.innerHTML = `
          <span class="flex-shrink-0 mr-2 text-red-500" aria-hidden="true">⚠️</span>
          <div class="flex-1">
            <h4 class="mb-1 font-medium text-red-800">System Error</h4>
            <p>${message}</p>
          </div>
        `;
        
        systemErrorElement.appendChild(errorIcon);
        
        // Add dismissible functionality
        const dismissButton = document.createElement('button');
        dismissButton.className = 'ml-2 text-red-400 rounded hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500';
        dismissButton.innerHTML = '×';
        dismissButton.setAttribute('aria-label', 'Dismiss error message');
        dismissButton.onclick = () => {
          systemErrorElement.remove();
          this.clearErrorState();
        };
        
        errorIcon.appendChild(dismissButton);
        
        // Show the error
        errorContainer.innerHTML = '';
        errorContainer.appendChild(systemErrorElement);
        errorContainer.classList.remove('hidden');
      } else {
        // Fallback to basic form error if container not available
        this.showFormError(message);
      }
      
      // Clear error state after delay
      setTimeout(() => {
        this.clearErrorState();
      }, 8000);
      
    } catch (displayError) {
      console.error('Error displaying system error:', displayError);
      this.showFallbackError();
    }
  }

  /**
   * Show fallback error when even the error handling system fails
   */
  showFallbackError() {
    try {
      // Last resort error display
      const fallbackMessage = 'A critical error occurred. Please refresh the page and try again.';
      
      if (this.submitButton) {
        // Update button to show error
        this.submitButton.textContent = 'Critical Error - Refresh Page';
        this.submitButton.className = 'px-4 py-2 w-full text-white bg-red-600 rounded-md';
        this.submitButton.disabled = true;
      }
      
      // Try to show basic alert if DOM manipulation fails
      setTimeout(() => {
        alert(fallbackMessage);
      }, 100);
      
    } catch (fallbackError) {
      console.error('Fallback error handler failed:', fallbackError);
    }
  }

  /**
   * Handle server response errors with detailed analysis
   * @param {Response} response - Failed server response
   * @returns {Promise<Error>} Processed error object
   */
  async handleServerResponseError(response) {
    let errorData = {
      status: response.status,
      statusText: response.statusText,
      message: 'Server error occurred'
    };
    
    try {
      // Try to parse error response body
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const jsonError = await response.json();
        errorData = { ...errorData, ...jsonError };
      } else if (contentType && contentType.includes('text/')) {
        const textError = await response.text();
        errorData.message = textError || errorData.message;
      }
      
    } catch (parseError) {
      console.warn('Could not parse server error response:', parseError);
    }
    
    // Create comprehensive error object
    const error = new Error(errorData.message);
    error.status = errorData.status;
    error.statusText = errorData.statusText;
    error.serverData = errorData;
    error.type = 'SERVER_ERROR';
    
    return error;
  }

  /**
   * Log error for debugging and monitoring
   * @param {Error} error - Error to log
   * @param {string} context - Context where error occurred
   * @param {Object} additionalData - Additional debug data
   */
  logError(error, context = 'Unknown', additionalData = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context: context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      formId: this.formId,
      ...additionalData
    };
    
    console.error('Form Handler Error Log:', errorLog);
    
         // In production, you might send this to an error monitoring service
     // this.sendErrorToMonitoring(errorLog);
   }

   /**
    * Setup keyboard navigation for error messages and accessibility
    */
   setupKeyboardNavigation() {
     if (!this.form) return;

     // Add keyboard event listener to form
     this.form.addEventListener('keydown', (event) => {
       this.handleErrorNavigationKeys(event);
     });

     // Add focus management for error messages
     document.addEventListener('keydown', (event) => {
       if (event.key === 'Escape') {
         this.handleEscapeKey(event);
       }
     });

     console.log('Keyboard navigation for errors enabled');
   }

   /**
    * Handle keyboard navigation within error messages
    * @param {KeyboardEvent} event - Keyboard event
    */
   handleErrorNavigationKeys(event) {
     // Navigate to first error with Ctrl+E
     if (event.ctrlKey && event.key === 'e') {
       event.preventDefault();
       this.focusFirstError();
       return;
     }

     // Navigate between errors with F6
     if (event.key === 'F6') {
       event.preventDefault();
       this.focusNextError();
       return;
     }
   }

   /**
    * Handle escape key for dismissing errors
    * @param {KeyboardEvent} event - Keyboard event
    */
   handleEscapeKey(event) {
     // Dismiss system errors on escape
     const systemErrors = document.querySelectorAll('.system-error');
     if (systemErrors.length > 0) {
       event.preventDefault();
       systemErrors.forEach(error => {
         const dismissButton = error.querySelector('button[aria-label*="Dismiss"]');
         if (dismissButton) {
           dismissButton.click();
         }
       });
     }

     // Dismiss connection status on escape
     const connectionStatus = document.querySelector('.connection-status');
     if (connectionStatus) {
       event.preventDefault();
       this.clearConnectionStatus();
     }
   }

   /**
    * Focus on the first error message for accessibility
    */
   focusFirstError() {
     // Look for field errors first
     const firstFieldError = this.form?.querySelector('.field-error');
     if (firstFieldError) {
       firstFieldError.focus();
       firstFieldError.scrollIntoView({ behavior: 'smooth', block: 'center' });
       return;
     }

     // Look for form errors
     const firstFormError = this.form?.querySelector('.form-error-container .error-message');
     if (firstFormError) {
       firstFormError.scrollIntoView({ behavior: 'smooth', block: 'center' });
       
       // Focus on associated field if available
       const associatedField = this.form.querySelector(`[aria-describedby="${firstFormError.id}"]`);
       if (associatedField) {
         associatedField.focus();
       }
       return;
     }

     console.log('No errors found to focus on');
   }

   /**
    * Focus on the next error in sequence
    */
   focusNextError() {
     const allErrors = this.form?.querySelectorAll('.field-error, .form-error-container .error-message');
     if (!allErrors || allErrors.length === 0) return;

     const currentFocus = document.activeElement;
     let currentIndex = -1;

     // Find current error index
     allErrors.forEach((error, index) => {
       if (error === currentFocus || error.contains(currentFocus)) {
         currentIndex = index;
       }
     });

     // Focus next error (or first if none currently focused)
     const nextIndex = (currentIndex + 1) % allErrors.length;
     const nextError = allErrors[nextIndex];
     
     if (nextError.focus) {
       nextError.focus();
     } else {
       // Find associated field for form errors
       const associatedField = this.form.querySelector(`[aria-describedby="${nextError.id}"]`);
       if (associatedField) {
         associatedField.focus();
       }
     }
     
     nextError.scrollIntoView({ behavior: 'smooth', block: 'center' });
   }

   /**
    * Enhanced error workflow integration with proper prioritization
    * @param {string} errorType - Type of error (validation, network, system)
    * @param {Object} errorData - Error data object
    */
   handleIntegratedErrorWorkflow(errorType, errorData) {
     try {
       // Clear existing errors based on priority
       switch (errorType) {
         case 'validation':
           // Clear only form and field errors, preserve system errors
           this.clearAllErrorMessages({ 
             priority: 'all', 
             preserveSystemErrors: true,
             animated: true 
           });
           break;
           
         case 'network':
           // Clear all errors except system errors during retry
           this.clearAllErrorMessages({ 
             priority: 'form', 
             preserveSystemErrors: true,
             animated: true 
           });
           break;
           
         case 'system':
           // Clear only non-critical errors, preserve validation errors if form is invalid
           this.clearAllErrorMessages({ 
             priority: 'form', 
             preserveSystemErrors: false,
             animated: true 
           });
           break;
           
         default:
           // Clear all errors
           this.clearAllErrorMessages({ animated: true });
       }

       // Show appropriate error based on type
       setTimeout(() => {
         switch (errorType) {
           case 'validation':
             this.displayFieldErrors(errorData.fieldErrors);
             break;
           case 'network':
             this.showFormError(errorData.message);
             break;
           case 'system':
             this.showSystemError(errorData.message, errorData.error);
             break;
         }
       }, 200); // Wait for clear animation to complete

     } catch (error) {
       console.error('Error in integrated error workflow:', error);
       this.showFallbackError();
     }
   }

   /**
    * Enhanced error state management to prevent conflicts
    */
   manageErrorStates() {
     // Ensure only one type of error state is active at a time
     const errorStates = ['btn-error', 'btn-loading', 'btn-success'];
     
     if (this.submitButton) {
       // Remove conflicting button states
       errorStates.forEach(state => {
         if (state !== 'btn-error') {
           this.submitButton.classList.remove(state);
         }
       });
     }

     // Manage form states
     const formStates = ['form-loading', 'form-disabled'];
     formStates.forEach(state => {
       if (this.form) {
         this.form.classList.remove(state);
       }
     });
   }

   /**
    * Complete error handling workflow test
    * @returns {Object} Test results
    */
   testErrorHandlingWorkflow() {
     const testResults = {
       domManagement: false,
       fieldValidation: false,
       networkHandling: false,
       systemErrorHandling: false,
       keyboardNavigation: false,
       accessibility: false
     };

     try {
       // Test DOM error management
       this.clearAllErrorMessages();
       this.showFieldError('test', 'Test error message');
       testResults.domManagement = this.form.querySelector('.field-error-message') !== null;
       this.clearAllErrorMessages();

       // Test field validation
       const testData = new FormData();
       const validation = this.validateForm(testData);
       testResults.fieldValidation = !validation.isValid && Object.keys(validation.fieldErrors).length > 0;

       // Test network error classification
       const networkError = new Error('fetch failed');
       networkError.name = 'TypeError';
       const errorType = this.classifyNetworkError(networkError);
       testResults.networkHandling = errorType === 'NETWORK_ERROR';

       // Test system error handling
       testResults.systemErrorHandling = typeof this.handleSystemError === 'function';

       // Test keyboard navigation
       testResults.keyboardNavigation = typeof this.focusFirstError === 'function';

       // Test accessibility features
       const errorElement = this.createErrorElement('Test', 'field', 'test-field');
       testResults.accessibility = errorElement.getAttribute('role') === 'alert';
       errorElement.remove();

       console.log('Error handling workflow test results:', testResults);
       return testResults;

     } catch (error) {
       console.error('Error during workflow testing:', error);
       return testResults;
     }
   }

  /**
   * Enhanced form submission with comprehensive loading state integration
   */
  async handleFormSubmission(event) {
    // Prevent default form submission
    event.preventDefault();
    
    // Prevent double submission
    if (this.isSubmitting) {
      console.warn('Form submission already in progress, ignoring duplicate request');
      return;
    }

    let timeoutId = null;

    try {
      this.isSubmitting = true;
      
      // Clear any existing error messages before new submission
      this.clearAllErrorMessages();
      
      // Enable comprehensive loading state
      this.setLoadingState(true);
      
      // Set up submission timeout (30 seconds)
      timeoutId = setTimeout(() => {
        if (this.isSubmitting) {
          this.handleSubmissionTimeout();
        }
      }, 30000);
      
      // Collect form data
      const formData = this.collectFormData();
      
      // Validate form data before submission
      const validation = this.validateForm(formData);
      if (!validation.isValid) {
        // Use integrated error workflow for validation errors
        this.handleIntegratedErrorWorkflow('validation', { fieldErrors: validation.fieldErrors });
        
        // Show error state briefly to indicate validation failure
        this.showErrorState();
        setTimeout(() => {
          this.clearErrorState();
        }, 3000);
        
        return; // Stop submission if validation fails
      }
      
      // Submit form data with enhanced error handling
      await this.submitFormDataWithProgress(formData);
      
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Always reset submission state and loading state
      this.isSubmitting = false;
      this.setLoadingState(false);
    }
  }

  /**
   * Submit form data with progress tracking and enhanced network error handling
   */
  async submitFormDataWithProgress(formData) {
    return this.submitWithRetry(formData, 3); // Allow up to 3 attempts
  }

  /**
   * Submit form data with automatic retry mechanism for network failures
   * @param {FormData} formData - Form data to submit
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} currentAttempt - Current attempt number (starts at 1)
   */
  async submitWithRetry(formData, maxRetries = 3, currentAttempt = 1) {
    const formAction = this.form.action || '/api/submit-to-notion';
    
    try {
      // Check for offline condition before attempting submission
      if (!this.isOnline()) {
        throw new Error('OFFLINE');
      }
      
      // Add progress indication
      this.updateSubmissionProgress(25); // Form data prepared
      
      // Create fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
      
      const response = await fetch(formAction, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Let browser set Content-Type for FormData
        }
      });

      clearTimeout(timeoutId);
      this.updateSubmissionProgress(75); // Response received

      if (response.redirected) {
        // Handle successful submission with redirect
        this.updateSubmissionProgress(100);
        await this.handleSuccessfulSubmission(response.url);
      } else if (response.ok) {
        // Handle successful submission without redirect
        this.updateSubmissionProgress(100);
        await this.handleSuccessfulSubmission();
      } else {
        // Handle HTTP error responses
        this.updateSubmissionProgress(100);
        await this.handleHttpError(response, currentAttempt, maxRetries, formData);
      }
    } catch (error) {
      this.updateSubmissionProgress(100);
      
      // Handle network errors with retry logic
      await this.handleNetworkError(error, formData, maxRetries, currentAttempt);
    }
  }

  /**
   * Handle HTTP error responses with appropriate retry logic
   * @param {Response} response - Failed HTTP response
   * @param {number} currentAttempt - Current attempt number
   * @param {number} maxRetries - Maximum retry attempts
   * @param {FormData} formData - Original form data for retry
   */
  async handleHttpError(response, currentAttempt, maxRetries, formData) {
    const status = response.status;
    
    // Get error message from response
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { 
        message: 'Submission failed',
        status: status,
        statusText: response.statusText
      };
    }
    
    // Determine if error is retryable
    const isRetryable = this.isRetryableHttpError(status);
    
    if (isRetryable && currentAttempt < maxRetries) {
      // Show retry message
      this.showRetryMessage(`Server error (${status}). Retrying... (${currentAttempt}/${maxRetries})`);
      
      // Calculate retry delay (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, currentAttempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return this.submitWithRetry(formData, maxRetries, currentAttempt + 1);
    } else {
      // Non-retryable error or max retries exceeded
      const errorMessage = errorData.message || this.getHttpErrorMessage(status);
      throw new Error(errorMessage);
    }
  }

  /**
   * Handle network errors with comprehensive error detection and retry
   * @param {Error} error - Network error object
   * @param {FormData} formData - Original form data for retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} currentAttempt - Current attempt number
   */
  async handleNetworkError(error, formData, maxRetries, currentAttempt) {
    const errorType = this.classifyNetworkError(error);
    
    switch (errorType) {
      case 'OFFLINE':
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
        
      case 'TIMEOUT':
        if (currentAttempt < maxRetries) {
          this.showRetryMessage(`Connection timed out. Retrying... (${currentAttempt}/${maxRetries})`);
          
          // Wait before retry (timeout errors get longer delays)
          const delay = Math.min(2000 * currentAttempt, 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.submitWithRetry(formData, maxRetries, currentAttempt + 1);
        } else {
          throw new Error('Connection timed out after multiple attempts. Please try again later.');
        }
        
      case 'DNS_FAILURE':
        throw new Error('Unable to reach the server. Please check your internet connection.');
        
      case 'CONNECTION_REFUSED':
        if (currentAttempt < maxRetries) {
          this.showRetryMessage(`Connection failed. Retrying... (${currentAttempt}/${maxRetries})`);
          
          const delay = Math.min(1500 * currentAttempt, 6000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.submitWithRetry(formData, maxRetries, currentAttempt + 1);
        } else {
          throw new Error('Unable to connect to the server. Please try again later.');
        }
        
      case 'NETWORK_ERROR':
      default:
        if (currentAttempt < maxRetries) {
          this.showRetryMessage(`Network error. Retrying... (${currentAttempt}/${maxRetries})`);
          
          const delay = Math.min(1000 * currentAttempt, 4000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.submitWithRetry(formData, maxRetries, currentAttempt + 1);
        } else {
          throw new Error('Network error after multiple attempts. Please check your connection and try again.');
        }
    }
  }

  /**
   * Classify network error types for appropriate handling
   * @param {Error} error - Error object to classify
   * @returns {string} Error type classification
   */
  classifyNetworkError(error) {
    if (error.message === 'OFFLINE' || !this.isOnline()) {
      return 'OFFLINE';
    }
    
    if (error.name === 'AbortError') {
      return 'TIMEOUT';
    }
    
    if (error.name === 'TypeError') {
      if (error.message.includes('fetch')) {
        if (error.message.includes('DNS') || error.message.includes('resolve')) {
          return 'DNS_FAILURE';
        }
        if (error.message.includes('refused') || error.message.includes('ECONNREFUSED')) {
          return 'CONNECTION_REFUSED';
        }
        return 'NETWORK_ERROR';
      }
    }
    
    return 'NETWORK_ERROR';
  }

  /**
   * Check if the browser is currently online
   * @returns {boolean} True if online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Determine if an HTTP status code indicates a retryable error
   * @param {number} status - HTTP status code
   * @returns {boolean} True if error is retryable
   */
  isRetryableHttpError(status) {
    // Retryable: 5xx server errors and some 4xx errors
    const retryableCodes = [
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
      507, // Insufficient Storage
      508, // Loop Detected
      509, // Bandwidth Limit Exceeded
      510  // Not Extended
    ];
    
    return retryableCodes.includes(status);
  }

  /**
   * Get user-friendly message for HTTP error codes
   * @param {number} status - HTTP status code
   * @returns {string} User-friendly error message
   */
  getHttpErrorMessage(status) {
    const messages = {
      400: 'The form data is invalid. Please check your entries and try again.',
      401: 'Authentication required. Please refresh the page and try again.',
      403: 'Access denied. You do not have permission to submit this form.',
      404: 'The submission endpoint was not found. Please contact support.',
      405: 'This submission method is not allowed. Please contact support.',
      409: 'There was a conflict with your submission. Please try again.',
      410: 'This form is no longer available.',
      413: 'Your message is too large. Please shorten it and try again.',
      415: 'The form data format is not supported.',
      422: 'The form data could not be processed. Please check your entries.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. We are working to fix this issue.',
      502: 'Server temporarily unavailable. Please try again in a moment.',
      503: 'Service temporarily unavailable. Please try again later.',
      504: 'Server response timed out. Please try again.',
      507: 'Server storage full. Please try again later.',
      508: 'Server configuration error. Please contact support.',
      509: 'Bandwidth limit exceeded. Please try again later.',
      510: 'Server configuration incomplete. Please contact support.'
    };
    
    return messages[status] || `Server error (${status}). Please try again or contact support.`;
  }

  /**
   * Show retry message to user during retry attempts
   * @param {string} message - Retry message to display
   */
  showRetryMessage(message) {
    console.log('Retry message:', message);
    
    // Update button text to show retry status
    if (this.submitButton) {
      const textSpan = this.submitButton.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = 'Retrying...';
      }
      
      // Update aria-label for accessibility
      this.submitButton.setAttribute('aria-label', message);
    }
  }

  /**
   * Handle submission timeout
   */
  handleSubmissionTimeout() {
    console.error('Form submission timed out');
    this.isSubmitting = false;
    this.setLoadingState(false);
    this.handleSubmissionError(new Error('Request timed out. Please try again.'));
  }

  /**
   * Update submission progress indicator
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateSubmissionProgress(percentage) {
    try {
      if (this.submitButton && this.submitButton.classList.contains('btn-loading')) {
        // Update progress bar if with-progress class is present
        if (this.submitButton.classList.contains('with-progress')) {
          this.submitButton.style.setProperty('--loading-progress', `${percentage}%`);
        }
        
        // Update aria-label with progress info
        if (percentage < 100) {
          this.submitButton.setAttribute('aria-label', 
            `Submitting form, ${percentage}% complete, please wait`);
        }
      }
    } catch (error) {
      console.warn('Error updating submission progress:', error);
    }
  }

  /**
   * Validate form data before submission with field-specific errors
   * @param {FormData} formData
   * @returns {Object} Validation result with isValid boolean and fieldErrors object
   */
  validateForm(formData) {
    const fieldErrors = {};
    let isValid = true;
    
    // Name validation
    const name = formData.get('name')?.toString().trim();
    if (!name) {
      fieldErrors.name = 'Name is required';
      isValid = false;
    } else if (name.length < 2) {
      fieldErrors.name = 'Name must be at least 2 characters long';
      isValid = false;
    } else if (name.length > 100) {
      fieldErrors.name = 'Name must be less than 100 characters';
      isValid = false;
    } else if (!/^[a-zA-Z\s\-'.]+$/.test(name)) {
      fieldErrors.name = 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
      isValid = false;
    }
    
    // Email validation
    const email = formData.get('email')?.toString().trim();
    if (!email) {
      fieldErrors.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      fieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    } else if (email.length > 254) {
      fieldErrors.email = 'Email address is too long';
      isValid = false;
    }
    
    // Service validation
    const service = formData.get('service')?.toString().trim();
    if (!service) {
      fieldErrors.service = 'Please select a service';
      isValid = false;
    } else {
      const validServices = ['Design', 'Rhythm', 'Color', 'Motion'];
      if (!validServices.includes(service)) {
        fieldErrors.service = 'Please select a valid service option';
        isValid = false;
      }
    }
    
    // Message validation
    const message = formData.get('message')?.toString().trim();
    if (!message) {
      fieldErrors.message = 'Message is required';
      isValid = false;
    } else if (message.length < 10) {
      fieldErrors.message = 'Message must be at least 10 characters long';
      isValid = false;
    } else if (message.length > 5000) {
      fieldErrors.message = 'Message must be less than 5000 characters';
      isValid = false;
    }
    
    return {
      isValid,
      fieldErrors
    };
  }

  /**
   * Enhanced email validation function
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email is valid
   */
  isValidEmail(email) {
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Display field validation errors in the UI
   * @param {Object} fieldErrors - Object containing field names and error messages
   */
  displayFieldErrors(fieldErrors) {
    // Clear existing errors first
    this.clearAllErrorMessages();
    
    // Display each field error
    Object.entries(fieldErrors).forEach(([fieldName, errorMessage]) => {
      this.showFieldError(fieldName, errorMessage);
    });
    
    // Focus on the first field with an error for accessibility
    const firstErrorField = Object.keys(fieldErrors)[0];
    if (firstErrorField) {
      const field = this.form.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`);
      if (field) {
        field.focus();
      }
    }
    
    console.log('Field validation errors displayed:', fieldErrors);
  }

  /**
   * Collect and validate form data using FormData API
   */
  collectFormData() {
    if (!this.form) {
      throw new Error('Form element not available for data collection');
    }

    const formData = new FormData(this.form);
    
    // Log collected data for debugging (remove in production)
    console.log('Form data collected:', Object.fromEntries(formData.entries()));
    
    return formData;
  }

  /**
   * Submit form data using fetch API
   */
  async submitFormData(formData) {
    const formAction = this.form.action || '/api/submit-to-notion';
    
    try {
      const response = await fetch(formAction, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it for FormData
        headers: {
          // Remove any content-type headers to let browser handle FormData
        }
      });

      if (response.redirected) {
        // Handle successful submission with redirect
        this.handleSuccessfulSubmission(response.url);
      } else if (response.ok) {
        // Handle successful submission without redirect
        this.handleSuccessfulSubmission();
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({ message: 'Submission failed' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Please check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * Handle successful form submission with enhanced loading state management
   */
  async handleSuccessfulSubmission(redirectUrl = null) {
    console.log('Form submitted successfully');
    
    try {
      // Replace entire form content with success message (now async)
      await this.replaceFormContentWithSuccess();
      
      // Handle redirect if provided
      if (redirectUrl) {
        // Enhanced delayed redirect with visual countdown and safety features
        await this.executeDelayedRedirect(redirectUrl);
      } else {
        // If no redirect, keep success message visible
        console.log('Form submission completed successfully - no redirect provided');
      }
      
    } catch (error) {
      console.error('Error in success handling:', error);
      // Fallback to original success handling if form replacement fails
      this.showSuccessState();
      this.showSuccessMessage();
      
      if (redirectUrl) {
        await this.executeDelayedRedirect(redirectUrl);
      }
    }
  }

  /**
   * Execute delayed redirect with enhanced visual feedback and safety features
   * @param {string} redirectUrl - URL to redirect to
   */
  async executeDelayedRedirect(redirectUrl) {
    try {
      // Validate redirect URL for security
      if (!this.isValidRedirectUrl(redirectUrl)) {
        console.warn('Invalid redirect URL provided:', redirectUrl);
        return;
      }

      // Enhanced 1-second delay with progress indication
      await this.countdownRedirect();

      // Perform programmatic redirect
      console.log('Redirecting to:', redirectUrl);
      
      // Use window.location.href for programmatic redirect
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Error during delayed redirect:', error);
      // Fallback: try redirect without delay
      window.location.href = redirectUrl;
    }
  }

  /**
   * Visual countdown for redirect with progress updates
   */
  async countdownRedirect() {
    return new Promise((resolve) => {
      let timeRemaining = 1000; // 1 second in milliseconds
      const updateInterval = 100; // Update every 100ms for smooth progress

      const countdownInterval = setInterval(() => {
        timeRemaining -= updateInterval;

        // Update progress bar if visible
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
          const progress = ((1000 - timeRemaining) / 1000) * 100;
          progressFill.style.width = `${Math.min(progress, 100)}%`;
        }

        // Update any countdown text if present
        const redirectMessage = document.querySelector('.success-replacement-container p');
        if (redirectMessage) {
          const secondsLeft = Math.ceil(timeRemaining / 1000);
          if (secondsLeft > 0) {
            redirectMessage.innerHTML = `Redirecting in ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}...`;
          } else {
            redirectMessage.innerHTML = 'Redirecting now...';
          }
        }

        if (timeRemaining <= 0) {
          clearInterval(countdownInterval);
          resolve();
        }
      }, updateInterval);
    });
  }

  /**
   * Validate redirect URL for security purposes
   * @param {string} url - URL to validate
   * @returns {boolean} Whether the URL is valid and safe
   */
  isValidRedirectUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Allow same-origin redirects
      if (urlObj.origin === window.location.origin) {
        return true;
      }

      // Allow specific external domains if needed (customize as required)
      const allowedDomains = ['https://example.com'];
      return allowedDomains.includes(urlObj.origin);

    } catch (error) {
      console.error('Invalid URL format:', url, error);
      return false;
    }
  }

  /**
   * Handle submission errors with enhanced state management and integrated workflow
   */
  handleSubmissionError(error) {
    console.error('Form submission error:', error);
    
    try {
      // Manage error states to prevent conflicts
      this.manageErrorStates();
      
      // Determine error type and use integrated workflow
      let errorType = 'network'; // Default to network error
      
      if (error.type === 'SERVER_ERROR') {
        errorType = 'system';
      } else if (error.name === 'TypeError' || error.name === 'AbortError') {
        errorType = 'network';
      }
      
      // Use integrated error workflow
      this.handleIntegratedErrorWorkflow(errorType, { 
        message: error.message, 
        error: error 
      });
      
      // Show error state on button
      this.showErrorState();
      
      // Clear error state after a delay to allow user to read message
      setTimeout(() => {
        this.clearErrorState();
      }, 5000);
      
    } catch (errorHandlingError) {
      console.error('Error in error handling:', errorHandlingError);
      this.showFallbackError();
    }
  }

  /**
   * Show success state on button
   */
  showSuccessState() {
    if (this.submitButton) {
      // Add success class for styling
      this.submitButton.classList.add('btn-success');
      
      // Update text for success
      const textSpan = this.submitButton.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = 'Success!';
        textSpan.style.opacity = '1';
      }
      
      // Remove spinner and show checkmark
      const spinner = this.submitButton.querySelector('.loading-spinner');
      if (spinner) {
        spinner.remove();
      }
      
      // Add checkmark (using text content for now, could be enhanced with icon)
      const checkmark = document.createElement('span');
      checkmark.textContent = '✓';
      checkmark.className = 'success-icon';
      checkmark.setAttribute('aria-hidden', 'true');
      this.submitButton.appendChild(checkmark);
      
      // Update aria-label
      this.submitButton.setAttribute('aria-label', 'Form submitted successfully');
    }
  }

  /**
   * Show error state on button and form
   */
  showErrorState() {
    if (this.submitButton) {
      // Add error class for styling
      this.submitButton.classList.add('btn-error');
      
      // Update text for error
      const textSpan = this.submitButton.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = 'Error - Try Again';
        textSpan.style.opacity = '1';
      }
      
      // Remove spinner
      const spinner = this.submitButton.querySelector('.loading-spinner');
      if (spinner) {
        spinner.remove();
      }
      
      // Update aria-label
      this.submitButton.setAttribute('aria-label', 'Form submission failed, try again');
    }
    
    // Add error class to form for styling
    if (this.form) {
      this.form.classList.add('form-error');
    }
  }

  /**
   * Clear error state and restore normal state
   */
  clearErrorState() {
    if (this.submitButton) {
      this.submitButton.classList.remove('btn-error');
      
      // Restore original text
      const originalText = this.submitButton.dataset.originalText || 'Submit';
      const textSpan = this.submitButton.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = originalText;
      }
      
      // Restore aria-label
      this.submitButton.setAttribute('aria-label', originalText);
    }
    
    // Remove error class from form
    if (this.form) {
      this.form.classList.remove('form-error');
    }
  }

  /**
   * Enhanced loading state controller using CSS classes
   * @param {boolean} isLoading - Whether to show loading state
   */
  setLoadingState(isLoading) {
    if (isLoading) {
      // Enable loading state
      this.enableLoadingState();
    } else {
      // Disable loading state
      this.disableLoadingState();
    }
  }

  /**
   * Enable comprehensive loading state across form and button
   */
  enableLoadingState() {
    try {
      // Add form-wide loading state
      if (this.form) {
        this.form.classList.add('form-loading');
        this.form.classList.add('form-disabled');
      }

      // Configure button loading state
      if (this.submitButton) {
        // Store original button text if not already stored
        if (!this.submitButton.dataset.originalText) {
          this.submitButton.dataset.originalText = this.submitButton.textContent || 'Submit';
        }

        // Add loading classes
        this.submitButton.classList.add('btn-loading');
        this.submitButton.disabled = true;
        this.submitButton.setAttribute('aria-disabled', 'true');

        // Wrap existing text in btn-text span if not already wrapped
        if (!this.submitButton.querySelector('.btn-text')) {
          const textSpan = document.createElement('span');
          textSpan.className = 'btn-text';
          textSpan.textContent = this.submitButton.textContent;
          this.submitButton.innerHTML = '';
          this.submitButton.appendChild(textSpan);
        }

        // Add loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        this.submitButton.appendChild(spinner);

        // Update button text content for screen readers
        this.submitButton.setAttribute('aria-label', 'Submitting form, please wait');
      }

      // Disable all form fields
      this.disableFormFields(true);

      console.log('Loading state enabled');
    } catch (error) {
      console.error('Error enabling loading state:', error);
    }
  }

  /**
   * Disable loading state and restore form functionality
   */
  disableLoadingState() {
    try {
      // Remove form-wide loading state
      if (this.form) {
        this.form.classList.remove('form-loading');
        this.form.classList.remove('form-disabled');
      }

      // Restore button state
      if (this.submitButton) {
        // Remove loading classes
        this.submitButton.classList.remove('btn-loading');
        this.submitButton.disabled = false;
        this.submitButton.removeAttribute('aria-disabled');

        // Remove spinner
        const spinner = this.submitButton.querySelector('.loading-spinner');
        if (spinner) {
          spinner.remove();
        }

        // Restore original text
        const originalText = this.submitButton.dataset.originalText || 'Submit';
        const textSpan = this.submitButton.querySelector('.btn-text');
        if (textSpan) {
          textSpan.textContent = originalText;
        } else {
          this.submitButton.textContent = originalText;
        }

        // Restore button aria-label
        this.submitButton.setAttribute('aria-label', originalText);
      }

      // Re-enable all form fields
      this.disableFormFields(false);

      console.log('Loading state disabled');
    } catch (error) {
      console.error('Error disabling loading state:', error);
    }
  }

  /**
   * Disable or enable all form fields
   * @param {boolean} disable - Whether to disable fields
   */
  disableFormFields(disable) {
    if (!this.form) return;

    const fields = this.form.querySelectorAll('input, textarea, select, button');
    fields.forEach(field => {
      if (disable) {
        field.disabled = true;
        field.classList.add('field-disabled');
        field.setAttribute('aria-disabled', 'true');
      } else {
        // Only re-enable if not the submit button during loading
        if (field !== this.submitButton) {
          field.disabled = false;
          field.classList.remove('field-disabled');
          field.removeAttribute('aria-disabled');
        }
      }
    });
  }

  /**
   * Clear all error messages from the form with enhanced lifecycle management
   * @param {Object} options - Clearing options
   */
  clearAllErrorMessages(options = {}) {
    if (!this.form) return;

    const {
      animated = true,
      priority = 'all',
      preserveSystemErrors = false
    } = options;

    try {
      // Clear field-specific errors based on priority
      if (priority === 'all' || priority === 'field') {
        this.clearFieldErrors(animated);
      }

      // Clear form-level errors based on priority
      if (priority === 'all' || priority === 'form') {
        this.clearFormErrors(animated, preserveSystemErrors);
      }

      // Clear connection status if not preserving system errors
      if (!preserveSystemErrors) {
        this.clearConnectionStatus();
      }

      // Remove form error state
      this.form.classList.remove('form-error');

      console.log(`Error messages cleared (priority: ${priority}, animated: ${animated})`);
    } catch (error) {
      console.error('Error clearing error messages:', error);
    }
  }

  /**
   * Clear field-specific errors with smooth transitions
   * @param {boolean} animated - Whether to use animations
   */
  clearFieldErrors(animated = true) {
    const fieldErrors = this.form.querySelectorAll('.field-error-message');
    const errorFields = this.form.querySelectorAll('.field-error');

    if (animated) {
      // Animate out field errors
      fieldErrors.forEach(error => {
        error.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
        error.style.opacity = '0';
        error.style.transform = 'translateY(-10px)';
        setTimeout(() => error.remove(), 200);
      });
    } else {
      // Remove immediately
      fieldErrors.forEach(error => error.remove());
    }

    // Clear error styling from fields
    errorFields.forEach(field => {
      field.classList.remove('field-error', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      field.removeAttribute('aria-describedby');
      field.removeAttribute('aria-invalid');
    });
  }

  /**
   * Clear form-level errors with priority handling
   * @param {boolean} animated - Whether to use animations
   * @param {boolean} preserveSystemErrors - Whether to preserve system errors
   */
  clearFormErrors(animated = true, preserveSystemErrors = false) {
    const formErrorContainer = this.form.querySelector('.form-error-container');
    if (!formErrorContainer) return;

    if (preserveSystemErrors) {
      // Only clear non-system errors
      const nonSystemErrors = formErrorContainer.querySelectorAll('.error-message:not(.system-error)');
      if (animated) {
        nonSystemErrors.forEach(error => {
          error.style.transition = 'opacity 0.2s ease-out';
          error.style.opacity = '0';
          setTimeout(() => error.remove(), 200);
        });
      } else {
        nonSystemErrors.forEach(error => error.remove());
      }
    } else {
      // Clear all form errors
      if (animated) {
        formErrorContainer.style.transition = 'opacity 0.2s ease-out';
        formErrorContainer.style.opacity = '0';
        setTimeout(() => {
          formErrorContainer.innerHTML = '';
          formErrorContainer.classList.add('hidden');
          formErrorContainer.style.opacity = '';
          formErrorContainer.style.transition = '';
        }, 200);
      } else {
        formErrorContainer.innerHTML = '';
        formErrorContainer.classList.add('hidden');
      }
    }
  }

  /**
   * Clear connection status messages
   */
  clearConnectionStatus() {
    const connectionStatus = document.querySelector('.connection-status');
    if (connectionStatus) {
      connectionStatus.style.opacity = '0';
      setTimeout(() => connectionStatus.remove(), 200);
    }
  }

  /**
   * Create a standardized error message element
   * @param {string} message - Error message text
   * @param {string} type - Error type ('field' or 'form')
   * @param {string} fieldId - Associated field ID for accessibility
   * @returns {HTMLElement} Error message element
   */
  createErrorElement(message, type = 'field', fieldId = null) {
    const errorElement = document.createElement('div');
    
    // Base classes for all error messages
    errorElement.className = `mt-1 text-sm text-red-500 transition-opacity duration-200 error-message`;
    
    // Add type-specific classes
    if (type === 'field') {
      errorElement.classList.add('field-error-message');
      if (fieldId) {
        errorElement.id = `${fieldId}-error`;
      }
    } else if (type === 'form') {
      errorElement.classList.add('form-error-message', 'p-3', 'bg-red-50', 'border', 'border-red-200', 'rounded-md');
    }

    // Set message content
    errorElement.textContent = message;

    // Add accessibility attributes
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');

    return errorElement;
  }

  /**
   * Show error message for a specific form field
   * @param {string} fieldName - Name attribute of the field
   * @param {string} message - Error message to display
   */
  showFieldError(fieldName, message) {
    if (!this.form) return;

    try {
      const field = this.form.querySelector(`[name="${fieldName}"], #${fieldName}`);
      if (!field) {
        console.warn(`Field not found: ${fieldName}`);
        return;
      }

      // Clear existing error for this field
      this.clearFieldError(fieldName);

      // Add error styling to field
      field.classList.add('field-error', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      field.setAttribute('aria-invalid', 'true');

      // Create error message element
      const errorElement = this.createErrorElement(message, 'field', field.id || fieldName);

      // Position error message after the field
      const insertPosition = field.parentNode;
      insertPosition.insertBefore(errorElement, field.nextSibling);

      // Associate error with field for accessibility
      field.setAttribute('aria-describedby', errorElement.id);

      console.log(`Field error shown for ${fieldName}:`, message);
    } catch (error) {
      console.error(`Error showing field error for ${fieldName}:`, error);
    }
  }

  /**
   * Clear error message for a specific field
   * @param {string} fieldName - Name attribute of the field
   */
  clearFieldError(fieldName) {
    if (!this.form) return;

    try {
      const field = this.form.querySelector(`[name="${fieldName}"], #${fieldName}`);
      if (!field) return;

      // Remove error styling from field
      field.classList.remove('field-error', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');

      // Remove associated error message
      const errorId = field.id ? `${field.id}-error` : `${fieldName}-error`;
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
    } catch (error) {
      console.error(`Error clearing field error for ${fieldName}:`, error);
    }
  }

  /**
   * Show form-level error message
   * @param {string} message - Error message to display
   */
  showFormError(message) {
    if (!this.form) return;

    try {
      // Get or create form error container
      const errorContainer = this.getFormErrorContainer();

      // Create form error element
      const errorElement = this.createErrorElement(message, 'form');

      // Add error icon
      const errorIcon = document.createElement('span');
      errorIcon.innerHTML = '⚠️';
      errorIcon.className = 'inline-block mr-2';
      errorIcon.setAttribute('aria-hidden', 'true');
      errorElement.insertBefore(errorIcon, errorElement.firstChild);

      // Clear existing form errors and add new one
      errorContainer.innerHTML = '';
      errorContainer.appendChild(errorElement);
      errorContainer.classList.remove('hidden');

      // Add error state to form
      this.form.classList.add('form-error');

      console.log('Form error shown:', message);
    } catch (error) {
      console.error('Error showing form error:', error);
    }
  }

  /**
   * Get or create the form-level error container
   * @returns {HTMLElement} Form error container
   */
  getFormErrorContainer() {
    if (!this.form) return null;

    // Look for existing container
    let container = this.form.querySelector('.form-error-container');

    if (!container) {
      // Create new container
      container = document.createElement('div');
      container.className = 'hidden mb-4 form-error-container';

      // Position at the top of the form
      this.form.insertBefore(container, this.form.firstChild);
    }

    return container;
  }

  /**
   * Create success message component HTML structure
   * @returns {HTMLElement} Complete success message component
   */
  createSuccessMessageComponent() {
    // Create main success container
    const successContainer = document.createElement('div');
    successContainer.className = 'success-replacement-container flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm';
    successContainer.setAttribute('role', 'alert');
    successContainer.setAttribute('aria-live', 'polite');

    // Create success icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full';

    // Create animated checkmark icon
    const checkmarkIcon = document.createElement('div');
    checkmarkIcon.className = 'success-checkmark text-green-600 text-2xl font-bold';
    checkmarkIcon.innerHTML = '✓';
    checkmarkIcon.setAttribute('aria-hidden', 'true');

    iconContainer.appendChild(checkmarkIcon);

    // Create main success message
    const mainMessage = document.createElement('h3');
    mainMessage.className = 'mb-2 text-xl font-semibold text-gray-900';
    mainMessage.textContent = 'Message sent successfully!';

    // Create redirect message with animated dots
    const redirectMessage = document.createElement('p');
    redirectMessage.className = 'mb-4 text-gray-600';
    redirectMessage.innerHTML = 'Redirecting<span class="loading-dots">...</span>';

    // Create progress indicator (optional visual enhancement)
    const progressContainer = document.createElement('div');
    progressContainer.className = 'w-full max-w-xs';

    const progressBar = document.createElement('div');
    progressBar.className = 'h-1 bg-gray-200 rounded-full overflow-hidden';

    const progressFill = document.createElement('div');
    progressFill.className = 'h-full bg-green-500 rounded-full transition-all duration-1000 ease-out progress-fill';
    progressFill.style.width = '0%';

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    // Assemble the complete component
    successContainer.appendChild(iconContainer);
    successContainer.appendChild(mainMessage);
    successContainer.appendChild(redirectMessage);
    successContainer.appendChild(progressContainer);

    return successContainer;
  }

  /**
   * Show success message with enhanced UI (legacy method - now calls createSuccessMessageComponent)
   */
  showSuccessMessage() {
    if (!this.form) return;

    try {
      // Clear any existing errors first
      this.clearAllErrorMessages();

      // Get or create success container
      const successContainer = this.getSuccessContainer();

      // Create success message element using new component
      const successElement = this.createSuccessMessageComponent();

      // Show success message
      successContainer.innerHTML = '';
      successContainer.appendChild(successElement);
      successContainer.classList.remove('hidden');

      console.log('Success message component shown');

      // Start progress animation
      const progressFill = successElement.querySelector('.progress-fill');
      if (progressFill) {
        // Animate progress bar over 1 second
        setTimeout(() => {
          progressFill.style.width = '100%';
        }, 100);
      }

      // Animate loading dots
      this.animateLoadingDots(successElement.querySelector('.loading-dots'));

    } catch (error) {
      console.error('Error showing success message:', error);
    }
  }

  /**
   * Animate loading dots for redirect message
   * @param {HTMLElement} dotsElement - Element containing dots to animate
   */
  animateLoadingDots(dotsElement) {
    if (!dotsElement) return;

    let dotCount = 0;
    const animationInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      dotsElement.textContent = '.'.repeat(dotCount);
    }, 500);

    // Store interval ID for cleanup
    dotsElement.dataset.animationInterval = animationInterval;

    // Clean up after 1 second
    setTimeout(() => {
      clearInterval(animationInterval);
    }, 1000);
  }

  /**
   * Replace entire form content with success message component
   * This creates the main visual transition for successful submissions
   */
  async replaceFormContentWithSuccess() {
    if (!this.form) return;

    try {
      // Store original form content for potential restoration
      if (!this.form.dataset.originalContent) {
        this.form.dataset.originalContent = this.form.innerHTML;
      }

      // Fade out existing form content first
      await this.fadeOutFormContent();

      // Create success message component
      const successComponent = this.createSuccessMessageComponent();

      // Clear all existing form content
      this.form.innerHTML = '';

      // Add success component to form
      this.form.appendChild(successComponent);

      // Add identifying class to form for styling
      this.form.classList.add('form-success-replaced');

      // Maintain form dimensions to prevent layout shift
      this.form.style.minHeight = '300px';

      console.log('Form content replaced with success message');

      // Start visual enhancements with fade-in
      this.startSuccessAnimations(successComponent);

      return successComponent;

    } catch (error) {
      console.error('Error replacing form content:', error);
      // Fallback to original success message method
      this.showSuccessMessage();
    }
  }

  /**
   * Smoothly fade out the existing form content before replacement
   * @returns {Promise} Promise that resolves when fade out is complete
   */
  fadeOutFormContent() {
    return new Promise((resolve) => {
      if (!this.form) {
        resolve();
        return;
      }

      // Add fade-out transition
      this.form.style.transition = 'opacity 0.3s ease-out';
      this.form.style.opacity = '0.5';

      // Wait for fade-out to complete
      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  /**
   * Smoothly fade in the success content after replacement
   * @param {HTMLElement} element - Element to fade in
   * @returns {Promise} Promise that resolves when fade in is complete
   */
  fadeInSuccessContent(element) {
    return new Promise((resolve) => {
      if (!element) {
        resolve();
        return;
      }

      // Start with invisible element
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px) scale(0.98)';
      element.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      // Trigger fade-in animation
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scale(1)';
      });

      // Resolve when animation completes
      setTimeout(() => {
        resolve();
      }, 400);
    });
  }

  /**
   * Start all success-related animations and visual feedback
   * @param {HTMLElement} successComponent - The success message component
   */
  async startSuccessAnimations(successComponent) {
    if (!successComponent) return;

    try {
      // Reset form opacity after content replacement
      if (this.form) {
        this.form.style.opacity = '1';
      }

      // Start with enhanced fade-in animation
      await this.fadeInSuccessContent(successComponent);

      // Animate progress bar after fade-in completes
      const progressFill = successComponent.querySelector('.progress-fill');
      if (progressFill) {
        setTimeout(() => {
          progressFill.style.width = '100%';
        }, 100);
      }

      // Animate loading dots
      const loadingDots = successComponent.querySelector('.loading-dots');
      this.animateLoadingDots(loadingDots);

      // Add scale animation to checkmark icon with delay
      const checkmark = successComponent.querySelector('.success-checkmark');
      if (checkmark) {
        setTimeout(() => {
          checkmark.style.animation = 'checkmark-scale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }, 300);
      }

      // Add subtle pulsing effect to the entire container
      setTimeout(() => {
        successComponent.style.animation = 'pulse 2s infinite';
      }, 800);

    } catch (error) {
      console.error('Error starting success animations:', error);
    }
  }

  /**
   * Restore original form content (utility method for potential future use)
   */
  restoreOriginalFormContent() {
    if (!this.form || !this.form.dataset.originalContent) return;

    try {
      this.form.innerHTML = this.form.dataset.originalContent;
      this.form.classList.remove('form-success-replaced');
      this.form.style.minHeight = '';
      delete this.form.dataset.originalContent;

      console.log('Original form content restored');
    } catch (error) {
      console.error('Error restoring form content:', error);
    }
  }

  /**
   * Get or create the success message container
   * @returns {HTMLElement} Success container
   */
  getSuccessContainer() {
    if (!this.form) return null;

    // Look for existing container
    let container = this.form.querySelector('.form-success-container');

    if (!container) {
      // Create new container
      container = document.createElement('div');
      container.className = 'hidden mb-4 form-success-container';

      // Position at the top of the form
      this.form.insertBefore(container, this.form.firstChild);
    }

    return container;
  }

  /**
   * Show error message with enhanced UI (replaces old alert-based method)
   * @param {string} message - Error message to display
   */
  showErrorMessage(message) {
    // Show as form-level error
    this.showFormError(message);
  }
}

// Initialize form handler when script loads
window.formHandler = new FormHandler();

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormHandler;
} 