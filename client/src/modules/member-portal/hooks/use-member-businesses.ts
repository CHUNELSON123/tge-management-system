import { useMemberRequest } from "./use-member-request";
import { getMemberBusinesses } from "../services/member-businesses.service";
export function useMemberBusinesses() { return useMemberRequest(getMemberBusinesses); }
