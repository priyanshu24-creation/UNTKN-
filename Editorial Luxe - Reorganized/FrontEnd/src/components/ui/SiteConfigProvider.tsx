import { createContext, useContext, type ReactNode } from "react";

import { siteConfig, type SiteConfig } from "@/config/site";

const SiteConfigContext = createContext<SiteConfig>(siteConfig);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  return <SiteConfigContext.Provider value={siteConfig}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
