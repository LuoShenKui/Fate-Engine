using System.Collections.Generic;
using FateUnityImporter.Runtime;
using UnityEngine;

namespace FateDemo.XR
{
    public sealed class XrBaseHallBootstrap : MonoBehaviour
    {
        private const float HallRadiusMeters = 16f;
        private static readonly int EmissionColor = Shader.PropertyToID("_EmissionColor");

        private readonly List<GameObject> spawnedObjects = new();
        private FateRuntimeHostPrototype runtimeHost;
        private FateXrHostLayer xrHostLayer;
        private Transform playerRoot;
        private Transform headAnchor;
        private Transform leftHandAnchor;
        private Transform rightHandAnchor;
        private GameObject shopShell;
        private Light orbLight;
        private int snapshotTick;
        private XrHallFeatureModuleRecord[] hallModules = System.Array.Empty<XrHallFeatureModuleRecord>();
        private XrHallDecorationRecord[] hallDecorations = System.Array.Empty<XrHallDecorationRecord>();
        private XrSixthSenseSignalRecord[] sixthSenseSignals = System.Array.Empty<XrSixthSenseSignalRecord>();

        [SerializeField] private bool smoothLocomotionEnabled = false;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureBootstrap()
        {
            if (FindFirstObjectByType<XrBaseHallBootstrap>() != null)
            {
                return;
            }

            var go = new GameObject("XrBaseHallBootstrap");
            DontDestroyOnLoad(go);
            go.AddComponent<XrBaseHallBootstrap>();
        }

        private void Start()
        {
            EnsureCameraAndLight();
            runtimeHost = GetComponent<FateRuntimeHostPrototype>();
            if (runtimeHost == null)
            {
                runtimeHost = gameObject.AddComponent<FateRuntimeHostPrototype>();
            }

            xrHostLayer = GetComponent<FateXrHostLayer>();
            if (xrHostLayer == null)
            {
                xrHostLayer = gameObject.AddComponent<FateXrHostLayer>();
            }

            var roomAnchors = BuildBaseHall();
            xrHostLayer.Initialize(runtimeHost, playerRoot, headAnchor, leftHandAnchor, rightHandAnchor, roomAnchors);
            hallModules = BuildHallModules();
            hallDecorations = BuildHallDecorations();
            sixthSenseSignals = BuildSixthSenseSignals();
            xrHostLayer.ConfigureHall(hallModules, hallDecorations, sixthSenseSignals);
            xrHostLayer.SetLocomotionMode(smoothLocomotionEnabled ? XrLocomotionMode.Smooth : XrLocomotionMode.Teleport);
            runtimeHost.ConfigureNpcAi(true);
        }

        private void Update()
        {
            if (xrHostLayer == null)
            {
                return;
            }

            var leftSelecting = Input.GetKey(KeyCode.Q);
            var leftActivating = Input.GetKey(KeyCode.Alpha1);
            var rightSelecting = Input.GetKey(KeyCode.E);
            var rightActivating = Input.GetKey(KeyCode.Alpha2);
            xrHostLayer.PushRigState(leftSelecting, leftActivating, rightSelecting, rightActivating);

            if (Input.GetKeyDown(KeyCode.Tab))
            {
                smoothLocomotionEnabled = !smoothLocomotionEnabled;
                xrHostLayer.SetLocomotionMode(smoothLocomotionEnabled ? XrLocomotionMode.Smooth : XrLocomotionMode.Teleport);
            }

            if (Input.GetKeyDown(KeyCode.F))
            {
                ToggleShopShell();
                xrHostLayer.SubmitInteraction("hall-shop-toggle", XrInteractionKind.UiSubmit, "godlight-shop-shell", "right");
            }

            if (Input.GetKeyDown(KeyCode.G))
            {
                xrHostLayer.SubmitInteraction("godlight-focus", XrInteractionKind.RayActivate, "godlight-core", "right");
            }

            AnimateGodLight();
            PublishHallSnapshot();
        }

        private XrRoomAnchorRecord[] BuildBaseHall()
        {
            CreateFloor();
            CreatePerimeterWalls();
            CreatePlayerRig();
            CreateGodLight();
            CreateShopShell();
            CreatePortalFrames();
            CreateAvatarBay();
            CreateStatusTotem();

            return new[]
            {
                CreateAnchor("spawn-point", "spawn", playerRoot.position, Quaternion.identity, new Vector3(2.2f, 2.5f, 2.2f)),
                CreateAnchor("godlight-core", "nexus", new Vector3(0f, 0f, 0f), Quaternion.identity, new Vector3(4f, 6f, 4f)),
                CreateAnchor("godlight-shop-shell", "shop", new Vector3(-5.5f, 0f, 4.5f), Quaternion.identity, new Vector3(4.5f, 3f, 3f)),
                CreateAnchor("portal-ring-north", "portal", new Vector3(0f, 0f, 11f), Quaternion.identity, new Vector3(3f, 4f, 1.2f)),
                CreateAnchor("portal-ring-west", "portal", new Vector3(-10f, 0f, -2.5f), Quaternion.Euler(0f, 90f, 0f), new Vector3(3f, 4f, 1.2f)),
                CreateAnchor("avatar-bay", "avatar", new Vector3(6f, 0f, -5f), Quaternion.identity, new Vector3(4f, 3f, 4f)),
            };
        }

        private void CreatePlayerRig()
        {
            playerRoot = CreateEmpty("PlayerRigRoot", new Vector3(0f, 0f, -5.5f)).transform;
            headAnchor = CreatePrimitive("HeadAnchor", PrimitiveType.Sphere, new Vector3(0f, 1.72f, 0f), new Vector3(0.22f, 0.22f, 0.22f), new Color(0.8f, 0.88f, 0.96f)).transform;
            headAnchor.SetParent(playerRoot, true);
            leftHandAnchor = CreatePrimitive("LeftHandAnchor", PrimitiveType.Sphere, new Vector3(-0.26f, 1.28f, 0.34f), new Vector3(0.12f, 0.12f, 0.12f), new Color(0.45f, 0.7f, 0.95f)).transform;
            leftHandAnchor.SetParent(playerRoot, true);
            rightHandAnchor = CreatePrimitive("RightHandAnchor", PrimitiveType.Sphere, new Vector3(0.26f, 1.28f, 0.34f), new Vector3(0.12f, 0.12f, 0.12f), new Color(0.95f, 0.68f, 0.38f)).transform;
            rightHandAnchor.SetParent(playerRoot, true);
        }

        private void CreateFloor()
        {
            var floor = CreatePrimitive("BaseHallFloor", PrimitiveType.Cylinder, Vector3.zero, new Vector3(HallRadiusMeters, 0.12f, HallRadiusMeters), new Color(0.19f, 0.2f, 0.24f));
            floor.transform.position = new Vector3(0f, -0.1f, 0f);
        }

        private void CreatePerimeterWalls()
        {
            for (var index = 0; index < 8; index += 1)
            {
                var angle = index * 45f;
                var radians = angle * Mathf.Deg2Rad;
                var position = new Vector3(Mathf.Sin(radians) * 12.5f, 2.1f, Mathf.Cos(radians) * 12.5f);
                var wall = CreatePrimitive($"BaseHallWall{index}", PrimitiveType.Cube, position, new Vector3(5f, 4.2f, 0.4f), new Color(0.11f, 0.12f, 0.15f));
                wall.transform.rotation = Quaternion.Euler(0f, angle, 0f);
            }
        }

        private void CreateGodLight()
        {
            var pedestal = CreatePrimitive("GodLightPedestal", PrimitiveType.Cylinder, new Vector3(0f, 0.6f, 0f), new Vector3(2f, 0.6f, 2f), new Color(0.24f, 0.26f, 0.31f));
            pedestal.transform.localScale = new Vector3(2.4f, 0.6f, 2.4f);

            var orb = CreatePrimitive("GodLightCore", PrimitiveType.Sphere, new Vector3(0f, 3.1f, 0f), new Vector3(2.3f, 2.3f, 2.3f), new Color(0.76f, 0.91f, 1f));
            var renderer = orb.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.EnableKeyword("_EMISSION");
                renderer.material.SetColor(EmissionColor, new Color(0.4f, 0.7f, 1f) * 2.4f);
            }

            var lightObject = CreateEmpty("GodLightRadiance", new Vector3(0f, 3.1f, 0f));
            orbLight = lightObject.AddComponent<Light>();
            orbLight.type = LightType.Point;
            orbLight.range = 18f;
            orbLight.intensity = 5.4f;
            orbLight.color = new Color(0.5f, 0.76f, 1f);
        }

        private void CreateShopShell()
        {
            shopShell = CreateEmpty("ShopShell", new Vector3(-5.5f, 0f, 4.5f));
            var kiosk = CreatePrimitive("ShopKiosk", PrimitiveType.Cube, shopShell.transform.position + new Vector3(0f, 1.25f, 0f), new Vector3(2.2f, 2.5f, 1.1f), new Color(0.21f, 0.24f, 0.29f));
            kiosk.transform.SetParent(shopShell.transform, true);

            var screen = CreatePrimitive("ShopScreen", PrimitiveType.Quad, shopShell.transform.position + new Vector3(0f, 1.7f, 0.56f), new Vector3(1.4f, 0.85f, 1f), new Color(0.12f, 0.18f, 0.28f));
            screen.transform.SetParent(shopShell.transform, true);
            screen.transform.rotation = Quaternion.Euler(0f, 180f, 0f);

            var console = CreatePrimitive("ShopConsole", PrimitiveType.Cube, shopShell.transform.position + new Vector3(0f, 0.92f, 1.15f), new Vector3(1.2f, 0.14f, 0.65f), new Color(0.34f, 0.39f, 0.46f));
            console.transform.SetParent(shopShell.transform, true);
        }

        private void CreatePortalFrames()
        {
            CreatePortalFrame("NorthPortalFrame", new Vector3(0f, 1.8f, 11f), 0f);
            CreatePortalFrame("WestPortalFrame", new Vector3(-10f, 1.8f, -2.5f), 90f);
            CreatePortalFrame("EastPortalFrame", new Vector3(10f, 1.8f, -2.5f), -90f);
        }

        private void CreatePortalFrame(string name, Vector3 position, float yawDegrees)
        {
            var parent = CreateEmpty(name, position);
            parent.transform.rotation = Quaternion.Euler(0f, yawDegrees, 0f);
            CreatePrimitive($"{name}_Left", PrimitiveType.Cube, position + parent.transform.right * -1.2f, new Vector3(0.24f, 3.6f, 0.3f), new Color(0.28f, 0.36f, 0.46f)).transform.SetParent(parent.transform, true);
            CreatePrimitive($"{name}_Right", PrimitiveType.Cube, position + parent.transform.right * 1.2f, new Vector3(0.24f, 3.6f, 0.3f), new Color(0.28f, 0.36f, 0.46f)).transform.SetParent(parent.transform, true);
            CreatePrimitive($"{name}_Top", PrimitiveType.Cube, position + Vector3.up * 1.8f, new Vector3(2.7f, 0.24f, 0.3f), new Color(0.28f, 0.36f, 0.46f)).transform.SetParent(parent.transform, true);
        }

        private void CreateAvatarBay()
        {
            var bay = CreateEmpty("AvatarBay", new Vector3(6f, 0f, -5f));
            var platform = CreatePrimitive("AvatarBayPlatform", PrimitiveType.Cylinder, bay.transform.position + new Vector3(0f, 0.2f, 0f), new Vector3(1.8f, 0.2f, 1.8f), new Color(0.24f, 0.25f, 0.3f));
            platform.transform.SetParent(bay.transform, true);

            var body = CreatePrimitive("AvatarBodyShell", PrimitiveType.Capsule, bay.transform.position + new Vector3(0f, 1.1f, 0f), new Vector3(0.9f, 1.1f, 0.9f), new Color(0.82f, 0.8f, 0.78f));
            body.transform.SetParent(bay.transform, true);
            var hair = CreatePrimitive("AvatarHairShell", PrimitiveType.Sphere, bay.transform.position + new Vector3(0f, 1.95f, 0f), new Vector3(0.62f, 0.42f, 0.62f), new Color(0.1f, 0.1f, 0.12f));
            hair.transform.SetParent(bay.transform, true);
        }

        private void CreateStatusTotem()
        {
            var totem = CreatePrimitive("HallStatusTotem", PrimitiveType.Cube, new Vector3(4.4f, 1.45f, 5.3f), new Vector3(1f, 2.9f, 0.26f), new Color(0.18f, 0.23f, 0.31f));
            totem.transform.rotation = Quaternion.Euler(0f, -25f, 0f);
        }

        private XrHallFeatureModuleRecord[] BuildHallModules()
        {
            return new[]
            {
                new XrHallFeatureModuleRecord
                {
                    ModuleId = "godlight-core-module",
                    ModuleKind = "nexus",
                    Label = "主神光球",
                    State = "online",
                    AnchorId = "godlight-core",
                    Capabilities = new[] { "narrative_status", "avatar_overview", "system_notice" },
                },
                new XrHallFeatureModuleRecord
                {
                    ModuleId = "shop-shell-module",
                    ModuleKind = "shop",
                    Label = "商店壳",
                    State = "standby",
                    AnchorId = "godlight-shop-shell",
                    Capabilities = new[] { "catalog_browse", "future_unlocks" },
                },
                new XrHallFeatureModuleRecord
                {
                    ModuleId = "avatar-bay-module",
                    ModuleKind = "avatar",
                    Label = "化身舱",
                    State = "standby",
                    AnchorId = "avatar-bay",
                    Capabilities = new[] { "avatar_create", "persona_switch", "outfit_tune" },
                },
            };
        }

        private XrHallDecorationRecord[] BuildHallDecorations()
        {
            return new[]
            {
                new XrHallDecorationRecord
                {
                    DecorationId = "hall-rune-ring",
                    Category = "floor_sigils",
                    AnchorId = "godlight-core",
                    Position = new Vector3(0f, 0.02f, 0f),
                    Scale = new Vector3(6f, 1f, 6f),
                    StyleTags = new[] { "realistic_base", "anime_accent" },
                },
                new XrHallDecorationRecord
                {
                    DecorationId = "avatar-bay-lights",
                    Category = "accent_light",
                    AnchorId = "avatar-bay",
                    Position = new Vector3(6f, 2.2f, -5f),
                    Scale = new Vector3(1.4f, 1f, 1.4f),
                    StyleTags = new[] { "identity_zone", "customization" },
                },
            };
        }

        private XrSixthSenseSignalRecord[] BuildSixthSenseSignals()
        {
            return new[]
            {
                new XrSixthSenseSignalRecord
                {
                    SignalId = "intuition-avatar-bay",
                    RecipientEntityId = "xr-player-rig",
                    Kind = "SystemNotice",
                    Summary = "第六感提示：你的化身舱已就绪。",
                    SuggestedPosition = new Vector3(6f, 0f, -5f),
                    HasSuggestedPosition = true,
                    Confidence = 0.92f,
                },
                new XrSixthSenseSignalRecord
                {
                    SignalId = "intuition-godlight",
                    RecipientEntityId = "xr-player-rig",
                    Kind = "QuestHint",
                    Summary = "第六感提示：主神光球可读取当前命运与任务状态。",
                    SuggestedPosition = new Vector3(0f, 0f, 0f),
                    HasSuggestedPosition = true,
                    Confidence = 0.88f,
                },
            };
        }

        private void PublishHallSnapshot()
        {
            if (runtimeHost == null)
            {
                return;
            }

            snapshotTick += 1;
            runtimeHost.UpdateSnapshot(new FateRuntimeSnapshotRecord
            {
                ProtocolVersion = "1.0-xr",
                Tick = snapshotTick,
                Seed = 909001,
                FeatureFlags = runtimeHost.FeatureFlags,
                Entities = new[]
                {
                    FateRuntimeHostBridge.CreateEntityRecord("xr-player-rig", "player", "humanoid", playerRoot.position, xrHostLayer.LocomotionMode == XrLocomotionMode.Smooth ? "smooth_locomotion" : "teleport_locomotion"),
                    FateRuntimeHostBridge.CreateEntityRecord("godlight-core", "nexus", "generic", new Vector3(0f, 3.1f, 0f), "godlight"),
                    FateRuntimeHostBridge.CreateEntityRecord("shop-shell", "shop", "generic", shopShell.transform.position, shopShell.activeSelf ? "shop_ready" : "shop_hidden"),
                    FateRuntimeHostBridge.CreateEntityRecord("avatar-bay", "avatar", "humanoid", new Vector3(6f, 1.1f, -5f), "avatar_station"),
                },
                ActiveTasks = runtimeHost.LatestSnapshot.ActiveTasks,
                FateRecords = runtimeHost.LatestSnapshot.FateRecords,
                DialogueTurns = runtimeHost.LatestSnapshot.DialogueTurns,
                XrState = runtimeHost.LatestSnapshot.XrState,
                PlayerAvatars = runtimeHost.LatestSnapshot.PlayerAvatars,
            });
        }

        private void ToggleShopShell()
        {
            if (shopShell == null)
            {
                return;
            }

            shopShell.SetActive(!shopShell.activeSelf);
        }

        private void AnimateGodLight()
        {
            if (orbLight == null)
            {
                return;
            }

            orbLight.intensity = 5.1f + Mathf.Sin(Time.time * 1.7f) * 0.8f;
        }

        private GameObject CreatePrimitive(string name, PrimitiveType primitiveType, Vector3 position, Vector3 scale, Color color)
        {
            var obj = GameObject.CreatePrimitive(primitiveType);
            obj.name = name;
            obj.transform.position = position;
            obj.transform.localScale = scale;
            var renderer = obj.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = color;
            }
            spawnedObjects.Add(obj);
            return obj;
        }

        private GameObject CreateEmpty(string name, Vector3 position)
        {
            var obj = new GameObject(name);
            obj.transform.position = position;
            spawnedObjects.Add(obj);
            return obj;
        }

        private static XrRoomAnchorRecord CreateAnchor(string anchorId, string anchorKind, Vector3 position, Quaternion rotation, Vector3 sizeMeters)
        {
            return new XrRoomAnchorRecord
            {
                AnchorId = anchorId,
                AnchorKind = anchorKind,
                Position = position,
                Rotation = rotation,
                SizeMeters = sizeMeters,
            };
        }

        private static void EnsureCameraAndLight()
        {
            if (Camera.main == null)
            {
                var cameraObject = new GameObject("Main Camera");
                cameraObject.tag = "MainCamera";
                var camera = cameraObject.AddComponent<Camera>();
                cameraObject.transform.position = new Vector3(0f, 1.72f, -5.5f);
                cameraObject.transform.rotation = Quaternion.identity;
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = new Color(0.04f, 0.05f, 0.08f);
            }

            if (FindFirstObjectByType<Light>() == null)
            {
                var lightObject = new GameObject("Directional Light");
                var light = lightObject.AddComponent<Light>();
                light.type = LightType.Directional;
                light.intensity = 0.95f;
                light.color = new Color(0.82f, 0.86f, 0.94f);
                lightObject.transform.rotation = Quaternion.Euler(44f, -36f, 0f);
            }
        }
    }
}
