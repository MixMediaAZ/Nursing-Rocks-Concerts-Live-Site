import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncSessionUserFromApi } from "@/lib/token-utils";

/**
 * On load, refresh JWT + localStorage user from the database so is_verified / is_admin stay current
 * (e.g. after admin verifies the account while the user is already signed in).
 */
export function SessionSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    syncSessionUserFromApi().then((ok) => {
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      }
    });
  }, [queryClient]);

  return null;
}
