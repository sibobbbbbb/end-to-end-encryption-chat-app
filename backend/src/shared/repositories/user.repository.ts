import { db } from "@/shared/configs/database";
import { usersTable } from "@/shared/configs/database/schema";
import { NewUser, User } from "@/shared/models/user.model";
import { eq } from "drizzle-orm";

/**
 * @class UserRepository
 *
 * This class implements the Repository Pattern for the User entity.
 * It abstracts all database interactions related to users, providing a clean
 * API for services to use without needing to know the underlying ORM (Drizzle)
 * or database schema details.
 */
export class UserRepository {
  /**
   * Creates a new user in the database.
   * @param data Data for new user.
   * @returns The newly created User object.
   */
  public async create(data: NewUser): Promise<User> {
    const [newUser] = await db.insert(usersTable).values(data).returning();

    return newUser;
  }

  /**
   * Finds a single user by username.
   * @param username User's username.
   * @returns User object if found, or undefined.
   */
  public async findByUsername(username: string): Promise<User | undefined> {
    return await db.query.usersTable.findFirst({
      where: eq(usersTable.username, username),
    });
  }

  /**
   * Finds a user by their unique ID.
   * @param id User's unique identifier.
   * @returns User object if found, or undefined.
   */
  public async findById(id: number): Promise<User | undefined> {
    return await db.query.usersTable.findFirst({
      where: eq(usersTable.id, id),
    });
  }
}
