/**
 * Org (tenant) data model + access stub.
 * The root of multi-tenancy: every other record references `orgId`.
 */
export interface Org {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

// Data-layer stub — real pg queries wired later (see config/db.ts).
export const orgModel = {
  async findById(_id: string): Promise<Org | null> {
    return null;
  },
};
