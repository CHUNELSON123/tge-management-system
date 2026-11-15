import { useMemberRequest } from "./use-member-request";
import { getMemberResources } from "../services/member-resources.service";
export function useMemberResources() { return useMemberRequest(getMemberResources); }
