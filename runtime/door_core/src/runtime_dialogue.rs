use serde::{Deserialize, Serialize};

use crate::{AgentMindState, FateStateRecord, TaskInstance, WorldSnapshot};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NpcRelationRecord {
    pub target_entity_id: String,
    pub stance: String,
    pub trust_delta: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NpcPersonaProfile {
    pub id: String,
    pub display_name: String,
    pub role: String,
    pub faction: String,
    pub background_summary: String,
    pub personality_tags: Vec<String>,
    pub taboo_topics: Vec<String>,
    pub public_facts: Vec<String>,
    pub secret_facts: Vec<String>,
    pub relations: Vec<NpcRelationRecord>,
    pub initial_goals: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorldBibleRecord {
    pub scene_id: String,
    pub world_rules: Vec<String>,
    pub central_conflict: String,
    pub phase_summary: String,
    pub public_lore: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DialogueContext {
    pub npc_entity_id: String,
    pub player_entity_id: String,
    pub timeline_id: String,
    pub world_phase: String,
    pub central_conflict: String,
    pub known_facts: Vec<String>,
    pub taboo_topics: Vec<String>,
    pub current_goal: String,
    pub active_task_ids: Vec<String>,
    pub ai_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PromptEnvelope {
    pub system_rules: Vec<String>,
    pub persona_summary: String,
    pub world_summary: String,
    pub player_utterance: Option<String>,
    pub forbidden_topics: Vec<String>,
    pub allowed_topics: Vec<String>,
    pub response_contract: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DialogueOption {
    pub id: String,
    pub label: String,
    pub intent: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DialogueOutcome {
    pub utterance: String,
    pub tone: String,
    pub intent: String,
    pub revealed_flags: Vec<String>,
    pub relationship_delta: i32,
    pub fate_effects: Vec<String>,
    pub task_mutations: Vec<String>,
    pub world_reactions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DialogueTurn {
    pub turn_id: String,
    pub npc_entity_id: String,
    pub player_entity_id: String,
    pub context: DialogueContext,
    pub options: Vec<DialogueOption>,
    pub outcome: DialogueOutcome,
    pub used_local_llm: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DialogueGenerationRecord {
    pub generation_mode: String,
    pub selected_candidate_id: Option<String>,
    pub prompt_envelope: PromptEnvelope,
}

pub fn build_dialogue_context(
    snapshot: &WorldSnapshot,
    mind: &AgentMindState,
    persona: &NpcPersonaProfile,
    fate: Option<&FateStateRecord>,
    tasks: &[TaskInstance],
    world_bible: Option<&WorldBibleRecord>,
    ai_enabled: bool,
) -> DialogueContext {
    let active_task_ids = tasks
        .iter()
        .filter(|task| task.state == "active")
        .map(|task| task.id.clone())
        .collect();
    let timeline_id = fate
        .map(|record| record.timeline_id.clone())
        .unwrap_or_else(|| "fate.timeline.default".to_string());
    let world_phase = fate
        .map(|record| record.world_phase.clone())
        .unwrap_or_else(|| "intro".to_string());
    let current_goal = mind
        .goals
        .first()
        .cloned()
        .or_else(|| persona.initial_goals.first().cloned())
        .unwrap_or_else(|| "maintain_cover".to_string());
    let known_facts = persona
        .public_facts
        .iter()
        .chain(mind.short_term_memory.iter().map(|record| &record.value))
        .take(6)
        .cloned()
        .collect();

    DialogueContext {
        npc_entity_id: mind.entity_id.clone(),
        player_entity_id: snapshot
            .entities
            .iter()
            .find(|entity| entity.kind == crate::WorldEntityKind::Player)
            .map(|entity| entity.id.0.clone())
            .unwrap_or_else(|| "player-1".to_string()),
        timeline_id,
        world_phase: world_phase.clone(),
        central_conflict: world_bible
            .map(|record| record.central_conflict.clone())
            .unwrap_or_else(|| "trust_vs_survival".to_string()),
        known_facts,
        taboo_topics: persona.taboo_topics.clone(),
        current_goal,
        active_task_ids,
        ai_mode: if ai_enabled {
            "local_llm".to_string()
        } else {
            "rules_only".to_string()
        },
    }
}

pub fn build_prompt_envelope(
    context: &DialogueContext,
    persona: &NpcPersonaProfile,
    player_utterance: Option<&str>,
) -> PromptEnvelope {
    let allowed_topics = context
        .known_facts
        .iter()
        .take(4)
        .cloned()
        .chain(context.active_task_ids.iter().map(|task_id| format!("task:{task_id}")))
        .collect();
    PromptEnvelope {
        system_rules: vec![
            "Stay within the current world phase and central conflict.".to_string(),
            "Do not leak taboo or secret information unless the current branch explicitly allows it.".to_string(),
            "Only produce language and structured dialogue effects; do not mutate world state directly.".to_string(),
        ],
        persona_summary: format!(
            "{} / {} / {} / {:?}",
            persona.display_name, persona.role, persona.faction, persona.personality_tags
        ),
        world_summary: format!(
            "timeline={} phase={} conflict={} goal={}",
            context.timeline_id, context.world_phase, context.central_conflict, context.current_goal
        ),
        player_utterance: player_utterance.map(ToString::to_string),
        forbidden_topics: context.taboo_topics.clone(),
        allowed_topics,
        response_contract: vec![
            "Return one guarded NPC reply.".to_string(),
            "Keep the reply grounded in the current scene.".to_string(),
            "If uncertain, refuse or deflect instead of inventing revelations.".to_string(),
        ],
    }
}

pub fn begin_dialogue_turn(
    snapshot: &WorldSnapshot,
    mind: &AgentMindState,
    persona: &NpcPersonaProfile,
    fate: Option<&FateStateRecord>,
    tasks: &[TaskInstance],
    world_bible: Option<&WorldBibleRecord>,
    ai_enabled: bool,
) -> DialogueTurn {
    let context = build_dialogue_context(snapshot, mind, persona, fate, tasks, world_bible, ai_enabled);
    let suspicious = context.world_phase == "suspicion";
    let tone = if suspicious { "guarded" } else { "measured" };
    let utterance = if ai_enabled {
        format!(
            "{} lowers their voice: The {} is tightening, and I need to know whether you can be trusted.",
            persona.display_name, context.central_conflict
        )
    } else {
        format!("{} says: I need to know whether you can be trusted.", persona.display_name)
    };
    let options = vec![
        DialogueOption {
            id: "ask_truth".to_string(),
            label: "Ask for the truth".to_string(),
            intent: "probe_truth".to_string(),
        },
        DialogueOption {
            id: "offer_help".to_string(),
            label: "Offer to help".to_string(),
            intent: "align_with_npc".to_string(),
        },
        DialogueOption {
            id: "push_secret".to_string(),
            label: "Press on the hidden secret".to_string(),
            intent: "pressure_secret".to_string(),
        },
    ];

    DialogueTurn {
        turn_id: format!("dialogue-{}-{}", snapshot.tick, persona.id),
        npc_entity_id: mind.entity_id.clone(),
        player_entity_id: context.player_entity_id.clone(),
        context,
        options,
        outcome: DialogueOutcome {
            utterance,
            tone: tone.to_string(),
            intent: "opening_statement".to_string(),
            revealed_flags: Vec::new(),
            relationship_delta: 0,
            fate_effects: Vec::new(),
            task_mutations: Vec::new(),
            world_reactions: Vec::new(),
        },
        used_local_llm: ai_enabled,
    }
}

pub fn resolve_dialogue_choice(
    turn: &DialogueTurn,
    persona: &NpcPersonaProfile,
    option_id: &str,
    ai_enabled: bool,
) -> Result<DialogueOutcome, String> {
    let option = turn
        .options
        .iter()
        .find(|candidate| candidate.id == option_id)
        .ok_or_else(|| format!("dialogue option not found: {option_id}"))?;

    let outcome = match option.intent.as_str() {
        "probe_truth" => DialogueOutcome {
            utterance: if ai_enabled {
                format!(
                    "{} answers carefully: If I speak plainly, the whole cover breaks. Watch the checkpoint tonight.",
                    persona.display_name
                )
            } else {
                format!("{} answers: Watch the checkpoint tonight.", persona.display_name)
            },
            tone: "revealing".to_string(),
            intent: "share_clue".to_string(),
            revealed_flags: vec!["clue.checkpoint_watch".to_string()],
            relationship_delta: 1,
            fate_effects: vec!["fate.branch.revelation".to_string()],
            task_mutations: vec!["task.advance.investigate_checkpoint".to_string()],
            world_reactions: vec!["world.reaction.npc_trust_up".to_string()],
        },
        "align_with_npc" => DialogueOutcome {
            utterance: format!(
                "{} nods: Then help me keep the panic down before sunrise.",
                persona.display_name
            ),
            tone: "cooperative".to_string(),
            intent: "accept_help".to_string(),
            revealed_flags: vec!["ally.request.accepted".to_string()],
            relationship_delta: 2,
            fate_effects: vec!["fate.branch.cooperation".to_string()],
            task_mutations: vec!["task.activate.keep_panic_down".to_string()],
            world_reactions: vec!["world.reaction.tension_stabilized".to_string()],
        },
        "pressure_secret" => DialogueOutcome {
            utterance: format!(
                "{} recoils: Push me again and you will force the wrong ending.",
                persona.display_name
            ),
            tone: "hostile".to_string(),
            intent: "reject_pressure".to_string(),
            revealed_flags: Vec::new(),
            relationship_delta: -2,
            fate_effects: vec!["fate.branch.suspicion".to_string()],
            task_mutations: vec!["task.fail.soft_trust".to_string()],
            world_reactions: vec!["world.reaction.guard_alerted".to_string()],
        },
        _ => DialogueOutcome {
            utterance: format!("{} stays silent.", persona.display_name),
            tone: "neutral".to_string(),
            intent: "wait".to_string(),
            revealed_flags: Vec::new(),
            relationship_delta: 0,
            fate_effects: Vec::new(),
            task_mutations: Vec::new(),
            world_reactions: Vec::new(),
        },
    };

    Ok(outcome)
}
