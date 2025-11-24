import { ContactRepository } from '@/modules/contact/contact.repository';
import { UserRepository } from '@/modules/user/user.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/shared/exceptions/api-error';

export class ContactService {
  constructor(
    private contactRepository: ContactRepository,
    private userRepository: UserRepository
  ) {}

  public async listContacts(ownerId: number) {
    const owner = await this.userRepository.findById(ownerId);
    if (!owner) {
      throw new UnauthorizedError('User not found');
    }

    const contacts = await this.contactRepository.listByOwnerId(ownerId);

    return contacts.map((contact) => ({
      username: contact.username,
      publicKey: contact.publicKey,
      addedAt: contact.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  public async addContact(ownerId: number, username: string) {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      throw new BadRequestError('Username is required');
    }

    const owner = await this.userRepository.findById(ownerId);
    if (!owner) {
      throw new UnauthorizedError('User not found');
    }

    if (owner.username === normalizedUsername) {
      throw new BadRequestError('You cannot add yourself as a contact');
    }

    const contactUser =
      await this.userRepository.findByUsername(normalizedUsername);
    if (!contactUser) {
      throw new NotFoundError('Contact user not found');
    }

    const existingContact = await this.contactRepository.findByOwnerAndContact(
      ownerId,
      contactUser.id
    );
    if (existingContact) {
      throw new ConflictError('Contact already exists');
    }

    const created = await this.contactRepository.create(
      ownerId,
      contactUser.id
    );

    return {
      username: contactUser.username,
      publicKey: contactUser.publicKey,
      addedAt: created.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  public async removeContact(ownerId: number, username: string) {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      throw new BadRequestError('Username is required');
    }

    const contactUser =
      await this.userRepository.findByUsername(normalizedUsername);
    if (!contactUser) {
      throw new NotFoundError('Contact not found');
    }

    const deleted = await this.contactRepository.delete(
      ownerId,
      contactUser.id
    );

    if (!deleted.length) {
      throw new NotFoundError('Contact not found');
    }
  }
}
