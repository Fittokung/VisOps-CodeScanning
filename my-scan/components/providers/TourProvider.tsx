"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./driver.css"; // Custom Premium Theme
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";

interface TourContextType {
  startTour: () => void;
  isOpen: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [driverObj, setDriverObj] = useState<Driver | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Determine colors based on theme, but we need to wait for mount to be sure
    const isDark = theme === 'dark' || document.documentElement.classList.contains('dark');
    
    // Create Driver Instance
    const driverInstance = driver({
      showProgress: true,
      allowClose: true,
      animate: true,
      // Fix: Use onDestroyed to handle both "Done" and "Skip" (Overlay click or ESC)
      onDestroyed: () => {
         setIsOpen(false);
         localStorage.setItem("visops-tour-completed", "true");
      },
      steps: [
        {
          element: "#tour-welcome", 
          popover: {
            title: "Welcome to VisOps Scan!",
            description: "Your all-in-one platform for secure code scanning and vulnerability management. Let's show you around.",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-dashboard",
          popover: {
            title: "1. Dashboard Center",
            description: "This is your main hub. Monitor all active projects, view security health at a glance, and spot critical vulnerabilities immediately.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#tour-create-project-options",
          popover: {
            title: "2. Start a New Scan",
            description: "Ready to secure your code? Choose 'Scan Only' for a quick audit or 'Scan & Build' to run a full pipeline with Docker image scanning.",
            side: "top",
            align: "center",
          },
        },
         {
          element: "#sidebar-nav-services",
          popover: {
            title: "3. My Services",
            description: "Deep dive into your microservices. View detailed vulnerability reports, track improvements over time, and manage service settings.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-scan-history",
          popover: {
            title: "4. Global History",
            description: "Audit trail of every scan performed across the system. Check past results and debug failed pipelines.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-documents",
          popover: {
            title: "5. Documentation",
            description: "Access integration guides, API references, and security best practices whenever you need help.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#header-search-bar",
          popover: {
            title: "6. Quick Search",
            description: "Looking for something specific? Use this global search to find any project, service, or report instantly.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "#navbar-profile-section",
          popover: {
            title: "7. User Profile",
            description: "Manage your account settings, theme preferences, and log out from here.",
            side: "bottom",
            align: "end",
          },
        },
        {
          popover: {
            title: "You're All Set! 🎉",
            description: "That covers the basics. You are now ready to start building secure software. Happy coding!",
            align: "center",
          },
        },
      ],
    });

    setDriverObj(driverInstance);
    
    // Auto-start only on Dashboard for new users
    const hasSeenTour = localStorage.getItem("visops-tour-completed");
    if (!hasSeenTour && pathname === "/dashboard") {
       // Small delay to ensure UI renders
       setTimeout(() => {
           driverInstance.drive();
           setIsOpen(true);
           localStorage.setItem("visops-tour-completed", "true");
       }, 1000);
    }

  }, [pathname, theme]);

  const startTour = () => {
    if (driverObj) {
      if (pathname !== "/dashboard") {
          router.push("/dashboard");
          // Re-trigger tour after nav
          setTimeout(() => {
              driverObj.drive();
              setIsOpen(true);
          }, 800);
      } else {
        driverObj.drive();
        setIsOpen(true);
      }
    }
  };

  return (
    <TourContext.Provider value={{ startTour, isOpen }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
