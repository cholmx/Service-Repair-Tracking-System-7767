// Order ID Generator Utility
class OrderIdGenerator {
  constructor() {
    this.usedIds = new Set();
    this.availableIds = [];
    this.initializeAvailableIds();
    this.loadUsedIds();
  }

  // Initialize the pool of available IDs (101-999)
  initializeAvailableIds() {
    for (let i = 101; i <= 999; i++) {
      this.availableIds.push(i.toString()); // Convert to string to match TEXT type in DB
    }
    // Shuffle the array to make it truly random
    this.shuffleArray(this.availableIds);
  }

  // Fisher-Yates shuffle algorithm
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Load used IDs from localStorage
  loadUsedIds() {
    try {
      const storedUsedIds = localStorage.getItem('serviceTracker_usedOrderIds');
      if (storedUsedIds) {
        const parsedIds = JSON.parse(storedUsedIds);
        this.usedIds = new Set(parsedIds);
        // Remove used IDs from available pool
        this.availableIds = this.availableIds.filter(id => !this.usedIds.has(id));
      }
    } catch (error) {
      console.error('Error loading used order IDs:', error);
      // If there's an error, start fresh
      this.usedIds = new Set();
    }
  }

  // Save used IDs to localStorage
  saveUsedIds() {
    try {
      localStorage.setItem('serviceTracker_usedOrderIds', JSON.stringify([...this.usedIds]));
    } catch (error) {
      console.error('Error saving used order IDs:', error);
    }
  }

  // Generate a new unique order ID
  generateOrderId() {
    if (this.availableIds.length === 0) {
      this.resetIdPool();
    }

    const orderId = this.availableIds.pop();
    this.usedIds.add(orderId);
    this.saveUsedIds();

    return orderId;
  }

  resetIdPool() {
    this.usedIds.clear();
    this.availableIds = [];
    this.initializeAvailableIds();
    localStorage.removeItem('serviceTracker_usedOrderIds');
  }

  // Get statistics about ID usage
  getStats() {
    const totalIds = 899; // 999 - 101 + 1
    const usedCount = this.usedIds.size;
    const availableCount = this.availableIds.length;
    
    return {
      total: totalIds,
      used: usedCount,
      available: availableCount,
      percentage: Math.round((usedCount / totalIds) * 100)
    };
  }

  // Check if an ID is available (for testing purposes)
  isIdAvailable(id) {
    return !this.usedIds.has(id);
  }

  // Get all used IDs (for debugging)
  getUsedIds() {
    return [...this.usedIds].sort((a, b) => a - b);
  }
}

// Create a singleton instance
const orderIdGenerator = new OrderIdGenerator();

export default orderIdGenerator;