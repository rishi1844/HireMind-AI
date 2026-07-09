"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DeviceDetails } from "@/lib/deviceDetector";

const DeviceContext = createContext<DeviceDetails>({
  deviceType: "desktop",
  os: "Windows",
  browser: "Chrome",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

export function DeviceProvider({
  children,
  initialDevice,
}: {
  children: React.ReactNode;
  initialDevice: DeviceDetails;
}) {
  const [device, setDevice] = useState<DeviceDetails>(initialDevice);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      let clientDeviceType: "mobile" | "tablet" | "desktop" = "desktop";

      if (width < 768) {
        clientDeviceType = "mobile";
      } else if (width >= 768 && width < 1024) {
        clientDeviceType = "tablet";
      }

      const isMobile = clientDeviceType === "mobile";
      const isTablet = clientDeviceType === "tablet";
      const isDesktop = clientDeviceType === "desktop";

      setDevice((prev) => ({
        ...prev,
        deviceType: clientDeviceType,
        isMobile,
        isTablet,
        isDesktop,
      }));
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceContext);
}
