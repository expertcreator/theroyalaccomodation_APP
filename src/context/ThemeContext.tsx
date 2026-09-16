import React, { createContext, useState, useContext, useEffect } from "react";
import { NativeModules } from "react-native";
import { baselightTheme, basedarkTheme } from "../theme/theme";
import { ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage } from "../utils/storage";

const ThemePreference = NativeModules.ThemePreference as
    | { setDarkModeEnabled(enabled: boolean): void; getDarkModeEnabled(): Promise<boolean>; }
    | undefined;

type ThemeType = typeof baselightTheme;

interface ThemeContextType {
    theme: ThemeType;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: baselightTheme,
    isDarkMode: false,
    toggleTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    // Load theme preference from storage on app start
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const savedTheme: boolean | null = await getItemFromAsyncStorage(ASYNC_KEYS.DARK_MODE);
                if (savedTheme !== null) {
                    setIsDarkMode(savedTheme);
                }
                // else {
                //     // fallback from native (e.g. iOS UserDefaults)
                //     const nativeValue = await ThemePreference?.getDarkModeEnabled?.();
                //     if (nativeValue !== undefined) setIsDarkMode(nativeValue);
                // }
            } catch (error) {
                console.error("Failed to load theme preference", error);
            }
        };
        loadThemePreference();
        console.log('effect')
    }, []);

    // Toggle theme and persist preference
    const toggleTheme = async () => {
        try {
            const newValue = !isDarkMode;
            console.log("Toggling theme to:", newValue); // 👈 Check if this fires
            setIsDarkMode(newValue);

            // Save to native SharedPreferences
            ThemePreference?.setDarkModeEnabled(newValue);
            await setItemInAsyncStorage(ASYNC_KEYS.DARK_MODE, newValue);
        } catch (error) {
            console.error("Failed to save theme preference", error);
        }
    };

    return (
        <ThemeContext.Provider
            value={{
                theme: isDarkMode ? basedarkTheme : baselightTheme,
                isDarkMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);