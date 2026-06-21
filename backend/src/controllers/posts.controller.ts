import type { Request, Response } from 'express';
import { postModel } from '../models/post.model';
import { str } from '../utils/validation';

export const postsController = {
  /** Admin posts a post to the community feed. */
  async create(req: Request, res: Response): Promise<void> {
    const body = str(req.body?.body, 'body');
    const post = await postModel.create(req.params.communityId, req.user!.userId, body);
    res.status(201).json({ post });
  },

  async list(req: Request, res: Response): Promise<void> {
    res.json({ posts: await postModel.listByCommunity(req.params.communityId) });
  },
};
