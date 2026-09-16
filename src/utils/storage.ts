import AsyncStorage from '@react-native-async-storage/async-storage';

// Centralized Keys
export const ASYNC_KEYS = {
    USER: 'user',
    DARK_MODE: 'darkMode',
};

/**
 * Stores a value in AsyncStorage.
 * @param key - The key under which the value is stored.
 * @param value - The value to store (string, object, number, or boolean).
 */
export const setItemInAsyncStorage = async (
    key: string,
    value: string | object | number | boolean
): Promise<void> => {
    try {
        const serializedValue =
            typeof value === 'string' ? value : JSON.stringify(value);

        await AsyncStorage.setItem(key, serializedValue);
    } catch (error) {
        console.error(`Error setting item with key "${key}":`, error);
    }
};

/**
 * Retrieves a value from AsyncStorage.
 * @param key - The key of the item to retrieve.
 * @returns The stored value parsed to its original type, or null if not found.
 */
export const getItemFromAsyncStorage = async <T>(
    key: string
): Promise<T | null> => {
    try {
        const value = await AsyncStorage.getItem(key);

        if (value === null) return null;

        try {
            return JSON.parse(value) as T;
        } catch {
            // If parsing fails, return as string (primitive type)
            return value as unknown as T;
        }
    } catch (error) {
        console.error(`Error getting item with key "${key}":`, error);
        return null;
    }
};

/**
 * Removes a value from AsyncStorage.
 * @param key - The key of the item to remove.
 */
export const removeItemFromAsyncStorage = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing item with key "${key}":`, error);
    }
};

/**
 * Clears all data from AsyncStorage.
 * Useful for logout functionality.
 */
export const clearAllStorage = async (): Promise<void> => {
    try {
        await AsyncStorage.clear();
        console.log('All AsyncStorage data cleared.');
    } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
    }
};