"use client";
import { Suspense, useRef, useState } from "react";
import styles from "./page.module.scss";
import { Canvas } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitControls } from "@react-three/drei";
import { HelperDot } from "@/componenets/POC/HelperDot";
import { HelperConnection } from "@/componenets/POC/HelperConnection";
import dynamic from "next/dynamic";
import { Vector3 } from "three";

const Model = dynamic(() =>
  import("@/componenets/POC/Model").then((m) => m.Model)
);

export type Mode = "view" | "create" | "edit";

export type DotType = "route" | "ring" | "info";

export default function Poc() {
  const [mode, setMode] = useState<Mode>("create");
  const [entityType, setEntityType] = useState<DotType>("route");

  return (
    <div className={styles.container}>
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
      <Scene mode={mode} entityType={entityType} />
    </div>
  );
}

type SceneProps = {
  mode: Mode;
  entityType: DotType;
};

type Route = {
  normalized: Vector3[];
  arbitrary: Vector3[];
};

const Scene = ({ mode, entityType }: SceneProps) => {
  const orbitRef = useRef<OrbitControlsImpl>(null);

  const [route, setRoute] = useState<Route>({ arbitrary: [], normalized: [] });
  const [scale, setScale] = useState(0.2);

  const handleAddPoint = (v: Vector3) => {
    setRoute(({ arbitrary, normalized }) => ({
      arbitrary: [...arbitrary, v],
      normalized: [...normalized, new Vector3().copy(v).normalize()],
    }));
  };

  return (
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
            modelScale={scale}
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

      <input
        value={scale}
        onChange={(e) => setScale(e.target.valueAsNumber)}
        type="range"
        min={0.1}
        max={1}
        step={0.1}
      ></input>
      <div>scale: {scale}</div>
      <button
        onClick={() => {
          console.log(route);
        }}
      >
        export route
      </button>
    </main>
  );
};
