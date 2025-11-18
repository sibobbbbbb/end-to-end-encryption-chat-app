import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Users Table
export const usersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    publicKey: text('public_key').notNull(),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('users_username_unique_idx').on(table.username)]
);

// Contacts Table
export const contactsTable = pgTable(
  'contacts',
  {
    id: serial('id').primaryKey(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    contactUserId: integer('contact_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('contacts_owner_contact_unique_idx').on(
      table.ownerId,
      table.contactUserId
    ),
    index('contacts_owner_idx').on(table.ownerId),
  ]
);

// Messages table
export const messagesTable = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),

    senderId: integer('sender_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    receiverId: integer('receiver_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    encryptedMessage: text('encrypted_message').notNull(),

    messageHash: text('message_hash').notNull(),

    signatureR: text('signature_r').notNull(),
    signatureS: text('signature_s').notNull(),

    messageTimestamp: timestamp('message_timestamp', {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('messages_sender_receiver_idx').on(
      table.senderId,
      table.receiverId,
      table.messageTimestamp
    ),
    index('messages_receiver_idx').on(table.receiverId, table.messageTimestamp),
  ]
);
