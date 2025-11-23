import { db } from '@/shared/configs/database';
import { messagesTable } from '@/shared/configs/database/schema';
import { eq, and, or, gt, asc } from 'drizzle-orm';

type NewMessage = typeof messagesTable.$inferInsert;

export class MessageRepository {
  
  public async create(data: NewMessage) {
    const [newMessage] = await db.insert(messagesTable).values(data).returning();
    return newMessage;
  }

  /*
   * Get conversation between two users
   */
  public async getConversation(user1Id: number, user2Id: number, since?: Date) {
    return await db.query.messagesTable.findMany({
      where: and(
        or(
          and(eq(messagesTable.senderId, user1Id), eq(messagesTable.receiverId, user2Id)),
          and(eq(messagesTable.senderId, user2Id), eq(messagesTable.receiverId, user1Id))
        ),
        since ? gt(messagesTable.messageTimestamp, since) : undefined
      ),
      orderBy: [asc(messagesTable.messageTimestamp)],
      limit: 100,
    });
  }
}