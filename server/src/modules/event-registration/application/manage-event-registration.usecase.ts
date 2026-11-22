import type { EventRegistrationRepository, GuestRegistration } from "../domain/event-registration.repository.js";
export class ManageEventRegistrationUseCase {
  constructor(private readonly repository: EventRegistrationRepository) {}
  registerGuest(input: GuestRegistration) { return this.repository.registerGuest(input); }
  registerMember(eventId: string, userId: string) { return this.repository.registerMember(eventId, userId); }
  cancelMember(eventId: string, userId: string) { return this.repository.cancelMember(eventId, userId); }
}
