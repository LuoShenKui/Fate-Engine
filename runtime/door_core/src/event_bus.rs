use crate::WorldEvent;

#[derive(Debug, Default, Clone)]
pub struct EventBus {
    queue: Vec<WorldEvent>,
}

impl EventBus {
    pub fn publish(&mut self, event: WorldEvent) {
        self.queue.push(event);
    }

    pub fn drain(&mut self) -> Vec<WorldEvent> {
        self.queue.drain(..).collect()
    }
}
