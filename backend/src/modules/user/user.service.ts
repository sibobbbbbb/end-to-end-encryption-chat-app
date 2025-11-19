import { UserRepository } from "@/shared/repositories/user.repository";
import { NotFoundError } from "@/shared/exceptions/api-error";
import { User } from "@/shared/models/user.model";

/**
 * @class UserService
 * Contains the core business logic for user-related operations.
 * This service interacts with the UserRepository to perform actions
 * like fetching user profiles, ensuring that business rules are applied
 * and exceptions are handled appropriately.
 */
export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Retrieves the profile of the currently authenticated user.
   * @param id The unique identifier of the user.
   * @returns A User object containing the user's profile information.
   * @throws NotFoundError if the user does not exist.
   */
  public async getMyProfile(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}
