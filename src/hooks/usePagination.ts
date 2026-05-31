"use client";

import { useEffect, useMemo, useState } from "react";

interface UsePaginationResult<T> {
  pagina: number;
  setPagina: (n: number) => void;
  totalPaginas: number;
  paginadas: T[];
  reset: () => void;
}

/**
 * Encapsulates pagination logic for any list of items.
 *
 * @param items - The full list of items (already filtered).
 * @param itemsPerPage - Number of items per page (default 10).
 *
 * Returns `pagina`, `setPagina`, `totalPaginas`, `paginadas` (current slice),
 * and `reset()` to jump back to page 1.
 *
 * Typical usage:
 * ```ts
 * const { pagina, setPagina, totalPaginas, paginadas, reset } = usePagination(filtradas, 10);
 * useEffect(() => reset(), [filtroEstado, filtroTipo, busqueda]);
 * ```
 */
export default function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10,
): UsePaginationResult<T> {
  const [pagina, setPagina] = useState(1);

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage],
  );

  const paginadas = useMemo(
    () => items.slice((pagina - 1) * itemsPerPage, pagina * itemsPerPage),
    [items, pagina, itemsPerPage],
  );

  // Clamp page when total changes (e.g. filter reduces results)
  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  const reset = () => setPagina(1);

  return { pagina, setPagina, totalPaginas, paginadas, reset };
}
