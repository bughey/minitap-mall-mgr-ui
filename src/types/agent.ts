export interface AgentListItem {
  id: number;
  username: string;
  nickname?: string | null;
  status: number;
}

export interface AgentListResponse {
  agents: AgentListItem[];
}

export interface AgentBrief {
  id: number;
  username: string;
  nickname?: string | null;
  status: number;
}

export interface PlaceAgentResponse {
  place_id: number;
  agent_id?: number | null;
  agent?: AgentBrief | null;
}

