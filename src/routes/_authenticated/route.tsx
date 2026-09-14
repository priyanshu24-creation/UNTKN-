import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      if (location.pathname.startsWith("/admin")) {
        throw redirect({ to: "/auth/admin-signin" });
      }
      throw redirect({ to: "/auth/signin" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
