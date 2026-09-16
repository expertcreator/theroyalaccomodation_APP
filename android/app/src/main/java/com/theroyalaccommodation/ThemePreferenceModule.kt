package com.theroyalaccommodation

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log

class ThemePreferenceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences("AppPreferences", Context.MODE_PRIVATE)

    init {
    Log.d("ThemePreference", "✅ ThemePreferenceModule initialized")
    }

    override fun getName(): String {
        return "ThemePreference"
    }

    @ReactMethod
    fun setDarkModeEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("darkMode", enabled).apply()
        Log.d("ThemePreference", "Dark Mode saved: $enabled") // 👈 Logs when value is saved
    }

    @ReactMethod
    fun getDarkModeEnabled(promise: com.facebook.react.bridge.Promise) {
        val isDarkMode = prefs.getBoolean("darkMode", false)
        Log.d("ThemePreference", "Dark Mode read: $isDarkMode") // 👈 Logs when value is read
        promise.resolve(isDarkMode)
    }
}