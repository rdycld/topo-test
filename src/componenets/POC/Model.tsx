import { useEffect, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { type DotType, type Mode } from "@/app/page";

import { useRef, useState } from "react";
import { useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/Addons.js";
import {
  Box3,
  CylinderGeometry,
  Group,
  Mesh,
  TextureLoader,
  Vector3,
} from "three";
import { dist } from "@/utils";
import { Route } from "@/componenets/POC/Route";
import {
  sceneObjects,
  dotGeometry,
  routeDotMaterial,
  ringGeometry,
  ringMaterial,
} from "@/componenets/POC/scene";

export type ModelProps = {
  mode: Mode;
  orbitRef: RefObject<OrbitControlsImpl>;
  entity: DotType;
  onAddPoint: (v: Vector3, b: Box3) => void;
  texturePath: string;
  modelPath: string;
  routePoints: any;
};

export const Model = ({
  mode,
  entity,
  orbitRef,
  onAddPoint,
  modelPath,
  texturePath,
  routePoints,
}: ModelProps) => {
  const texture = useLoader(TextureLoader, texturePath);
  const model = useLoader(OBJLoader, modelPath);
  const pointerRef = useRef({ x: 0, y: 0 });

  const { scene } = useThree();

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        child.material.map = texture;
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    });
  }, [model, texture]);

  const [rings, setRings] = useState<Vector3[]>([]);

  const addRing = (e: ThreeEvent<PointerEvent>) => {
    setRings((p) => [...p, e.point]);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (dist(pointerRef.current, { x: e.clientX, y: e.clientY }) > 15) return;

    if (entity === "ring") {
      addRing(e);
      return;
    }

    const route = scene.getObjectByName(sceneObjects.route);

    if (!route) return;

    const dot = new Mesh(dotGeometry, routeDotMaterial);
    dot.position.copy(e.point);

    // setRoutePoints((points) => [...points, e.point]);
    const box = new Box3().setFromObject(model);
    onAddPoint(e.point, box);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const intersection = e.intersections.find(
      (el) => el.eventObject.name === sceneObjects.model
    );

    if (!intersection) return;

    const helperDot = scene.getObjectByName(sceneObjects.helperDot);
    if (!helperDot) return;

    helperDot.position.copy(intersection.point);

    const lastDot = scene.getObjectByName(sceneObjects.lastDot);
    if (!lastDot) return;

    const helperPivot = scene.getObjectByName(sceneObjects.helperPivot);
    if (!helperPivot || !(helperPivot instanceof Group)) return;

    const helperConnection = scene.getObjectByName(
      sceneObjects.helperConnection
    );

    if (
      !helperConnection ||
      !(helperConnection instanceof Mesh) ||
      !(helperConnection.geometry instanceof CylinderGeometry)
    )
      return;

    const connection = lastDot.position.clone().sub(helperDot.position);
    const distance = connection.length();
    const direction = connection.clone().normalize();
    const halfDistance = direction.clone().multiplyScalar(distance / 2);

    helperConnection.geometry.dispose();
    helperConnection.geometry = new CylinderGeometry(0.05, 0.05, distance);
    helperConnection.rotation.x = Math.PI / 2;

    helperPivot.position.copy(helperDot.position);
    helperPivot.position.add(halfDistance);
    helperPivot.lookAt(helperDot.position);
  };

  const handlePointerOut = () => {
    const helperDot = scene.getObjectByName(sceneObjects.helperDot);
    if (!helperDot) return;

    helperDot.visible = false;

    const helperConnection = scene.getObjectByName(
      sceneObjects.helperConnection
    );
    if (!helperConnection) return;
    helperConnection.visible = false;
  };

  const handlePointerEnter = () => {
    const helperDot = scene.getObjectByName(sceneObjects.helperDot);
    if (!helperDot) return;

    helperDot.visible = true;

    const helperConnection = scene.getObjectByName(
      sceneObjects.helperConnection
    );
    if (!helperConnection) return;
    helperConnection.visible = true;
  };

  // const handleDotTranslate = (id: number, pos: Vector3) => {
  //   setRoutePoints((p) => p.map((dot, idx) => (id === idx ? pos : dot)));
  // };

  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());
  model.translateX(-center.x);
  model.translateY(-center.y);
  model.translateZ(-center.z);

  return (
    <>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      <ambientLight />
      <mesh
        name={sceneObjects.model}
        {...(mode === "create"
          ? {
              onPointerMove: handlePointerMove,
              onPointerLeave: handlePointerOut,
              onPointerEnter: handlePointerEnter,
              onPointerDown: handlePointerDown,
              onPointerUp: handlePointerUp,
            }
          : {})}
      >
        <meshBasicMaterial map={texture} />
        <primitive object={model} />
      </mesh>
      {rings.map((ring, idx) => {
        return (
          <mesh
            key={idx}
            position={ring}
            material={ringMaterial}
            geometry={ringGeometry}
          />
        );
      })}
      <Route
        points={routePoints}
        mode={mode}
        orbitRef={orbitRef}
        // onDotTranslate={handleDotTranslate}
        onDotTranslate={() => {}}
      />
    </>
  );
};
