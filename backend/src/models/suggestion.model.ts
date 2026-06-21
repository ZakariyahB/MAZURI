/** A public, upvotable member suggestion. */
export interface Suggestion {
  id: string;
  orgId: string;
  authorId: string;
  title: string;
  body: string;
  upvotes: number;
  flagged: boolean;
  createdAt: string;
}

// Data-layer stub — real pg queries wired later.
export const suggestionModel = {
  async listByOrg(_orgId: string): Promise<Suggestion[]> {
    return [];
  },
};
