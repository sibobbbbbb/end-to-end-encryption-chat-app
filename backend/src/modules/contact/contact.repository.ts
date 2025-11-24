import { db } from '@/shared/configs/database';
import { contactsTable, usersTable } from '@/shared/configs/database/schema';
import { and, eq, asc } from 'drizzle-orm';

export class ContactRepository {
  public async listByOwnerId(ownerId: number) {
    return await db
      .select({
        id: contactsTable.id,
        ownerId: contactsTable.ownerId,
        contactUserId: contactsTable.contactUserId,
        createdAt: contactsTable.createdAt,
        username: usersTable.username,
        publicKey: usersTable.publicKey,
      })
      .from(contactsTable)
      .innerJoin(usersTable, eq(usersTable.id, contactsTable.contactUserId))
      .where(eq(contactsTable.ownerId, ownerId))
      .orderBy(asc(contactsTable.createdAt));
  }

  public async findByOwnerAndContact(ownerId: number, contactUserId: number) {
    return await db.query.contactsTable.findFirst({
      where: and(
        eq(contactsTable.ownerId, ownerId),
        eq(contactsTable.contactUserId, contactUserId)
      ),
    });
  }

  public async create(ownerId: number, contactUserId: number) {
    const [created] = await db
      .insert(contactsTable)
      .values({ ownerId, contactUserId })
      .returning();
    return created;
  }

  public async delete(ownerId: number, contactUserId: number) {
    const deleted = await db
      .delete(contactsTable)
      .where(
        and(
          eq(contactsTable.ownerId, ownerId),
          eq(contactsTable.contactUserId, contactUserId)
        )
      )
      .returning();

    return deleted;
  }
}
