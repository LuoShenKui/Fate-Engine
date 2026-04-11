using System.Collections.Generic;
using FateDemo.DOTS;
using FateUnityImporter.Runtime;
using Unity.Entities;
using Unity.Mathematics;
using UnityEngine;

namespace FateDemo.DOTS
{
    public sealed class CharacterFoundationDemoBootstrap : MonoBehaviour
    {
        private readonly List<(Entity entity, Transform transform, Renderer renderer)> visualLinks = new();
        private EntityManager entityManager;
        private FateRecipeAsset loadedRecipe;
        private FateRuntimeHostPrototype runtimeHost;
        private int snapshotTick;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureBootstrap()
        {
            if (FindFirstObjectByType<CharacterFoundationDemoBootstrap>() != null)
            {
                return;
            }

            var go = new GameObject("CharacterFoundationDemoBootstrap");
            DontDestroyOnLoad(go);
            go.AddComponent<CharacterFoundationDemoBootstrap>();
        }

        private void Start()
        {
            EnsureCameraAndLight();
            runtimeHost = GetComponent<FateRuntimeHostPrototype>();
            if (runtimeHost == null)
            {
                runtimeHost = gameObject.AddComponent<FateRuntimeHostPrototype>();
            }
            entityManager = World.DefaultGameObjectInjectionWorld.EntityManager;
            loadedRecipe = LoadRecipe();
            BuildValidationRoom();
        }

        private void LateUpdate()
        {
            if (!entityManager.IsCreated)
            {
                return;
            }

            for (var index = 0; index < visualLinks.Count; index += 1)
            {
                var (entity, targetTransform, targetRenderer) = visualLinks[index];
                if (!entityManager.Exists(entity))
                {
                    continue;
                }

                if (entityManager.HasComponent<CharacterFoundationActor>(entity))
                {
                    var actor = entityManager.GetComponentData<CharacterFoundationActor>(entity);
                    targetTransform.position = new Vector3(actor.Position.x, actor.Position.y, actor.Position.z);
                    if (targetRenderer != null)
                    {
                        targetRenderer.material.color = actor.HitTarget == 1 ? new Color(0.3f, 0.9f, 0.4f) : new Color(0.9f, 0.85f, 0.75f);
                    }
                }
                else if (entityManager.HasComponent<CharacterFoundationProp>(entity))
                {
                    var prop = entityManager.GetComponentData<CharacterFoundationProp>(entity);
                    targetTransform.position = new Vector3(prop.Position.x, prop.Position.y, prop.Position.z);
                }
                else if (entityManager.HasComponent<CharacterFoundationLadder>(entity))
                {
                    var ladder = entityManager.GetComponentData<CharacterFoundationLadder>(entity);
                    targetTransform.position = new Vector3(ladder.BasePosition.x, ladder.BasePosition.y + ladder.HeightMeters * 0.5f, ladder.BasePosition.z);
                }
                else if (entityManager.HasComponent<CharacterFoundationTarget>(entity))
                {
                    var target = entityManager.GetComponentData<CharacterFoundationTarget>(entity);
                    targetTransform.position = new Vector3(target.Position.x, target.Position.y, target.Position.z);
                }
            }

            PublishRuntimeSnapshot();
        }

        private void BuildValidationRoom()
        {
            runtimeHost.ConfigureNpcAi(loadedRecipe?.RuntimeFeatureFlags?.NpcAiEnabled ?? true);
            var profile = new CharacterFoundationProfile
            {
                ActorHeightMeters = loadedRecipe != null ? loadedRecipe.CharacterFoundation.HeightMeters : 1.78f,
                WalkSpeedMps = loadedRecipe != null ? loadedRecipe.CharacterFoundation.WalkSpeedMetersPerSecond : 1.42f,
                RunSpeedMps = loadedRecipe != null ? loadedRecipe.CharacterFoundation.RunSpeedMetersPerSecond : 3.8f,
                JumpHeightMeters = loadedRecipe != null ? loadedRecipe.CharacterFoundation.JumpHeightMeters : 0.45f,
                LadderClimbSpeedMps = loadedRecipe != null ? loadedRecipe.CharacterFoundation.LadderClimbSpeedMetersPerSecond : 1.9f,
                PickupReachMeters = loadedRecipe != null ? loadedRecipe.CharacterFoundation.PickupReachMeters : 1.25f,
                ThrowSpeedMps = loadedRecipe != null ? loadedRecipe.CharacterFoundation.ThrowImpulseNewtons * 0.055f : 11.5f,
                StepLengthMeters = loadedRecipe != null ? loadedRecipe.CharacterFoundation.StepLengthMeters : 0.75f,
            };

            CreateFloor();
            CreateRoomMarkers();

            var actorEntity = entityManager.CreateEntity(typeof(CharacterFoundationProfile), typeof(CharacterFoundationActor));
            entityManager.SetComponentData(actorEntity, profile);
            entityManager.SetComponentData(actorEntity, new CharacterFoundationActor
            {
                Position = new float3(0f, profile.ActorHeightMeters * 0.5f, 0f),
                IsGrounded = 1,
                FacingRadians = 0f,
                HeldProp = Entity.Null,
            });
            RegisterVisual(actorEntity, GameObject.CreatePrimitive(PrimitiveType.Capsule), new Vector3(0f, profile.ActorHeightMeters * 0.5f, 0f), "Actor");

            var propEntity = entityManager.CreateEntity(typeof(CharacterFoundationProp));
            entityManager.SetComponentData(propEntity, new CharacterFoundationProp
            {
                Position = new float3(2f, 0.5f, 2f),
                Velocity = float3.zero,
                IsHeld = 0,
                WasThrown = 0,
            });
            RegisterVisual(propEntity, GameObject.CreatePrimitive(PrimitiveType.Cube), new Vector3(2f, 0.5f, 2f), "PickupProp");

            var ladderEntity = entityManager.CreateEntity(typeof(CharacterFoundationLadder));
            entityManager.SetComponentData(ladderEntity, new CharacterFoundationLadder
            {
                BasePosition = new float3(5f, 0f, 0f),
                HeightMeters = 3.5f,
                RadiusMeters = 0.7f,
            });
            var ladderObject = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ladderObject.transform.localScale = new Vector3(0.5f, 3.5f, 1.2f);
            RegisterVisual(ladderEntity, ladderObject, new Vector3(5f, 1.75f, 0f), "Ladder");

            var targetEntity = entityManager.CreateEntity(typeof(CharacterFoundationTarget));
            entityManager.SetComponentData(targetEntity, new CharacterFoundationTarget
            {
                Position = new float3(10f, 1f, 2f),
                RadiusMeters = 1f,
            });
            var targetObject = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            targetObject.transform.localScale = new Vector3(1.5f, 0.1f, 1.5f);
            RegisterVisual(targetEntity, targetObject, new Vector3(10f, 1f, 2f), "ThrowTarget");
        }

        private void PublishRuntimeSnapshot()
        {
            if (runtimeHost == null || !entityManager.IsCreated)
            {
                return;
            }

            snapshotTick += 1;
            var entities = new List<FateRuntimeEntityRecord>();
            using var entityQuery = entityManager.UniversalQuery.ToEntityArray(Unity.Collections.Allocator.Temp);
            for (var index = 0; index < entityQuery.Length; index += 1)
            {
                var entity = entityQuery[index];
                if (entityManager.HasComponent<CharacterFoundationActor>(entity))
                {
                    var actor = entityManager.GetComponentData<CharacterFoundationActor>(entity);
                    entities.Add(FateRuntimeHostBridge.CreateEntityRecord(
                        "actor-1",
                        "player",
                        "humanoid",
                        new Vector3(actor.Position.x, actor.Position.y, actor.Position.z),
                        actor.IsOnLadder == 1 ? "on_ladder" : actor.IsGrounded == 1 ? "grounded" : "airborne"));
                }
                else if (entityManager.HasComponent<CharacterFoundationProp>(entity))
                {
                    var prop = entityManager.GetComponentData<CharacterFoundationProp>(entity);
                    entities.Add(FateRuntimeHostBridge.CreateEntityRecord(
                        "pickup-prop-1",
                        "object",
                        "generic",
                        new Vector3(prop.Position.x, prop.Position.y, prop.Position.z),
                        prop.IsHeld == 1 ? "held" : prop.WasThrown == 1 ? "thrown" : "idle"));
                }
                else if (entityManager.HasComponent<CharacterFoundationLadder>(entity))
                {
                    var ladder = entityManager.GetComponentData<CharacterFoundationLadder>(entity);
                    entities.Add(FateRuntimeHostBridge.CreateEntityRecord(
                        "ladder-1",
                        "object",
                        "generic",
                        new Vector3(ladder.BasePosition.x, ladder.BasePosition.y, ladder.BasePosition.z),
                        "ladder"));
                }
                else if (entityManager.HasComponent<CharacterFoundationTarget>(entity))
                {
                    var target = entityManager.GetComponentData<CharacterFoundationTarget>(entity);
                    entities.Add(FateRuntimeHostBridge.CreateEntityRecord(
                        "throw-target-1",
                        "object",
                        "generic",
                        new Vector3(target.Position.x, target.Position.y, target.Position.z),
                        "target"));
                }
            }

            runtimeHost.UpdateSnapshot(new FateRuntimeSnapshotRecord
            {
                ProtocolVersion = "1.0",
                Tick = snapshotTick,
                Seed = 424242,
                FeatureFlags = FateRuntimeHostBridge.ResolveFeatureFlags(loadedRecipe),
                Entities = entities.ToArray(),
            });
        }

        private void RegisterVisual(Entity entity, GameObject visual, Vector3 position, string label)
        {
            visual.name = label;
            visual.transform.position = position;
            var renderer = visual.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = label == "ThrowTarget" ? new Color(0.95f, 0.25f, 0.25f) : new Color(0.9f, 0.85f, 0.75f);
            }
            visualLinks.Add((entity, visual.transform, renderer));
        }

        private FateRecipeAsset LoadRecipe()
        {
            var resource = Resources.Load<FateRecipeAsset>("CharacterFoundationDemoRecipe");
            if (resource != null)
            {
                return resource;
            }

#if UNITY_EDITOR
            var guids = UnityEditor.AssetDatabase.FindAssets("t:FateRecipeAsset CharacterFoundationDemoRecipe");
            if (guids.Length > 0)
            {
                var path = UnityEditor.AssetDatabase.GUIDToAssetPath(guids[0]);
                return UnityEditor.AssetDatabase.LoadAssetAtPath<FateRecipeAsset>(path);
            }
#endif
            Debug.LogWarning("CharacterFoundationDemoRecipe not found. Using fallback defaults.");
            return null;
        }

        private static void EnsureCameraAndLight()
        {
            if (Camera.main == null)
            {
                var cameraObject = new GameObject("Main Camera");
                cameraObject.tag = "MainCamera";
                var camera = cameraObject.AddComponent<Camera>();
                cameraObject.transform.position = new Vector3(-9f, 7f, -9f);
                cameraObject.transform.rotation = Quaternion.Euler(24f, 45f, 0f);
                camera.clearFlags = CameraClearFlags.Skybox;
            }

            if (FindFirstObjectByType<Light>() == null)
            {
                var lightObject = new GameObject("Directional Light");
                var light = lightObject.AddComponent<Light>();
                light.type = LightType.Directional;
                light.intensity = 1.1f;
                lightObject.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
            }
        }

        private static void CreateFloor()
        {
            if (GameObject.Find("ValidationFloor") != null)
            {
                return;
            }

            var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "ValidationFloor";
            floor.transform.position = Vector3.zero;
            floor.transform.localScale = new Vector3(4f, 1f, 2.5f);
            var renderer = floor.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = new Color(0.28f, 0.31f, 0.34f);
            }
        }

        private static void CreateRoomMarkers()
        {
            CreateMarker("RunTrack", new Vector3(0f, 0.01f, -2f), new Vector3(12f, 0.02f, 1.2f), new Color(0.18f, 0.35f, 0.55f));
            CreateMarker("JumpPad", new Vector3(2.5f, 0.1f, -2f), new Vector3(1.2f, 0.2f, 1.2f), new Color(0.35f, 0.55f, 0.25f));
        }

        private static void CreateMarker(string name, Vector3 position, Vector3 scale, Color color)
        {
            if (GameObject.Find(name) != null)
            {
                return;
            }

            var marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
            marker.name = name;
            marker.transform.position = position;
            marker.transform.localScale = scale;
            var renderer = marker.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = color;
            }
        }
    }
}
