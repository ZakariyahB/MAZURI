/** An admin announcement that closes the loop on a suggestion or report. */
export interface Announcement {
  id: string;
  orgId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
}

// Data-layer stub — real pg queries wired later.
export const announcementModel = {
  async listByOrg(_orgId: string): Promise<Announcement[]> {
    return [];
  },
};
