// Web-compatible implementation of React Native AsyncStorage
// This provides localStorage-based storage for web applications

class AsyncStorage {
  static async getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage.getItem error:', error);
      return null;
    }
  }

  static async setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage.setItem error:', error);
    }
  }

  static async removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage.removeItem error:', error);
    }
  }

  static async clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('AsyncStorage.clear error:', error);
    }
  }

  static async getAllKeys() {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.warn('AsyncStorage.getAllKeys error:', error);
      return [];
    }
  }

  static async multiGet(keys) {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      console.warn('AsyncStorage.multiGet error:', error);
      return keys.map(key => [key, null]);
    }
  }

  static async multiSet(keyValuePairs) {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      console.warn('AsyncStorage.multiSet error:', error);
    }
  }

  static async multiRemove(keys) {
    try {
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('AsyncStorage.multiRemove error:', error);
    }
  }
}

export default AsyncStorage;
