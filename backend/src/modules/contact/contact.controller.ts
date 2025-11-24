import { Context } from 'hono';
import { ContactService } from '@/modules/contact/contact.service';
import { sendSuccess } from '@/shared/utils/api-response';
import { AddContactRequest } from '@/modules/contact/contact.schemas';

export class ContactController {
  constructor(private contactService: ContactService) {}

  public listContacts = async (c: Context) => {
    const userId = c.get('jwtPayload').sub;
    const contacts = await this.contactService.listContacts(userId);

    return sendSuccess(c, 200, 'Contacts retrieved successfully', contacts);
  };

  public addContact = async (c: Context) => {
    const userId = c.get('jwtPayload').sub;
    const { username } = c.get('validatedData') as AddContactRequest;

    const contact = await this.contactService.addContact(userId, username);

    return sendSuccess(c, 201, 'Contact added successfully', contact);
  };

  public removeContact = async (c: Context) => {
    const userId = c.get('jwtPayload').sub;
    const username = c.req.param('username');

    await this.contactService.removeContact(userId, username);

    return sendSuccess(c, 200, 'Contact removed successfully', null);
  };
}
