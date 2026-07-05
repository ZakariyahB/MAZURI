import type { Request, Response } from 'express';
import { incidentModel } from '../models/incident.model';
import { communityModel } from '../models/community.model';
import { SEVERITIES } from '../config/constants';
import { clusterReports, isAiConfigured } from '../services/ai/clustering.service';
import { str, oneOf } from '../utils/validation';
import { AppError, conflict, notFound, paymentRequired } from '../utils/errors';
import { loadInCommunity } from '../utils/loadInCommunity';

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
    const incident = await loadInCommunity(incidentModel, incidentId, communityId, 'Incident');
    if (incident.status === 'resolved') throw conflict('Incident is already resolved');

    res.json({ incident: await incidentModel.resolve(incidentId) });
  },

  /** Admin AI triage: cluster open reports by issue, ranked by urgency (Insights tier). */
  async clusters(req: Request, res: Response): Promise<void> {
    const community = await communityModel.findById(req.params.communityId);
    if (!community) throw notFound('Community not found');
    if (community.tier !== 'insights') {
      throw paymentRequired('AI clustering is part of the Insights tier — upgrade to unlock it');
    }
    if (!isAiConfigured()) {
      throw new AppError(503, 'AI clustering is not configured — set AI_API_KEY in .env');
    }
    res.json({ clusters: await clusterReports(req.params.communityId) });
  },
};
