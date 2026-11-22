import { useMemberRequest } from "./use-member-request";
import { getMemberMentorship } from "../services/member-mentorship.service";
export function useMemberMentorship() { return useMemberRequest(getMemberMentorship); }
