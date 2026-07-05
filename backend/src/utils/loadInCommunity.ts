import { notFound } from './errors';

/** Any record scoped to a community (carries the owning community's id). */
interface CommunityScoped {
  community_id: string;
}

/** A model that can look a record up by its id. */
interface FindableModel<T extends CommunityScoped> {
  findById(id: string): Promise<T | null>;
}

/**
 * Loads an entity by id and asserts it belongs to the route's community,
 * throwing 404 otherwise. `label` names the entity in the error message
 * (e.g. 'Suggestion' → "Suggestion not found").
 */
export async function loadInCommunity<T extends CommunityScoped>(
  model: FindableModel<T>,
  id: string,
  communityId: string,
  label: string,
): Promise<T> {
  const entity = await model.findById(id);
  if (!entity || entity.community_id !== communityId) {
    throw notFound(`${label} not found`);
  }
  return entity;
}
