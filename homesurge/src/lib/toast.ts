// Simple standalone toast function for use outside React context
let toastFn: ((message: string, type?: 'success' | 'error' | 'info') => void) | null = null

export function registerToast(fn: (message: string, type?: 'success' | 'error' | 'info') => void) {
  toastFn = fn
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (toastFn) {
    toastFn(message, type)
  } else {
    // Fallback: log to console
    console.log(`[${type}] ${message}`)
  }
}
