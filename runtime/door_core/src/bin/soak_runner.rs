use door_core::{events, DoorBrick, DoorState, InteractInput, SetStateInput};
use serde::Serialize;
use std::env;
use std::time::{Duration, Instant};

#[derive(Serialize)]
struct SoakSummary {
    duration: f64,
    tick_total: u64,
    error_count: u64,
}

fn parse_duration_seconds(args: &[String]) -> Result<u64, String> {
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--duration-seconds" {
            if i + 1 >= args.len() {
                return Err("missing value for --duration-seconds".to_string());
            }
            return args[i + 1]
                .parse::<u64>()
                .map_err(|_| "invalid --duration-seconds value".to_string());
        }
        i += 1;
    }
    Err("missing --duration-seconds argument".to_string())
}

fn parse_seed(args: &[String]) -> u64 {
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--seed" {
            if i + 1 < args.len() {
                if let Ok(value) = args[i + 1].parse::<u64>() {
                    return value;
                }
            }
            return 123;
        }
        i += 1;
    }
    123
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let duration_seconds = match parse_duration_seconds(&args) {
        Ok(value) => value,
        Err(err) => {
            eprintln!("{err}");
            std::process::exit(2);
        }
    };
    let seed = parse_seed(&args);

    let start = Instant::now();
    let target = Duration::from_secs(duration_seconds);
    let mut brick = DoorBrick::new("fate.door.basic", DoorState::default());

    let mut tick_total = 0_u64;
    let mut error_count = 0_u64;
    while start.elapsed() < target {
        if (tick_total + seed) % 11 == 0 {
            let event = brick.set_state(SetStateInput {
                key: "locked".to_string(),
                value: (tick_total + seed) % 22 == 0,
            });
            if event.event != events::ON_STATE_CHANGED {
                error_count += 1;
            }
        }

        let interact = brick.interact(InteractInput {
            actor_id: format!("soak_actor_{}", (tick_total + seed) % 16),
        });
        if interact.event != events::ON_USED && interact.event != events::ON_DENIED {
            error_count += 1;
        }

        let tick = brick.on_tick_low_freq();
        if tick.event != events::ON_TICK_LOW_FREQ {
            error_count += 1;
        }

        tick_total += 1;
    }

    let summary = SoakSummary {
        duration: start.elapsed().as_secs_f64(),
        tick_total,
        error_count,
    };

    println!(
        "{}",
        serde_json::to_string(&summary).expect("serialize soak summary")
    );

    if error_count > 0 {
        std::process::exit(1);
    }
}
