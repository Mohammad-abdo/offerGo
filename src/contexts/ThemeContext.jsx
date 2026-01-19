import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme");
            return savedTheme || "light";
        }
        return "light";
    });

    const [fontSize, setFontSize] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("fontSize");
            return saved || "medium";
        }
        return "medium";
    });

    const [primaryColor, setPrimaryColor] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("primaryColor");
            return saved || "blue";
        }
        return "blue";
    });

    // Define color map and update function before useEffects
    const updatePrimaryColorVariables = (color) => {
        if (typeof window === "undefined") return;

        const colorMap = {
            blue: {
                50: "#eff6ff",
                100: "#dbeafe",
                200: "#bfdbfe",
                300: "#93c5fd",
                400: "#60a5fa",
                500: "#3b82f6",
                600: "#2563eb",
                700: "#1d4ed8",
                800: "#1e40af",
                900: "#1e3a8a",
            },
            indigo: {
                50: "#eef2ff",
                100: "#e0e7ff",
                200: "#c7d2fe",
                300: "#a5b4fc",
                400: "#818cf8",
                500: "#6366f1",
                600: "#4f46e5",
                700: "#4338ca",
                800: "#3730a3",
                900: "#312e81",
            },
            purple: {
                50: "#faf5ff",
                100: "#f3e8ff",
                200: "#e9d5ff",
                300: "#d8b4fe",
                400: "#c084fc",
                500: "#a855f7",
                600: "#9333ea",
                700: "#7e22ce",
                800: "#6b21a8",
                900: "#581c87",
            },
            green: {
                50: "#f0fdf4",
                100: "#dcfce7",
                200: "#bbf7d0",
                300: "#86efac",
                400: "#4ade80",
                500: "#22c55e",
                600: "#16a34a",
                700: "#15803d",
                800: "#166534",
                900: "#14532d",
            },
            red: {
                50: "#fef2f2",
                100: "#fee2e2",
                200: "#fecaca",
                300: "#fca5a5",
                400: "#f87171",
                500: "#ef4444",
                600: "#dc2626",
                700: "#b91c1c",
                800: "#991b1b",
                900: "#7f1d1d",
            },
            orange: {
                50: "#fff7ed",
                100: "#ffedd5",
                200: "#fed7aa",
                300: "#fdba74",
                400: "#fb923c",
                500: "#f97316",
                600: "#ea580c",
                700: "#c2410c",
                800: "#9a3412",
                900: "#7c2d12",
            },
        };

        const colors = colorMap[color] || colorMap.blue;
        const root = document.documentElement;
        Object.keys(colors).forEach((key) => {
            root.style.setProperty(`--color-primary-${key}`, colors[key]);
        });
    };

    // Initialize theme on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(theme);
            root.setAttribute("data-font-size", fontSize);
            root.setAttribute("data-primary-color", primaryColor);
            updatePrimaryColorVariables(primaryColor);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", theme);
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(theme);
        }
    }, [theme]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("fontSize", fontSize);
            document.documentElement.setAttribute("data-font-size", fontSize);
        }
    }, [fontSize]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("primaryColor", primaryColor);
            document.documentElement.setAttribute(
                "data-primary-color",
                primaryColor
            );
            updatePrimaryColorVariables(primaryColor);
        }
    }, [primaryColor]);

    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === "light" ? "dark" : "light";
            if (typeof window !== "undefined") {
                const root = document.documentElement;
                root.classList.remove("light", "dark");
                root.classList.add(newTheme);
                localStorage.setItem("theme", newTheme);
            }
            return newTheme;
        });
    };

    const changeFontSize = (size) => {
        setFontSize(size);
    };

    const changePrimaryColor = (color) => {
        setPrimaryColor(color);
    };

    const colors = {
        blue: {
            primary: "from-blue-500 to-blue-600",
            primaryHover: "hover:from-blue-600 hover:to-blue-700",
            bg: "bg-blue-50",
            text: "text-blue-600",
            border: "border-blue-200",
            ring: "ring-blue-500",
        },
        indigo: {
            primary: "from-indigo-500 to-indigo-600",
            primaryHover: "hover:from-indigo-600 hover:to-indigo-700",
            bg: "bg-indigo-50",
            text: "text-indigo-600",
            border: "border-indigo-200",
            ring: "ring-indigo-500",
        },
        purple: {
            primary: "from-purple-500 to-purple-600",
            primaryHover: "hover:from-purple-600 hover:to-purple-700",
            bg: "bg-purple-50",
            text: "text-purple-600",
            border: "border-purple-200",
            ring: "ring-purple-500",
        },
        green: {
            primary: "from-green-500 to-green-600",
            primaryHover: "hover:from-green-600 hover:to-green-700",
            bg: "bg-green-50",
            text: "text-green-600",
            border: "border-green-200",
            ring: "ring-green-500",
        },
        red: {
            primary: "from-red-500 to-red-600",
            primaryHover: "hover:from-red-600 hover:to-red-700",
            bg: "bg-red-50",
            text: "text-red-600",
            border: "border-red-200",
            ring: "ring-red-500",
        },
        orange: {
            primary: "from-orange-500 to-orange-600",
            primaryHover: "hover:from-orange-600 hover:to-orange-700",
            bg: "bg-orange-50",
            text: "text-orange-600",
            border: "border-orange-200",
            ring: "ring-orange-500",
        },
    };

    const fonts = {
        small: {
            base: "text-sm",
            heading: "text-2xl",
            subheading: "text-lg",
        },
        medium: {
            base: "text-base",
            heading: "text-3xl",
            subheading: "text-xl",
        },
        large: {
            base: "text-lg",
            heading: "text-4xl",
            subheading: "text-2xl",
        },
    };

    const value = {
        theme,
        toggleTheme,
        fontSize,
        setFontSize: changeFontSize,
        primaryColor,
        setPrimaryColor: changePrimaryColor,
        colors: colors[primaryColor],
        fonts: fonts[fontSize],
        allColors: colors,
        allFonts: fonts,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};
