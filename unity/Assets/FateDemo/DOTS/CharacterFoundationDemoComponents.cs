using Unity.Entities;
using Unity.Mathematics;

namespace FateDemo.DOTS
{
    public struct CharacterFoundationProfile : IComponentData
    {
        public float WalkSpeedMps;
        public float RunSpeedMps;
        public float JumpHeightMeters;
        public float LadderClimbSpeedMps;
        public float PickupReachMeters;
        public float ThrowSpeedMps;
        public float StepLengthMeters;
        public float ActorHeightMeters;
    }

    public struct CharacterFoundationActor : IComponentData
    {
        public float3 Position;
        public float VerticalVelocity;
        public float FacingRadians;
        public byte IsGrounded;
        public byte IsOnLadder;
        public byte HasProp;
        public byte HitTarget;
        public Entity HeldProp;
    }

    public struct CharacterFoundationProp : IComponentData
    {
        public float3 Position;
        public float3 Velocity;
        public byte IsHeld;
        public byte WasThrown;
    }

    public struct CharacterFoundationLadder : IComponentData
    {
        public float3 BasePosition;
        public float HeightMeters;
        public float RadiusMeters;
    }

    public struct CharacterFoundationTarget : IComponentData
    {
        public float3 Position;
        public float RadiusMeters;
    }

    public struct CharacterFoundationVisualRef : IComponentData
    {
        public int Id;
    }
}
