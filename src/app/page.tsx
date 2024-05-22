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

const Model = dynamic(() =>
  import("@/componenets/POC/Model").then((m) => m.Model)
);

export type Mode = "view" | "create" | "edit";

export type DotType = "route" | "ring" | "info";

const models = [
  {
    name: "rock",
    texturePath: "/models/rock/rock.jpeg",
    modelPath: "/models/rock/rock.obj",
  },
  {
    name: "cube",
    texturePath: "/models/cube/cube.jpeg",
    modelPath: "/models/cube/cube.obj",
  },
];

export default function Poc() {
  const [mode, setMode] = useState<Mode>("create");
  const [entityType, setEntityType] = useState<DotType>("route");
  const [currentModel, setCurrentModel] = useState(models[0]);
  const [modelName, setModelName] = useState("");

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

  const [newRouteName, setNewRouteName] = useState("");
  const [routes, setRoutes] = useState<
    { points: Route; name: string; id: number }[]
  >([]);

  const [route, setRoute] = useState<Route>({ arbitrary: [], normalized: [] });

  useEffect(() => {
    const f = async () => {
      const resp = await fetch(`/models/${"id"}/routes`);

      if (resp.ok) {
        const d = await resp.json();
        setRoutes(d);
      }
    };
  }, []);

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

  const handleSetRoute = (points: Route) => {
    setRoute(points);
  };

  const handleAddRoute = async () => {
    const response = await fetch(`/models/:modelId/routes/add`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newRouteName, points: route }),
    });
  };

  return (
    <>
      <div>
        {routes.map((route) => (
          <button key={route.id} onClick={() => handleSetRoute(route.points)}>
            {route.name}
          </button>
        ))}
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
              modelPath={currModel.modelPath}
              texturePath={currModel.texturePath}
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
          type="text"
          value={newRouteName}
          onChange={({ target }) => setNewRouteName(target.value)}
        />
        <button
          disabled={!newRouteName.length || route.arbitrary.length < 4}
          onClick={handleAddRoute}
        >
          add route
        </button>
        <button
          onClick={() => {
            console.log(route);
          }}
        >
          log route
        </button>
      </main>
    </>
  );
};
