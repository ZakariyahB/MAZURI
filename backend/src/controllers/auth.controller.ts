import type { Request, Response } from 'express';
import { userModel, toPublicUser } from '../models/user.model';
import { hashSecret, verifySecret, signToken } from '../services/auth.service';
import { str } from '../utils/validation';
import { badRequest, conflict, notFound, unauthorized } from '../utils/errors';

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const email = str(req.body?.email, 'email').toLowerCase();
    const password = str(req.body?.password, 'password');
    if (password.length < 6) throw badRequest('password must be at least 6 characters');

    if (await userModel.findByEmail(email)) throw conflict('Email already registered');

    const user = await userModel.create(email, await hashSecret(password));
    res.status(201).json({ token: signToken({ userId: user.id }), user: toPublicUser(user) });
  },

  async login(req: Request, res: Response): Promise<void> {
    const email = str(req.body?.email, 'email').toLowerCase();
    const password = str(req.body?.password, 'password');

    const user = await userModel.findByEmail(email);
    if (!user || !(await verifySecret(password, user.password_hash))) {
      throw unauthorized('Invalid credentials');
    }

    res.json({ token: signToken({ userId: user.id }), user: toPublicUser(user) });
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await userModel.findById(req.user!.userId);
    if (!user) throw notFound('User not found');
    res.json({ user: toPublicUser(user) });
  },
};
