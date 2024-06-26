"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";
import { Canvas } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitControls } from "@react-three/drei";
import { HelperDot } from "@/componenets/POC/HelperDot";
import { HelperConnection } from "@/componenets/POC/HelperConnection";
import dynamic from "next/dynamic";
import { Vector3, type Box3 } from "three";
import { useStorage } from "@/useStorage";

const Model = dynamic(() =>
  import("@/componenets/POC/Model").then((m) => m.Model)
);

export type Mode = "view" | "create" | "edit";

export type DotType = "route" | "ring" | "info";

const models = [
  {
    name: "cube",
    texturePath: "/models/cube/cube.jpeg",
    modelPath: "/models/cube/cube.obj",
  },
  {
    name: "kwarc1 - precise holds",
    texturePath: "/models/kwarc2/preciseHolds.mtl",
    modelPath: "/models/kwarc2/preciseHolds.obj",
  },
  {
    name: "kwarc4 - good light",
    texturePath: "/models/kwarc4/kwarc4.mtl",
    modelPath: "/models/kwarc4/kwarc4.obj",
  },
];

export default function Poc() {
  const [mode, setMode] = useState<Mode>("create");
  const [entityType, setEntityType] = useState<DotType>("route");
  const [currentModel, setCurrentModel] = useState(models[0]);

  return (
    <div className={styles.container}>
      <div className={styles.modes}>
        {models.map((model) => (
          <button key={model.name} onClick={() => setCurrentModel(model)}>
            {model.name}
          </button>
        ))}
      </div>
      <div className={styles.modes}>
        modes:
        {(["view", "create", "edit"] as const).map((x, idx) => (
          <button
            key={idx}
            onClick={() => setMode(x)}
            style={{ background: mode === x ? "green" : "initial" }}
            className={styles.modeButton}
          >
            {x}
          </button>
        ))}
      </div>
      <div className={styles.modes}>
        add:
        {(["route", "ring"] as const).map((x, idx) => (
          <button
            key={idx}
            disabled={mode !== "create"}
            onClick={() => setEntityType(x)}
            style={{
              backgroundColor:
                entityType === x && mode === "create" ? "green" : "initial",
            }}
            className={styles.modeButton}
          >
            {x}
          </button>
        ))}
      </div>
      <Scene currModel={currentModel} mode={mode} entityType={entityType} />
    </div>
  );
}

type SceneProps = {
  mode: Mode;
  entityType: DotType;
  currModel: (typeof models)[number];
};

type Route = {
  normalized: Vector3[];
  arbitrary: Vector3[];
};

const Scene = ({ mode, entityType, currModel }: SceneProps) => {
  const orbitRef = useRef<OrbitControlsImpl>(null);

  const { routes, writeRoute, deleteRoute } = useStorage();

  const [newRouteName, setNewRouteName] = useState("");

  const [route, setRoute] = useState<Route>({ arbitrary: [], normalized: [] });
  const [scale, setScale] = useState("1");

  const handleAddPoint = (v: Vector3, box: Box3) => {
    const size = box.getSize(new Vector3());

    setRoute(({ arbitrary, normalized }) => ({
      arbitrary: [...arbitrary, v],
      normalized: [
        ...normalized,
        new Vector3(v.x / (size.x / 2), v.y / (size.y / 2), v.z / (size.z / 2)),
      ],
    }));
  };

  const handleEditPoint = (v: Vector3, box: Box3, id: number) => {
    const size = box.getSize(new Vector3());
    setRoute(({ arbitrary, normalized }) => ({
      arbitrary: arbitrary.map((el, idx) => (id === idx ? v : el)),
      normalized: normalized.map((el, idx) =>
        id === idx
          ? new Vector3(
              v.x / (size.x / 2),
              v.y / (size.y / 2),
              v.z / (size.z / 2)
            )
          : el
      ),
    }));
  };

  const handleRemovePoint = (id: number) => {
    setRoute(({ arbitrary, normalized }) => ({
      arbitrary: arbitrary.filter((_, idx) => idx !== id),
      normalized: normalized.filter((_, idx) => idx !== id),
    }));
  };

  const handleSetRoute = (points: Route) => {
    setRoute(points);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          columnGap: "20px",
        }}
      >
        {routes.map((route, idx) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "20px",
              rowGap: 10,
              alignItems: "flex-start",
            }}
            key={idx}
          >
            <button
              style={{ fontSize: "20px" }}
              onClick={() => handleSetRoute(route.points)}
            >
              set {route.name}
            </button>
            <button
              style={{ fontSize: "20px" }}
              onClick={() => deleteRoute(route.name)}
            >
              delete {route.name}
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "20px" }}>
        <input
          type="text"
          value={newRouteName}
          onChange={({ target }) => setNewRouteName(target.value)}
        />
        <button
          disabled={!newRouteName.length || route.arbitrary.length < 4}
          onClick={() => writeRoute({ points: route, name: newRouteName })}
        >
          add route
        </button>
        <button
          onClick={() => {
            console.log(route, scale);
          }}
        >
          log route
        </button>
      </div>
      <div>
        <input
          type="range"
          max={"5"}
          min={"0.1"}
          step={"0.1"}
          value={scale}
          onChange={(e) => {
            setScale(e.target.value);
          }}
        />
        scale: {scale}
      </div>
      <main
        style={{
          height: "800px",
          width: "1024px",
          border: "1px solid red",
          boxSizing: "content-box",
        }}
      >
        <Canvas camera={{ position: [8, 8, 8] }}>
          <Suspense fallback={null}>
            <Model
              onPointEdit={handleEditPoint}
              onPointRemove={handleRemovePoint}
              scale={scale}
              routePoints={route.arbitrary.map(
                (x) => new Vector3(...Object.values(x))
              )}
              modelPath={currModel.modelPath}
              mtlPath={currModel.texturePath}
              onAddPoint={handleAddPoint}
              mode={mode}
              entity={entityType}
              orbitRef={orbitRef}
            />
          </Suspense>
          {mode === "create" && <HelperDot entity={entityType} />}
          {mode === "create" && entityType === "route" && <HelperConnection />}

          <OrbitControls ref={orbitRef} />
        </Canvas>
      </main>
    </>
  );
};
