/** An admin-created event proposal that members vote yes/no on. */
export interface EventProposal {
  id: string;
  orgId: string;
  createdBy: string;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  createdAt: string;
}

// Data-layer stub — real pg queries wired later.
export const eventModel = {
  async listByOrg(_orgId: string): Promise<EventProposal[]> {
    return [];
  },
};
