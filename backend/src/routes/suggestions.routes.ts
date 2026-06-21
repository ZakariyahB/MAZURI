import { Router } from 'express';
import { suggestionsController } from '../controllers/suggestions.controller';

// Suggestion routes (stubs). Mounted at /api/suggestions.
const router = Router();

router.get('/', suggestionsController.list);
router.post('/', suggestionsController.create);
router.post('/:suggestionId/upvote', suggestionsController.upvote);

export default router;
