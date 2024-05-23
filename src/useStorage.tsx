import { useCallback, useEffect, useState } from "react";
import type { Vector3 } from "three";
type R = {
  name: string;
  points: { normalized: Vector3[]; arbitrary: Vector3[] };
};
export const useStorage = () => {
  const [routes, setRoutes] = useState<R[]>([]);

  const readRoutes = useCallback(() => {
    const routes = localStorage.getItem("routes");
    if (!routes) return;
    setRoutes(JSON.parse(routes) as R[]);
  }, []);

  const writeRoute = (r: R) => {
    const rr = [...routes, r];
    setRoutes(rr);
    localStorage.setItem("routes", JSON.stringify(rr));
  };

  const deleteRoute = (n: string) => {
    const rr = routes.filter(({ name }) => name !== n);

    setRoutes(rr);
    localStorage.setItem("routes", JSON.stringify(rr));
  };

  useEffect(() => {
    readRoutes();
  }, [readRoutes]);

  return {
    readRoutes,
    deleteRoute,
    writeRoute,
    routes,
  };
};
