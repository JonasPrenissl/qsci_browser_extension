// This file bundles the Clerk SDK and makes it available globally
import Clerk from '@clerk/clerk-js';

// Make Clerk available globally for the extension
window.Clerk = Clerk;

console.log('Q-SCI Clerk Bundle: Clerk SDK loaded and available globally');
