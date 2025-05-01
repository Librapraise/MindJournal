"use client";

import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Lock,
  Moon,
  Sun,
  LogOut,
  Save,
  AlertCircle,
} from "lucide-react";

// Define types
interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileState {
  name: string;
  email: string;
  notificationEnabled: boolean;
  darkModeEnabled: boolean;
  journalReminders: boolean;
  passwordChange: PasswordChange;
}

export default function Settings() {
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
    notificationEnabled: true,
    darkModeEnabled: false,
    journalReminders: true,
    passwordChange: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        // Mock user data (replace with real API call)
        const mockUserData = {
          name: "John Doe",
          email: "john.doe@example.com",
          settings: {
            notifications_enabled: true,
            dark_mode: localStorage.getItem("darkMode") === "true",
            journal_reminders: true,
          },
        };

        setProfile((prevState) => ({
          ...prevState,
          name: mockUserData.name,
          email: mockUserData.email,
          notificationEnabled:
            mockUserData.settings?.notifications_enabled ?? true,
          darkModeEnabled: mockUserData.settings?.dark_mode ?? false,
          journalReminders:
            mockUserData.settings?.journal_reminders ?? true,
        }));
      } catch (error) {
        console.error("Profile fetch error:", error);
        setErrorMessage("Unable to load profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Sync dark mode
  useEffect(() => {
    if (profile.darkModeEnabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [profile.darkModeEnabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfile((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof profile] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      const newValue = type === "checkbox" ? checked : value;
      setProfile((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Mock update
      await new Promise((res) => setTimeout(res, 500));
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      setErrorMessage("Unable to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } =
      profile.passwordChange;

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Mock password change
      await new Promise((res) => setTimeout(res, 800));
      setProfile((prev) => ({
        ...prev,
        passwordChange: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
      }));
      setSuccessMessage("Password changed successfully!");
    } catch (error) {
      console.error("Password change error:", error);
      setErrorMessage(
        "Unable to change password. Please check and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      await new Promise((res) => setTimeout(res, 300));
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      setErrorMessage("Unable to logout. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pl-64">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
        Account Settings
      </h1>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded flex items-center">
          <Save size={20} className="mr-2" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <User className="text-blue-500 mr-2" size={24} />
            <h2 className="text-xl font-semibold dark:text-white">
              Profile Information
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 rounded-md cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Contact support to change email
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? "Saving..." : <><Save size={16} className="mr-2" />Save Profile</>}
          </button>
        </div>
      </form>

      {/* Password */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Lock className="text-blue-500 mr-2" size={24} />
            <h2 className="text-xl font-semibold dark:text-white">
              Change Password
            </h2>
          </div>

          <div className="space-y-4">
            {["Current", "New", "Confirm New"].map((label, i) => {
              const field = ["currentPassword", "newPassword", "confirmPassword"][i];
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} Password
                  </label>
                  <input
                    type="password"
                    name={`passwordChange.${field}`}
                    value={(profile.passwordChange as any)[field]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="••••••••"
                  />
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? "Updating..." : <><Lock size={16} className="mr-2" />Update Password</>}
          </button>
        </div>
      </form>

      {/* Preferences */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Bell className="text-blue-500 mr-2" size={24} />
            <h2 className="text-xl font-semibold dark:text-white">Preferences</h2>
          </div>

          {[
            {
              name: "notificationEnabled",
              label: "Notifications",
              desc: "Receive app notifications",
            },
            {
              name: "darkModeEnabled",
              label: "Dark Mode",
              desc: "Use dark theme throughout the app",
            },
            {
              name: "journalReminders",
              label: "Journal Reminders",
              desc: "Get reminders to write your journal",
            },
          ].map(({ name, label, desc }) => (
            <div key={name} className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">
                  {label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {desc}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name={name}
                  checked={(profile as any)[name]}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? "Saving..." : <><Save size={16} className="mr-2" />Save Preferences</>}
          </button>
        </div>
      </form>

      {/* Logout */}
      <div className="text-right">
        <button
          onClick={handleLogout}
          className="text-red-600 hover:underline flex items-center ml-auto"
        >
          <LogOut size={16} className="mr-1" />
          Logout
        </button>
      </div>
    </div>
  );
}
