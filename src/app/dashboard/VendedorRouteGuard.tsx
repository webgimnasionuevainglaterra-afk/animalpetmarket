"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function vendedorPuedeAcceder(pathname: string): boolean {
  if (pathname === "/dashboard") return true;
  if (pathname.startsWith("/dashboard/clientes")) return true;
  if (pathname.startsWith("/dashboard/pedidos")) return true;
  return false;
}

function domiciliarioPuedeAcceder(pathname: string): boolean {
  return pathname === "/dashboard";
}

export function VendedorRouteGuard({
  children,
  rol,
}: {
  children: React.ReactNode;
  rol: "admin" | "vendedor" | "domiciliario";
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (rol === "vendedor" && !vendedorPuedeAcceder(pathname)) {
      router.replace("/dashboard");
    } else if (rol === "domiciliario" && !domiciliarioPuedeAcceder(pathname)) {
      router.replace("/dashboard");
    }
  }, [rol, pathname, router]);

  return <>{children}</>;
}
