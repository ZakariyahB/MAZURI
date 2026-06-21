/** A member or admin, scoped to a single org. */
export interface User {
  id: string;
  orgId: string;
  email: string;
  role: 'member' | 'admin';
  createdAt: string;
}

// Data-layer stub — real pg queries wired later.
export const userModel = {
  async findById(_id: string): Promise<User | null> {
    return null;
  },
};
