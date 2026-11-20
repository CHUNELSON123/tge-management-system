export interface GuestRegistration { eventId: string; name: string; email: string; phone: string }
export interface EventRegistrationRepository {
  registerGuest(input: GuestRegistration): Promise<{ eventId: string; eventTitle: string }>;
  registerMember(eventId: string, userId: string): Promise<{ eventId: string; eventTitle: string }>;
  cancelMember(eventId: string, userId: string): Promise<void>;
}
