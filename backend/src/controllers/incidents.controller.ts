import type { Request, Response } from 'express';
import { incidentModel } from '../models/incident.model';
import { SEVERITIES } from '../config/constants';
import { str, oneOf } from '../utils/validation';
import { conflict, notFound } from '../utils/errors';

export const incidentsController = {
  /** Members report incidents with a severity (RED/AMBER/GREEN). */
  async create(req: Request, res: Response): Promise<void> {
    const body = str(req.body?.body, 'body');
    const severity = oneOf(req.body?.severity, 'severity', SEVERITIES);
    const incident = await incidentModel.create(
      req.params.communityId,
      req.user!.userId,
      body,
      severity,
    );
    res.status(201).json({ incident });
  },

  /** Admin queue of reported incidents (open first, by severity). */
  async list(req: Request, res: Response): Promise<void> {
    res.json({ incidents: await incidentModel.listByCommunity(req.params.communityId) });
  },

  /** Admin marks an incident resolved. */
  async resolve(req: Request, res: Response): Promise<void> {
    const { communityId, incidentId } = req.params;
    const incident = await incidentModel.findById(incidentId);
    if (!incident || incident.community_id !== communityId) throw notFound('Incident not found');
    if (incident.status === 'resolved') throw conflict('Incident is already resolved');

    res.json({ incident: await incidentModel.resolve(incidentId) });
  },
};
