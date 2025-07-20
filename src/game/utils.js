// js/utils.js - Utility functions

// Format number with commas
export function formatNumber(num) {
    return num.toLocaleString();
}

// Format currency
export function formatCurrency(amount) {
    return '$' + formatNumber(amount);
}

// Update phone time display
export function updatePhoneTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    const timeElement = document.getElementById('phoneTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Get random number between min and max (inclusive)
export function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Clamp a value between min and max
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Get percentage
export function getPercentage(value, total) {
    if (total === 0) return 0;
    return Math.floor((value / total) * 100);
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Deep clone object
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const clonedObj = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}

// Check if object is empty
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// Get supply status text
export function getSupplyStatus(supply) {
    if (supply === 0) return 'Out of Stock';
    if (supply < 10) return 'Critical';
    if (supply < 30) return 'Low';
    if (supply < 60) return 'Medium';
    return 'High';
}

// Get supply color
export function getSupplyColor(supply) {
    if (supply === 0) return '#666666';
    if (supply < 10) return '#ff6666';
    if (supply < 30) return '#ffff00';
    return '#66ff66';
}

// Calculate percentage change
export function getPercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
}

// Format time remaining
export function formatTimeRemaining(milliseconds) {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

// Show notification (placeholder for future implementation)
export function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // In a real implementation, this could show a toast notification
}

// Validate numeric input
export function validateNumericInput(value, min = 0, max = Infinity) {
    const num = parseInt(value);
    if (isNaN(num)) return min;
    return clamp(num, min, max);
}

// Get color for heat level
export function getHeatColor(heatLevel) {
    if (heatLevel < 20) return '#66ff66';
    if (heatLevel < 40) return '#ffff00';
    if (heatLevel < 70) return '#ff6600';
    return '#ff0000';
}

// Calculate distance between cities (simplified)
export function calculateDistance(city1Index, city2Index) {
    return Math.abs(city1Index - city2Index);
}

// Check if mobile device
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Save to clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

// Generate unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Shuffle array
export function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Export all utility functions as default
export default {
    formatNumber,
    formatCurrency,
    updatePhoneTime,
    randomBetween,
    clamp,
    getPercentage,
    debounce,
    throttle,
    deepClone,
    isEmpty,
    getSupplyStatus,
    getSupplyColor,
    getPercentageChange,
    formatTimeRemaining,
    showNotification,
    validateNumericInput,
    getHeatColor,
    calculateDistance,
    isMobileDevice,
    copyToClipboard,
    generateId,
    shuffleArray
};