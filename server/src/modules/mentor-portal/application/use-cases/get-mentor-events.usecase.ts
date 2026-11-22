import type { MentorEventsRepository } from "../../domain/repositories/mentor-events.repository.js";
export class GetMentorEventsUseCase { constructor(private readonly repository: MentorEventsRepository) {} execute(userId: string) { return this.repository.list(userId); } }
