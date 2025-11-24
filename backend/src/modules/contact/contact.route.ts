import { Hono } from 'hono';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validation.middleware';
import { contactController } from '@/container';
import { AddContactRequestSchema } from '@/modules/contact/contact.schemas';

const contactRouter = new Hono();

contactRouter.use('*', authMiddleware);

contactRouter.get('/', contactController.listContacts);
contactRouter.post(
  '/',
  validate(AddContactRequestSchema),
  contactController.addContact
);
contactRouter.delete('/:username', contactController.removeContact);

export default contactRouter;
