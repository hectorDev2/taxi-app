"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DetalleSolicitudRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/solicitudes?id=${params.id}`);
  }, [params.id, router]);

  return null;
}
