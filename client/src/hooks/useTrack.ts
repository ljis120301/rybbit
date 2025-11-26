import { useEffect } from "react";
import { authClient } from "@/lib/auth";

// Add stopImpersonating to Window interface
declare global {
  interface Window {
    stopImpersonating: () => Promise<boolean>;
  }
}

export function useTrack() {
  const user = authClient.useSession();
  useEffect(() => {
    if (typeof window !== "undefined" && user.data?.user?.id) {
      window.rybbit.identify(user.data?.user?.id, {
        email: user.data?.user?.email,
        name: user.data?.user?.name,
      });
    }
  }, [user.data?.user?.id]);
}
