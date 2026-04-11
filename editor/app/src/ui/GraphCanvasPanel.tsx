import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { GraphCanvasDebugList, GraphCanvasHud } from "./graph-canvas-hud";
import { clamp, type Vec3 } from "./graph-canvas-math";
import { buildLabelAnchors } from "./graph-canvas-label-anchors";
import { findHitEntity, projectRayToGround } from "./graph-canvas-hit-test";
import { compileShader, drawScene, getRayContext, getSceneFocus, getSceneOrbitDistance } from "./graph-canvas-renderer";
import { findInteractionTarget, updateActorPhysics, type ActorPhysicsState } from "./graph-canvas-playtest";
import GraphCanvasOverlays from "./graph-canvas-overlays";
import { toDoorEntity, toEnemyEntity, toGenericEntity, toLadderEntity, toSwitchEntity, toTriggerZoneEntity, type CameraMode, type CameraState, type CanvasEdge, type CanvasNode, type GraphCanvasPanelProps } from "./graph-canvas-types";
import { createEditorHomeCamera, formatVec3, getCameraTrace, getOrbitSamplePositions, normalizeEditorOrbitDistance } from "./graph-canvas-camera";
export type { CanvasEdge, CanvasNode } from "./graph-canvas-types";
export default function GraphCanvasPanel({
  nodes,
  edges,
  onChange,
  resolveNodeKind, defaultNodeType, onSelectNode, onInteract, onTriggerZoneStateChange, onDoorPositionsChange, onActorPositionChange, onDropBrick, onExitPlaytestFullscreen, onViewportEvent,
  actorLabel, activeAbilityNames, worldLabels = [],
  playtestFullscreen,
}: GraphCanvasPanelProps): JSX.Element {
  const { t } = useI18n(); const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resolveNodeKindRef = useRef(resolveNodeKind), onSelectNodeRef = useRef(onSelectNode), onInteractRef = useRef(onInteract), onTriggerZoneStateChangeRef = useRef(onTriggerZoneStateChange), onDoorPositionsChangeRef = useRef(onDoorPositionsChange), onActorPositionChangeRef = useRef(onActorPositionChange);
  const cameraRef = useRef<CameraState>({ yaw: 0.52, pitch: 0.48, distance: 9.5, target: [0, 1, 0] });
  const actorHeadingRef = useRef(0), actorPitchRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null), cameraInteractionArmedRef = useRef(false);
  const dragNodeIdRef = useRef<string | null>(null);
  const lastPlaytestFullscreenRef = useRef(playtestFullscreen), lastCameraInputAtRef = useRef(0), lastCameraTraceRef = useRef(""), lastSceneResetAtRef = useRef(0), lastSceneSignatureRef = useRef("");
  const doorAnimRef = useRef<Record<string, { current: number; target: number }>>({}), activeTriggerIdsRef = useRef<Set<string>>(new Set());
  const actorStateRef = useRef<ActorPhysicsState>({ position: [0, 0, 5], verticalVelocity: 0, grounded: true, onLadder: false });
  const actorTelemetryRef = useRef<{ position: Vec3; speed: number } | null>(null);
  const inputRef = useRef({ forward: false, back: false, left: false, right: false, jump: false, ascend: false, descend: false });
  const fpsSampleRef = useRef({ elapsed: 0, frames: 0, value: 60 });
  const [cameraMode, setCameraMode] = useState<CameraMode>("editor"), [fps, setFps] = useState(60), [dragActive, setDragActive] = useState(false), [interactionPrompt, setInteractionPrompt] = useState<string | undefined>(undefined), [webglState, setWebglState] = useState<"booting" | "ready" | "failed">("booting"), [actorSpeed, setActorSpeed] = useState(0);
  useEffect(() => { resolveNodeKindRef.current = resolveNodeKind; onSelectNodeRef.current = onSelectNode; onInteractRef.current = onInteract; onTriggerZoneStateChangeRef.current = onTriggerZoneStateChange; onDoorPositionsChangeRef.current = onDoorPositionsChange; onActorPositionChangeRef.current = onActorPositionChange; });
  const toKind = (nodeType?: string): "door" | "switch" | "ladder" | "trigger-zone" | "enemy" | "generic" =>
    resolveNodeKindRef.current?.(nodeType) ?? (nodeType === "door" || nodeType === "switch" || nodeType === "ladder" || nodeType === "trigger-zone" || nodeType === "enemy" ? nodeType : "generic");
  const doorEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === "door").map(toDoorEntity), [nodes]);
  const triggerZoneEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === "trigger-zone").map(toTriggerZoneEntity), [nodes]);
  const switchEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === "switch").map(toSwitchEntity), [nodes]);
  const ladderEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === "ladder").map(toLadderEntity), [nodes]);
  const enemyEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === "enemy").map(toEnemyEntity), [nodes]);
  const genericEntities = useMemo(() => nodes.filter((node) => toKind(node.type) === "generic").map(toGenericEntity), [nodes]);
  const labelAnchors = useMemo<Record<string, Vec3>>(() => buildLabelAnchors([...doorEntities, ...switchEntities, ...ladderEntities, ...enemyEntities, ...genericEntities]), [doorEntities, enemyEntities, genericEntities, ladderEntities, switchEntities]);
  const orbitSampleEntities = useMemo(() => [...doorEntities, ...triggerZoneEntities, ...switchEntities, ...ladderEntities, ...enemyEntities, ...genericEntities], [doorEntities, enemyEntities, genericEntities, ladderEntities, switchEntities, triggerZoneEntities]);
  const orbitSamplePositions = useMemo<Vec3[]>(() => getOrbitSamplePositions(orbitSampleEntities), [orbitSampleEntities]);
  const orbitTarget = useMemo(() => getSceneFocus(orbitSamplePositions), [orbitSamplePositions]);
  const orbitDistance = useMemo(() => getSceneOrbitDistance(orbitSamplePositions, orbitTarget), [orbitSamplePositions, orbitTarget]);
  const effectiveOrbitDistance = normalizeEditorOrbitDistance(orbitDistance);
  const orbitTargetKey = `${orbitTarget[0].toFixed(3)}/${orbitTarget[1].toFixed(3)}/${orbitTarget[2].toFixed(3)}`;
  const sceneSignatureKey = useMemo(() => `${nodes.map((node) => `${node.id}:${node.type ?? ""}:${node.transform?.position?.map((value) => value.toFixed(2)).join("/") ?? ""}`).join("|")}::${edges.map((edge) => `${edge.from}->${edge.to}`).join("|")}`, [edges, nodes]);
  const resetEditorCamera = (): void => { pointerRef.current = null; cameraInteractionArmedRef.current = false; lastSceneResetAtRef.current = performance.now(); cameraRef.current = createEditorHomeCamera(orbitTarget, orbitDistance); };
  const handleCameraModeChange = (nextMode: CameraMode): void => {
    lastCameraInputAtRef.current = performance.now();
    pointerRef.current = null;
    actorPitchRef.current = 0;
    if (nextMode === "editor") resetEditorCamera();
    onViewportEvent?.(`[camera_mode] next=${nextMode} orbit=${effectiveOrbitDistance.toFixed(2)} target=${formatVec3(orbitTarget)}`);
    setCameraMode(nextMode);
  };
  useEffect(() => {
    const nextPositions: Record<string, [number, number, number]> = {};
    doorEntities.forEach((entity) => { nextPositions[entity.id] = entity.transform.position; doorAnimRef.current[entity.id] = doorAnimRef.current[entity.id] ?? { current: 0, target: 0 }; });
    Object.keys(doorAnimRef.current).forEach((id) => { if (!nextPositions[id]) delete doorAnimRef.current[id]; });
    onDoorPositionsChangeRef.current?.(nextPositions);
  }, [doorEntities]);
  useEffect(() => { actorStateRef.current = { position: [0, 0, 8], verticalVelocity: 0, grounded: true, onLadder: false }; onActorPositionChangeRef.current?.(actorStateRef.current.position); }, []);
  useEffect(() => void onViewportEvent?.(`[viewport_ready] mode=${cameraMode} actor=${formatVec3(actorStateRef.current.position)} target=${formatVec3(orbitTarget)} distance=${effectiveOrbitDistance.toFixed(2)}`), []); useEffect(() => void onViewportEvent?.(`[scene_focus] mode=${cameraMode} target=${formatVec3(orbitTarget)} distance=${effectiveOrbitDistance.toFixed(2)}`), [cameraMode, effectiveOrbitDistance, orbitTargetKey]);
  useEffect(() => {
    if (cameraMode === "editor") return void (lastSceneSignatureRef.current !== sceneSignatureKey ? (lastSceneSignatureRef.current = sceneSignatureKey, resetEditorCamera()) : (cameraRef.current = { ...cameraRef.current, target: orbitTarget }));
    cameraRef.current = { ...cameraRef.current, target: orbitTarget, distance: Math.max(5.8, Math.min(orbitDistance, cameraRef.current.distance)) };
  }, [cameraMode, orbitDistance, orbitTargetKey, sceneSignatureKey]);
  useEffect(() => {
    if (playtestFullscreen) handleCameraModeChange("third");
    else if (lastPlaytestFullscreenRef.current) handleCameraModeChange("editor");
    lastPlaytestFullscreenRef.current = playtestFullscreen;
  }, [orbitDistance, orbitTargetKey, playtestFullscreen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code === "KeyW") inputRef.current.forward = true;
      if (event.code === "KeyS") inputRef.current.back = true;
      if (event.code === "KeyA") inputRef.current.left = true;
      if (event.code === "KeyD") inputRef.current.right = true;
      if (event.code === "Space") inputRef.current.jump = true;
      if (event.code === "KeyE") {
        const target = findInteractionTarget({
          actor: actorStateRef.current.position,
          doorEntities,
          switchEntities,
          ladderEntities,
          triggerZoneEntities,
        });
        if (target?.kind === "door") {
          const anim = doorAnimRef.current[target.id] ?? { current: 0, target: 0 };
          anim.target = anim.target > 0.1 ? 0 : 1;
          doorAnimRef.current[target.id] = anim;
        }
        if (target !== undefined) {
          onSelectNodeRef.current?.(target.id);
          onInteractRef.current?.(target.id);
        } else {
          onViewportEvent?.(`[interact_miss] actor=${actorStateRef.current.position.map((value) => value.toFixed(2)).join("/")} mode=${cameraMode}`);
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.code === "KeyW") inputRef.current.forward = false;
      if (event.code === "KeyS") inputRef.current.back = false;
      if (event.code === "KeyA") inputRef.current.left = false;
      if (event.code === "KeyD") inputRef.current.right = false;
      if (event.code === "Space") inputRef.current.jump = false;
    };
    const onBlur = (): void => {
      inputRef.current = { forward: false, back: false, left: false, right: false, jump: false, ascend: false, descend: false };
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [doorEntities, ladderEntities, switchEntities, triggerZoneEntities]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      setWebglState("failed");
      return;
    }
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (gl === null) {
      setWebglState("failed");
      return;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, `attribute vec3 aPos;uniform mat4 uMvp;void main(){gl_Position=uMvp*vec4(aPos,1.0);}`);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, `precision mediump float;uniform vec4 uColor;void main(){gl_FragColor=uColor;}`);
    if (vertexShader === null || fragmentShader === null) {
      setWebglState("failed");
      return;
    }
    const program = gl.createProgram();
    if (program === null) {
      setWebglState("failed");
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglState("failed");
      return;
    }
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, "aPos");
    const mvpLoc = gl.getUniformLocation(program, "uMvp");
    const colorLoc = gl.getUniformLocation(program, "uColor");
    if (posLoc < 0 || mvpLoc === null || colorLoc === null) {
      setWebglState("failed");
      return;
    }

    const cubeVertices = new Float32Array([
      -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    ]);
    const cubeIndices = new Uint16Array([
      0, 1, 2, 0, 2, 3, 1, 5, 6, 1, 6, 2, 5, 4, 7, 5, 7, 6,
      4, 0, 3, 4, 3, 7, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0,
    ]);
    const vbo = gl.createBuffer();
    const ebo = gl.createBuffer();
    if (vbo === null || ebo === null) {
      setWebglState("failed");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

    let raf = 0;
    let lastTime = performance.now();
    const resize = (): void => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const render = (): void => {
      setWebglState("ready");
      const now = performance.now();
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      fpsSampleRef.current.elapsed += dt;
      fpsSampleRef.current.frames += 1;
      if (fpsSampleRef.current.elapsed >= 0.25) {
        fpsSampleRef.current.value = Math.round(fpsSampleRef.current.frames / fpsSampleRef.current.elapsed);
        fpsSampleRef.current.elapsed = 0;
        fpsSampleRef.current.frames = 0;
        setFps(fpsSampleRef.current.value);
      }

      inputRef.current.ascend = inputRef.current.forward;
      inputRef.current.descend = inputRef.current.back;
      const nextActor = updateActorPhysics({
        state: actorStateRef.current,
        input: inputRef.current,
        dt,
        heading: actorHeadingRef.current,
        cameraMode,
        doorEntities,
        doorAnim: doorAnimRef.current,
        ladderEntities,
      });
      actorStateRef.current = nextActor;
      const previousActor = actorTelemetryRef.current?.position ?? nextActor.position;
      const nextSpeed = Math.hypot(nextActor.position[0] - previousActor[0], nextActor.position[2] - previousActor[2]) / Math.max(0.001, dt);
      actorTelemetryRef.current = { position: nextActor.position, speed: nextSpeed };
      if (Math.abs(nextSpeed - actorSpeed) > 0.05) setActorSpeed(nextSpeed);
      onActorPositionChangeRef.current?.(nextActor.position);
      setInteractionPrompt(
        findInteractionTarget({
          actor: nextActor.position,
          doorEntities,
          switchEntities,
          ladderEntities,
          triggerZoneEntities,
        })?.prompt,
      );
      resize();
      drawScene({
        canvas,
        gl,
        posLoc,
        mvpLoc,
        colorLoc,
        cubeIndices,
        vbo,
        ebo,
        camera: cameraRef.current,
        cameraMode,
        actor: actorStateRef.current.position,
        heading: actorHeadingRef.current,
        pitch: actorPitchRef.current,
        doorEntities,
        triggerZoneEntities,
        switchEntities,
        ladderEntities,
        enemyEntities,
        genericEntities,
        doorAnim: doorAnimRef.current,
        onTriggerZoneStateChange: onTriggerZoneStateChangeRef.current,
        activeTriggerIdsRef,
      });
      const cameraTrace = getCameraTrace(cameraMode, cameraRef.current);
      if (cameraTrace !== lastCameraTraceRef.current) {
        if (lastCameraTraceRef.current.length > 0 && now - lastCameraInputAtRef.current > 250) {
          onViewportEvent?.(`[camera_drift] ${cameraTrace}`);
        }
        lastCameraTraceRef.current = cameraTrace;
      }
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(raf);
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ebo);
      gl.deleteProgram(program);
    };
  }, [cameraMode, doorEntities, enemyEntities, genericEntities, ladderEntities, switchEntities, triggerZoneEntities]);

  const onPointerDown = (event: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect: () => DOMRect } }): void => {
    if (cameraMode === "editor") {
      const rect = event.currentTarget.getBoundingClientRect();
      const { eye, dir } = getRayContext(rect, event.clientX, event.clientY, cameraRef.current);
      const hit = findHitEntity({ eye, dir, doorEntities, switchEntities, ladderEntities, enemyEntities, genericEntities });
      if (hit !== undefined) {
        onSelectNodeRef.current?.(hit.id);
        dragNodeIdRef.current = hit.id;
      }
    }
    cameraInteractionArmedRef.current = true;
    pointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect: () => DOMRect } }): void => {
    if (pointerRef.current === null) return;
    if (cameraMode === "editor" && dragNodeIdRef.current !== null) {
      const rect = event.currentTarget.getBoundingClientRect();
      const { eye, dir } = getRayContext(rect, event.clientX, event.clientY, cameraRef.current);
      onMoveNode(dragNodeIdRef.current, projectRayToGround(eye, dir));
      pointerRef.current = { x: event.clientX, y: event.clientY };
      return;
    }
    cameraInteractionArmedRef.current = true;
    lastCameraInputAtRef.current = performance.now();
    const dx = event.clientX - pointerRef.current.x;
    const dy = event.clientY - pointerRef.current.y;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    if (cameraMode === "editor") {
      cameraRef.current = {
        ...cameraRef.current,
        yaw: cameraRef.current.yaw + dx * 0.01,
        pitch: Math.max(-1.2, Math.min(1.2, cameraRef.current.pitch + dy * 0.01)),
      };
    } else {
      actorHeadingRef.current += dx * 0.01;
      actorPitchRef.current = Math.max(-0.45, Math.min(0.45, actorPitchRef.current + dy * 0.005));
    }
  };

  const onPointerUp = (): void => { pointerRef.current = null; dragNodeIdRef.current = null; };

  const onWheel = (event: { deltaY: number; preventDefault: () => void }): void => {
    if (cameraMode !== "editor") return;
    event.preventDefault();
    if (performance.now() - lastSceneResetAtRef.current < 350 || !cameraInteractionArmedRef.current) {
      onViewportEvent?.(`[camera_zoom_ignored] delta=${event.deltaY.toFixed(2)} armed=${cameraInteractionArmedRef.current ? "yes" : "no"} since_reset_ms=${Math.round(performance.now() - lastSceneResetAtRef.current)}`);
      return;
    }
    lastCameraInputAtRef.current = performance.now();
    const nextDistance = Math.max(5.4, Math.min(18, cameraRef.current.distance - event.deltaY * 0.01));
    cameraRef.current = {
      ...cameraRef.current,
      distance: nextDistance,
    };
    onViewportEvent?.(`[camera_zoom] delta=${event.deltaY.toFixed(2)} distance=${nextDistance.toFixed(2)} target=${formatVec3(cameraRef.current.target)}`);
  };

  const onCanvasClick = (event: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect: () => DOMRect } }): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { eye, dir } = getRayContext(rect, event.clientX, event.clientY, cameraRef.current);
    const hit = findHitEntity({ eye, dir, doorEntities, switchEntities, ladderEntities, enemyEntities, genericEntities });
    if (hit === undefined) return;
    onSelectNodeRef.current?.(hit.id);
    if (cameraMode === "editor") return;
    if (hit.kind === "door") {
      const anim = doorAnimRef.current[hit.id] ?? { current: 0, target: 0 };
      anim.target = anim.target > 0.1 ? 0 : 1;
      doorAnimRef.current[hit.id] = anim;
    }
    if (hit.kind === "door" || hit.kind === "switch" || hit.kind === "ladder") onInteractRef.current?.(hit.id);
  };

  const onCanvasContextMenu = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const { eye, dir } = getRayContext(rect, event.clientX, event.clientY, cameraRef.current);
    const hit = findHitEntity({ eye, dir, doorEntities, switchEntities, ladderEntities, enemyEntities, genericEntities });
    if (hit !== undefined) onDeleteNode(hit.id);
  };

  const onAddNode = (): void => {
    const nextId = `node-${Date.now()}`;
    onChange({ nodes: [...nodes, { id: nextId, type: defaultNodeType ?? "door" }], edges });
  };

  const onDeleteNode = (id: string): void => { onChange({ nodes: nodes.filter((node) => node.id !== id), edges: edges.filter((edge) => edge.from !== id && edge.to !== id) }); };

  const onMoveNode = (id: string, position: [number, number, number]): void => {
    onChange({ nodes: nodes.map((node) => (node.id === id ? { ...node, transform: { position, rotation: node.transform?.rotation ?? [0, 0, 0] } } : node)), edges });
  };

  const onAddEdge = (): void => {
    if (nodes.length < 2) return;
    const from = nodes[nodes.length - 2]?.id;
    const to = nodes[nodes.length - 1]?.id;
    if (typeof from !== "string" || typeof to !== "string") return;
    onChange({ nodes, edges: [...edges, { from, to }] });
  };

  const onDeleteEdge = (index: number): void => {
    onChange({ nodes, edges: edges.filter((_, edgeIndex) => edgeIndex !== index) });
  };

  const onCanvasDragOver = (event: React.DragEvent<HTMLCanvasElement>): void => {
    if (event.dataTransfer.types.includes("application/x-fate-brick-id")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setDragActive(true);
    }
  };

  const onCanvasDrop = (event: React.DragEvent<HTMLCanvasElement>): void => {
    const brickId = event.dataTransfer.getData("application/x-fate-brick-id");
    if (brickId.length === 0) return;
    event.preventDefault();
    setDragActive(false);
    const bounds = event.currentTarget.getBoundingClientRect();
    const { eye, dir } = getRayContext(bounds, event.clientX, event.clientY, cameraRef.current);
    onDropBrick?.(brickId, projectRayToGround(eye, dir));
  };

  return (
    <div
      style={
        playtestFullscreen
          ? {
              position: "fixed",
              inset: "12px",
              zIndex: 90,
              background: "#111821",
              borderRadius: "14px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.45)",
            }
          : undefined
      }
    >
      <div
        style={{
          height: playtestFullscreen ? "calc(100vh - 24px)" : "clamp(520px, 64vh, 760px)",
          minHeight: playtestFullscreen ? "calc(100vh - 24px)" : "520px",
          border: "1px solid #273240",
          borderRadius: "12px",
          padding: "10px",
          color: "#dfe8f2",
          display: "grid",
          gridTemplateRows: "auto 1fr auto auto",
          gap: "10px",
          background: "linear-gradient(180deg, rgba(29, 36, 47, 0.98) 0%, rgba(22, 28, 38, 0.98) 100%)",
        }}
      >
        <GraphCanvasHud
          fps={fps}
          cameraMode={cameraMode}
          playtestFullscreen={playtestFullscreen}
          onExitPlaytestFullscreen={onExitPlaytestFullscreen}
          actorLabel={actorLabel}
          actorPosition={actorStateRef.current.position}
          actorSpeed={actorSpeed}
          activeAbilityNames={activeAbilityNames}
          title={t("panel.graphCanvas.title")}
          actorDefaultLabel={t("panel.graphCanvas.actorDefault")}
          actorAbilitiesText={t("panel.graphCanvas.actorAbilities", { abilities: activeAbilityNames?.join(", ") ?? "" })}
          actorAbilitiesEmptyText={t("panel.graphCanvas.actorAbilitiesEmpty")}
          interactionPrompt={interactionPrompt}
          grounded={actorStateRef.current.grounded}
          onLadder={actorStateRef.current.onLadder}
          orbitDistance={cameraRef.current.distance}
          onChangeCameraMode={handleCameraModeChange}
        />
        <div style={{ position: "relative", minHeight: 0, height: "100%", overflow: "hidden" }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", minHeight: "320px", width: "100%", height: "100%", border: dragActive ? "1px solid #5f8bc2" : "1px solid #2f3b4c", borderRadius: "8px", touchAction: "none", cursor: cameraMode === "editor" ? "grab" : "crosshair" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            onClick={onCanvasClick}
            onContextMenu={onCanvasContextMenu}
            onDragOver={onCanvasDragOver}
            onDragLeave={() => setDragActive(false)}
            onDrop={onCanvasDrop}
          />
          <GraphCanvasOverlays
            canvas={canvasRef.current}
            dragActive={dragActive}
            webglState={webglState}
            dragHintText={t("panel.graphCanvas.dropHint")}
            worldLabels={worldLabels}
            labelAnchors={labelAnchors}
            nodes={nodes}
            cameraMode={cameraMode}
            cameraRef={cameraRef}
            actorStateRef={actorStateRef}
            actorHeadingRef={actorHeadingRef}
            actorPitchRef={actorPitchRef}
          />
        </div>
        <div style={{ fontSize: "12px", color: "#9db0c5" }}>
          {cameraMode === "editor" ? "编辑视角: 拖拽旋转，滚轮缩放。" : cameraMode === "first" ? "第一视角: WASD 行走，拖拽调整朝向。" : "第三视角: WASD 行走，拖拽绕主角观察。"}
        </div>
        <GraphCanvasDebugList nodes={nodes} edges={edges} defaultNodeType={defaultNodeType} onSelectNode={onSelectNode} onAddNode={onAddNode} onAddEdge={onAddEdge} onDeleteNode={onDeleteNode} onDeleteEdge={onDeleteEdge} />
      </div>
    </div>
  );
}
