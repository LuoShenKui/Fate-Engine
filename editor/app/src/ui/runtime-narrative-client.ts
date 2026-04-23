export type RuntimeAiHealthResponse = {
  available: boolean;
  base_url: string;
  model_name: string;
};

export type AvatarTemplateRecord = {
  template_id: string;
  label: string;
  description: string;
};

export type IdentityParameterProfile = {
  avatar_id: string;
  player_entity_id: string;
  height_meters: number;
  build_index: number;
  shoulder_width_meters: number;
  leg_length_ratio: number;
  skin_tone: string;
  gender_style_tendency: string;
  age_tendency: string;
  facial_feature_params: Record<string, number>;
};

export type HeadFitProfile = {
  avatar_id: string;
  capture_mode: string;
  fit_status: string;
  topology_profile: string;
  resemblance_notes: string;
  texture_profile: string;
  scan_summary: string;
};

export type AvatarBodyModel = {
  avatar_id: string;
  template_id: string;
  body_archetype: string;
  body_scale: [number, number, number];
  template_based_avatar: boolean;
};

export type AvatarTuningProfile = {
  avatar_id: string;
  build_offset: number;
  shoulder_offset: number;
  waist_offset: number;
  hairstyle_id: string;
  top_id: string;
  bottom_id: string;
  shoes_id: string;
  eyewear_id?: string | null;
};

export type PublicPersonaProfile = {
  avatar_id: string;
  presentation_mode: string;
  anime_persona_id: string;
  realistic_persona_id: string;
};

export type PlayerAvatarRecord = {
  avatar_id: string;
  player_entity_id: string;
  identity: IdentityParameterProfile;
  head_fit: HeadFitProfile;
  body_model: AvatarBodyModel;
  tuning: AvatarTuningProfile;
  public_persona: PublicPersonaProfile;
  equipment: string[];
};

export type DialogueCandidateRecord = {
  candidate_id: string;
  utterance: string;
  tone: string;
  intent: string;
  source: string;
  rejected_reason?: string | null;
  revealed_flags: string[];
  relationship_delta: number;
  fate_effects: string[];
  task_mutations: string[];
};

export type ConversationSessionRecord = {
  session_id: string;
  player_entity_id: string;
  npc_entity_id: string;
  timeline_id?: string | null;
  created_at_ms: number;
};

export type DialogueOptionRecord = {
  id: string;
  label: string;
  intent: string;
};

export type DialogueOutcomeRecord = {
  utterance: string;
  tone: string;
  intent: string;
  revealed_flags: string[];
  relationship_delta: number;
  fate_effects: string[];
  task_mutations: string[];
  world_reactions: string[];
};

export type DialogueTurnRecord = {
  turn_id: string;
  npc_entity_id: string;
  player_entity_id: string;
  options: DialogueOptionRecord[];
  outcome: DialogueOutcomeRecord;
  used_local_llm: boolean;
};

export type RuntimeDialogueBeginResponse = {
  session_id: string;
  generation_mode: string;
  turn: DialogueTurnRecord;
  candidates: DialogueCandidateRecord[];
  generation: {
    generation_mode: string;
    prompt_envelope: Record<string, unknown>;
    selected_candidate_id?: string | null;
    candidates: DialogueCandidateRecord[];
  };
};

export type RuntimeDialogueChoiceResponse = {
  session_id: string;
  outcome: DialogueOutcomeRecord;
  snapshot_anchor_id: string;
  memory_writes: Array<[string, string]>;
};

export type NarrativeHistoryTurnRecord = {
  turn_id: string;
  session_id: string;
  npc_entity_id: string;
  player_entity_id: string;
  player_utterance?: string | null;
  utterance: string;
  tone: string;
  intent: string;
  generation_mode: string;
  candidate_count: number;
  snapshot_anchor_id?: string | null;
};

export type SnapshotAnchorRecord = {
  snapshot_anchor_id: string;
  session_id: string;
  turn_id: string;
  snapshot_json: string;
};

export type RuntimeDialogueRequest = {
  session_id?: string | null;
  player_utterance?: string | null;
  snapshot: Record<string, unknown>;
  agent_mind: Record<string, unknown>;
  persona: Record<string, unknown>;
  fate_state?: Record<string, unknown> | null;
  tasks: Record<string, unknown>[];
  world_bible?: Record<string, unknown> | null;
};

export type NarrativeDemoFixture = {
  id: string;
  label: string;
  request: RuntimeDialogueRequest;
};

type InvokeFn = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

const loadInvoke = async (): Promise<InvokeFn> => {
  try {
    const module = await import("@tauri-apps/api/core");
    return module.invoke as InvokeFn;
  } catch (error) {
    throw new Error(`Narrative backend is only available in Tauri: ${String(error)}`);
  }
};

const invokeNarrative = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
  const invoke = await loadInvoke();
  return invoke<T>(command, args);
};

export const runtimeAiHealthCheck = async (): Promise<RuntimeAiHealthResponse> => invokeNarrative("runtime_ai_health_check");

export const runtimeAiListModels = async (): Promise<string[]> => invokeNarrative("runtime_ai_list_models");

export const runtimeAvatarTemplates = async (): Promise<AvatarTemplateRecord[]> => invokeNarrative("runtime_avatar_templates");

export const runtimeAvatarCreateOrUpdate = async (request: {
  avatar_id?: string | null;
  player_entity_id: string;
  template_id: string;
  capture_mode: string;
  fit_status: string;
}): Promise<PlayerAvatarRecord> => invokeNarrative("runtime_avatar_create_or_update", { request });

export const runtimeAvatarListProfiles = async (): Promise<PlayerAvatarRecord[]> => invokeNarrative("runtime_avatar_list_profiles");

export const runtimeAvatarSwitchPresentation = async (
  avatar_id: string,
  presentation_mode: string,
): Promise<PlayerAvatarRecord> => invokeNarrative("runtime_avatar_switch_presentation", { request: { avatar_id, presentation_mode } });

export const runtimeDialogueBegin = async (request: RuntimeDialogueRequest): Promise<RuntimeDialogueBeginResponse> =>
  invokeNarrative("runtime_dialogue_begin", { request });

export const runtimeDialogueSubmitChoice = async (
  session_id: string,
  turn_id: string,
  option_id: string,
): Promise<RuntimeDialogueChoiceResponse> => invokeNarrative("runtime_dialogue_submit_choice", { request: { session_id, turn_id, option_id } });

export const runtimeDialogueHistory = async (session_id: string): Promise<NarrativeHistoryTurnRecord[]> =>
  invokeNarrative("runtime_dialogue_history", { sessionId: session_id, session_id });

export const runtimeConversationSessions = async (): Promise<ConversationSessionRecord[]> =>
  invokeNarrative("runtime_conversation_sessions");

export const runtimeAuditTail = async (max_lines: number): Promise<string[]> =>
  invokeNarrative("runtime_audit_tail", { maxLines: max_lines, max_lines });

export const runtimeSnapshotExport = async (snapshot_anchor_id: string): Promise<string> =>
  invokeNarrative("runtime_snapshot_export", { snapshotAnchorId: snapshot_anchor_id, snapshot_anchor_id });

export const runtimeSnapshotImport = async (
  snapshot_anchor_id: string,
  snapshot_json: string,
): Promise<SnapshotAnchorRecord> =>
  invokeNarrative("runtime_snapshot_import", {
    snapshotAnchorId: snapshot_anchor_id,
    snapshot_anchor_id,
    snapshotJson: snapshot_json,
    snapshot_json,
  });

export const createFixtureDialogueRequest = (): RuntimeDialogueRequest => ({
  session_id: null,
  player_utterance: "Tell me what really happened at the checkpoint.",
  snapshot: {
    seed: 4242,
    tick: 0,
    feature_flags: {
      npc_ai_enabled: true,
      runtime_ai_mode: "Enabled",
    },
    entities: [
      {
        id: ["player-1"],
        kind: "Player",
        actor_class: "Humanoid",
        position_meters: [0, 0, 0],
        state_tags: ["grounded"],
      },
      {
        id: ["npc-guard"],
        kind: "Npc",
        actor_class: "Humanoid",
        position_meters: [1, 0, 0],
        state_tags: ["idle"],
      },
    ],
    world_bible: null,
    fate_records: [],
    active_tasks: [],
    agent_minds: [],
    dialogue_turns: [],
  },
  agent_mind: {
    entity_id: "npc-guard",
    persona_profile_id: "npc-guard",
    world_knowledge_refs: [],
    beliefs: [],
    goals: ["maintain_cover"],
    social_relations: [],
    short_term_memory: [],
    long_term_memory: [],
    conversation_state: "opening",
    secret_flags: ["hidden_secret"],
  },
  persona: {
    id: "npc-guard",
    display_name: "Gate Warden",
    role: "guard",
    faction: "watch",
    background_summary: "Keeps the checkpoint sealed until dawn.",
    personality_tags: ["guarded", "dutiful"],
    taboo_topics: ["hidden_secret"],
    public_facts: ["The checkpoint is unstable."],
    secret_facts: ["The alarm was staged."],
    relations: [],
    initial_goals: ["maintain_cover"],
  },
  fate_state: {
    entity_id: "npc-guard",
    timeline_id: "timeline.guard",
    fate_tags: ["guard"],
    world_phase: "suspicion",
    causal_flags: ["alarm"],
    branch_state: "intro",
    branch_history: ["intro"],
    active_arc_ids: ["arc.guard"],
  },
  tasks: [
    {
      id: "task-checkpoint",
      seed: {
        template_id: "checkpoint.truth",
        world_phase: "suspicion",
        cause: "alarm",
      },
      title: "Investigate the checkpoint",
      state: "active",
    },
  ],
  world_bible: {
    scene_id: "checkpoint_room",
    world_rules: ["Nobody leaves after curfew."],
    central_conflict: "trust_vs_survival",
    phase_summary: "intro",
    public_lore: ["The watch no longer trusts outsiders."],
  },
});

const cloneFixture = (request: RuntimeDialogueRequest): RuntimeDialogueRequest =>
  JSON.parse(JSON.stringify(request)) as RuntimeDialogueRequest;

export const createNarrativeDemoFixtures = (): NarrativeDemoFixture[] => {
  const guard = createFixtureDialogueRequest();
  const medic = cloneFixture(guard);
  medic.agent_mind = {
    ...medic.agent_mind,
    entity_id: "npc-medic",
    persona_profile_id: "npc-medic",
    goals: ["stabilize_refugees"],
    conversation_state: "triage",
  };
  medic.persona = {
    id: "npc-medic",
    display_name: "Field Medic",
    role: "medic",
    faction: "refuge",
    background_summary: "Treats the wounded and knows who disappeared during the lockdown.",
    personality_tags: ["empathetic", "cautious"],
    taboo_topics: ["supply_cache_location"],
    public_facts: ["Several evacuees vanished after curfew."],
    secret_facts: ["The missing ledger names the people removed from the line."],
    relations: [],
    initial_goals: ["stabilize_refugees"],
  };
  medic.fate_state = {
    entity_id: "npc-medic",
    timeline_id: "timeline.medic",
    fate_tags: ["medic"],
    world_phase: "revelation",
    causal_flags: ["missing_refugees"],
    branch_state: "revelation",
    branch_history: ["intro", "revelation"],
    active_arc_ids: ["arc.medic"],
  };
  medic.player_utterance = "Who disappeared after curfew, and why are you hiding it?";

  const rival = cloneFixture(guard);
  rival.agent_mind = {
    ...rival.agent_mind,
    entity_id: "npc-inspector",
    persona_profile_id: "npc-inspector",
    goals: ["contain_story"],
    conversation_state: "interrogation",
  };
  rival.persona = {
    id: "npc-inspector",
    display_name: "Internal Inspector",
    role: "inspector",
    faction: "inner_watch",
    background_summary: "Handles the official version of events and punishes loose testimony.",
    personality_tags: ["controlled", "threatening"],
    taboo_topics: ["inner_watch_orders"],
    public_facts: ["The checkpoint panic must stay contained."],
    secret_facts: ["The alarm was staged to justify a purge."],
    relations: [],
    initial_goals: ["contain_story"],
  };
  rival.fate_state = {
    entity_id: "npc-inspector",
    timeline_id: "timeline.inspector",
    fate_tags: ["inspector"],
    world_phase: "choice",
    causal_flags: ["purge_order"],
    branch_state: "choice",
    branch_history: ["intro", "suspicion", "choice"],
    active_arc_ids: ["arc.inspector"],
  };
  rival.player_utterance = "If the alarm was staged, why should anyone trust your version?";

  return [
    { id: "guard", label: "Gate Warden", request: guard },
    { id: "medic", label: "Field Medic", request: medic },
    { id: "inspector", label: "Internal Inspector", request: rival },
  ];
};
