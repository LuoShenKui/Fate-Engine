using FateDemo.DOTS;
using Unity.Entities;
using Unity.Mathematics;
using UnityEngine;

namespace FateDemo.DOTS
{
    [WorldSystemFilter(WorldSystemFilterFlags.Default | WorldSystemFilterFlags.Editor)]
    public partial class CharacterFoundationDemoSystem : SystemBase
    {
        protected override void OnUpdate()
        {
            if (!SystemAPI.TryGetSingletonEntity<CharacterFoundationActor>(out var actorEntity) ||
                !SystemAPI.TryGetSingletonEntity<CharacterFoundationProfile>(out var profileEntity) ||
                !SystemAPI.TryGetSingletonEntity<CharacterFoundationProp>(out var propEntity) ||
                !SystemAPI.TryGetSingletonEntity<CharacterFoundationLadder>(out var ladderEntity) ||
                !SystemAPI.TryGetSingletonEntity<CharacterFoundationTarget>(out var targetEntity))
            {
                return;
            }

            var deltaTime = SystemAPI.Time.DeltaTime;
            var profile = EntityManager.GetComponentData<CharacterFoundationProfile>(profileEntity);
            var actor = EntityManager.GetComponentData<CharacterFoundationActor>(actorEntity);
            var prop = EntityManager.GetComponentData<CharacterFoundationProp>(propEntity);
            var ladder = EntityManager.GetComponentData<CharacterFoundationLadder>(ladderEntity);
            var target = EntityManager.GetComponentData<CharacterFoundationTarget>(targetEntity);

            var moveInput = new float3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
            var moveLength = math.length(new float2(moveInput.x, moveInput.z));
            if (moveLength > 1f)
            {
                moveInput /= moveLength;
            }

            if (actor.IsOnLadder == 0 && Input.GetKeyDown(KeyCode.E) && math.distance(actor.Position, ladder.BasePosition + new float3(0f, 1.5f, 0f)) <= profile.PickupReachMeters + 0.4f)
            {
                actor.IsOnLadder = 1;
                actor.VerticalVelocity = 0f;
            }

            if (actor.IsOnLadder == 1)
            {
                actor.Position.x = ladder.BasePosition.x;
                actor.Position.z = ladder.BasePosition.z;
                actor.Position.y += Input.GetAxisRaw("Vertical") * profile.LadderClimbSpeedMps * deltaTime;
                actor.Position.y = math.clamp(actor.Position.y, profile.ActorHeightMeters * 0.5f, ladder.HeightMeters + profile.ActorHeightMeters * 0.5f);
                if (Input.GetKeyDown(KeyCode.Space) || actor.Position.y >= ladder.HeightMeters + profile.ActorHeightMeters * 0.5f - 0.01f)
                {
                    actor.IsOnLadder = 0;
                }
            }
            else
            {
                var speed = Input.GetKey(KeyCode.LeftShift) ? profile.RunSpeedMps : profile.WalkSpeedMps;
                actor.Position += new float3(moveInput.x, 0f, moveInput.z) * speed * deltaTime;
                if (moveLength > 0.01f)
                {
                    actor.FacingRadians = math.atan2(moveInput.x, moveInput.z);
                }

                if (actor.IsGrounded == 1 && Input.GetKeyDown(KeyCode.Space))
                {
                    actor.VerticalVelocity = math.sqrt(2f * 9.81f * math.max(profile.JumpHeightMeters, 0.1f));
                    actor.IsGrounded = 0;
                }

                actor.VerticalVelocity -= 9.81f * deltaTime;
                actor.Position.y += actor.VerticalVelocity * deltaTime;
                var groundHeight = profile.ActorHeightMeters * 0.5f;
                if (actor.Position.y <= groundHeight)
                {
                    actor.Position.y = groundHeight;
                    actor.VerticalVelocity = 0f;
                    actor.IsGrounded = 1;
                }
            }

            if (actor.HasProp == 0 && Input.GetKeyDown(KeyCode.F) && math.distance(actor.Position, prop.Position) <= profile.PickupReachMeters)
            {
                actor.HasProp = 1;
                actor.HeldProp = propEntity;
                prop.IsHeld = 1;
                prop.WasThrown = 0;
                prop.Velocity = float3.zero;
            }

            if (actor.HasProp == 1)
            {
                var handOffset = new float3(math.sin(actor.FacingRadians), 0.15f, math.cos(actor.FacingRadians)) * 0.7f;
                prop.Position = actor.Position + handOffset;
                prop.IsHeld = 1;

                if (Input.GetKeyDown(KeyCode.G))
                {
                    actor.HasProp = 0;
                    actor.HeldProp = Entity.Null;
                    prop.IsHeld = 0;
                    prop.WasThrown = 1;
                    prop.Velocity = new float3(math.sin(actor.FacingRadians), 0.18f, math.cos(actor.FacingRadians)) * profile.ThrowSpeedMps;
                }
            }
            else
            {
                prop.IsHeld = 0;
                prop.Velocity.y -= 9.81f * deltaTime;
                prop.Position += prop.Velocity * deltaTime;
                if (prop.Position.y <= 0.5f)
                {
                    prop.Position.y = 0.5f;
                    prop.Velocity.y = 0f;
                }

                if (math.distance(prop.Position, target.Position) <= target.RadiusMeters)
                {
                    actor.HitTarget = 1;
                }
            }

            EntityManager.SetComponentData(actorEntity, actor);
            EntityManager.SetComponentData(propEntity, prop);
        }
    }
}
