import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'satoshi': ['Satoshi', 'sans-serif'],
        'sans': ['Satoshi', 'system-ui', 'sans-serif'],
        'bricolage': ['"Bricolage Grotesque"', 'Satoshi', 'system-ui', 'sans-serif'],
        'welcome-serif': ['Allura', 'cursive'],
        proxima: ['"Proxima Nova"', 'proxima-nova', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          accent: "hsl(var(--muted))",
          "accent-foreground": "hsl(var(--muted-foreground))",
          border: "hsl(var(--border))",
          ring: "hsl(var(--ring))",
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-hero': 'var(--gradient-hero)',
      },
      boxShadow: {
        'glow-primary': 'var(--glow-primary)',
        'glow-secondary': 'var(--glow-secondary)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-once": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: ".8",
          },
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.9)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "onboarding-tools-ticker": {
          "0%": {
            transform: "translateY(0)",
          },
          "100%": {
            // Move up by half the list height; requires duplicated items.
            transform: "translateY(-50%)",
          },
        },
        "marketing-tools-ticker-reverse": {
          "0%": {
            transform: "translateY(-50%)",
          },
          "100%": {
            transform: "translateY(0)",
          },
        },
        /** Duplicated horizontal row; animate -50% for seamless loop (Path Loading testimonials). */
        "palette-plotting-testimonials-marquee": {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(-50%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-once": "pulse-once 0.6s ease-in-out",
        "scale-in": "scale-in 0.3s ease-out",
        "onboarding-tools-ticker": "onboarding-tools-ticker 18s linear infinite",
        "marketing-tools-ticker-reverse":
          "marketing-tools-ticker-reverse 18s linear infinite",
        "palette-plotting-testimonials-marquee": "palette-plotting-testimonials-marquee 42s linear infinite",
        "palette-plotting-testimonials-marquee-slow": "palette-plotting-testimonials-marquee 56s linear infinite",
        marquee: "palette-plotting-testimonials-marquee 75s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
