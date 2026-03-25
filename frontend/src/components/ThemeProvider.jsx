import React, { useEffect, useRef } from "react";
import { useTenant } from "../contexts/TenantContext";

const DEFAULT_PRIMARY = "#4f46e5";
const DEFAULT_SECONDARY = "#7c3aed";
const DEFAULT_TITLE = "FlexiLeave";

const PROPERTY_KEYS = [
  "--primary-color",
  "--secondary-color",
  "--primary-50",
  "--primary-100",
  "--primary-200",
  "--primary-300",
  "--primary-400",
  "--primary-600",
  "--primary-700",
  "--primary-800",
  "--primary-900",
  "--secondary-50",
  "--secondary-100",
  "--secondary-200",
  "--secondary-300",
  "--secondary-400",
  "--secondary-600",
  "--secondary-700",
  "--secondary-800",
  "--secondary-900",
];

const parseHexColor = (hex) => {
  const normalized = hex?.replace("#", "").trim();
  if (!normalized || (normalized.length !== 3 && normalized.length !== 6)) {
    return null;
  }

  if (normalized.length === 3) {
    return Array.from(normalized).map((segment) =>
      parseInt(segment + segment, 16)
    );
  }

  return [
    parseInt(normalized.substr(0, 2), 16),
    parseInt(normalized.substr(2, 2), 16),
    parseInt(normalized.substr(4, 2), 16),
  ];
};

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

const getLighterColor = (hex, percentage) => {
  const parsed = parseHexColor(hex);
  if (!parsed) return hex;
  const [r, g, b] = parsed;
  const factor = clamp(percentage) / 100;
  const newR = clamp(r + (255 - r) * factor);
  const newG = clamp(g + (255 - g) * factor);
  const newB = clamp(b + (255 - b) * factor);
  return `rgb(${newR}, ${newG}, ${newB})`;
};

const getDarkerColor = (hex, percentage) => {
  const parsed = parseHexColor(hex);
  if (!parsed) return hex;
  const [r, g, b] = parsed;
  const factor = clamp(percentage) / 100;
  const newR = clamp(r * (1 - factor));
  const newG = clamp(g * (1 - factor));
  const newB = clamp(b * (1 - factor));
  return `rgb(${newR}, ${newG}, ${newB})`;
};

const ThemeProvider = ({ children }) => {
  const { tenant } = useTenant();
  const initialTitle = useRef(document.title || DEFAULT_TITLE);
  const defaultFavicon = useRef(
    document.querySelector("link[rel*='icon']")?.href || "/favicon.ico"
  );

  useEffect(() => {
    const root = document.documentElement;

    const primaryColor =
      tenant?.primaryColor?.trim() || DEFAULT_PRIMARY;
    const secondaryColor =
      tenant?.secondaryColor?.trim() || DEFAULT_SECONDARY;
    const logoUrl = tenant?.logoUrl;

    root.style.setProperty("--primary-color", primaryColor);
    root.style.setProperty("--secondary-color", secondaryColor);
    root.style.setProperty("--primary-50", getLighterColor(primaryColor, 95));
    root.style.setProperty("--primary-100", getLighterColor(primaryColor, 90));
    root.style.setProperty("--primary-200", getLighterColor(primaryColor, 75));
    root.style.setProperty("--primary-300", getLighterColor(primaryColor, 60));
    root.style.setProperty("--primary-400", getLighterColor(primaryColor, 40));
    root.style.setProperty("--primary-600", getDarkerColor(primaryColor, 10));
    root.style.setProperty("--primary-700", getDarkerColor(primaryColor, 20));
    root.style.setProperty("--primary-800", getDarkerColor(primaryColor, 30));
    root.style.setProperty("--primary-900", getDarkerColor(primaryColor, 40));
    root.style.setProperty(
      "--secondary-50",
      getLighterColor(secondaryColor, 95)
    );
    root.style.setProperty(
      "--secondary-100",
      getLighterColor(secondaryColor, 90)
    );
    root.style.setProperty(
      "--secondary-200",
      getLighterColor(secondaryColor, 75)
    );
    root.style.setProperty(
      "--secondary-300",
      getLighterColor(secondaryColor, 60)
    );
    root.style.setProperty(
      "--secondary-400",
      getLighterColor(secondaryColor, 40)
    );
    root.style.setProperty(
      "--secondary-600",
      getDarkerColor(secondaryColor, 10)
    );
    root.style.setProperty(
      "--secondary-700",
      getDarkerColor(secondaryColor, 20)
    );
    root.style.setProperty(
      "--secondary-800",
      getDarkerColor(secondaryColor, 30)
    );
    root.style.setProperty(
      "--secondary-900",
      getDarkerColor(secondaryColor, 40)
    );

    const faviconLink =
      document.querySelector("link[rel*='icon']") || document.createElement("link");
    faviconLink.rel = "icon";
    faviconLink.type = "image/x-icon";
    faviconLink.href = logoUrl || defaultFavicon.current;
    if (!document.head.contains(faviconLink)) {
      document.head.appendChild(faviconLink);
    }

    document.title = tenant?.name
      ? `${tenant.name} - Leave Management`
      : initialTitle.current;

    return () => {
      PROPERTY_KEYS.forEach((property) => {
        root.style.removeProperty(property);
      });
      document.title = initialTitle.current;
      if (faviconLink) {
        faviconLink.href = defaultFavicon.current;
      }
    };
  }, [tenant]);

  return <>{children}</>;
};

export default ThemeProvider;
