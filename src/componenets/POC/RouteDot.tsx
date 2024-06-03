import { useEffect, useRef, useState, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { TransformControls as TransformControlsImpl } from "three-stdlib";
import { TransformControls } from "@react-three/drei";
import { Mesh, type Vector3 } from "three";
import { type Mode } from "@/app/page";
import {
  dotGeometry,
  routeDotMaterial,
  routeDotMaterialHover,
} from "@/componenets/POC/scene";

type RouteDotProps = {
  name: string;
  position: Vector3;
  mode: Mode;
  orbitRef: RefObject<OrbitControlsImpl>;
  onTranslateEnd: (pos: Vector3, id: number) => void;
  onRemove: (id: number) => void;
  id: number;
};

export const RouteDot = ({
  name,
  position,
  mode,
  orbitRef,
  onTranslateEnd,
  onRemove,
  id,
}: RouteDotProps) => {
  const transformRef = useRef<TransformControlsImpl>(null);
  const dotRef = useRef(new Mesh());
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!transformRef.current) return;

    const controls = transformRef.current;

    const f = (e: any) => {
      const { value } = e;

      if (!orbitRef.current) return;

      orbitRef.current.enabled = !value;

      if (!value && dotRef.current) {
        onTranslateEnd(dotRef.current.position, id);
      }
    };

    controls.addEventListener("dragging-changed", f);

    return () => {
      controls.removeEventListener("translate", f);
    };
  });

  const handlePointerEnter = () => {
    setHovered(true);
  };
  const handlePointerLeave = () => {
    setHovered(false);
  };

  const handleRemove = () => {
    onRemove(id);
  };

  const dot = (
    <mesh
      onContextMenu={handleRemove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      ref={dotRef}
      geometry={dotGeometry}
      material={hovered ? routeDotMaterialHover : routeDotMaterial}
      position={position}
      name={name}
    ></mesh>
  );

  return mode === "edit" ? (
    <TransformControls ref={transformRef} mode="translate" object={dotRef}>
      {dot}
    </TransformControls>
  ) : (
    dot
  );
};
