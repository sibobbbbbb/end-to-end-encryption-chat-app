import { Context } from "hono";
import { sendSuccess } from "@/shared/utils/api-response";
import { UserService } from "@/modules/user/user.service";

/**
 * @class UserController
 * Handles the HTTP layer for user-related operations. It receives requests,
 * calls the appropriate service methods with request data, and formats the
 * HTTP response (success or error).
 */
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Fetches the profile of a user by username.
   */
  public getUserProfile = async (c: Context) => {
    const username = c.req.param("username");
    
    const user = await this.userService.getUserByUsername(username);
    
    return sendSuccess(c, 200, "User found", {
      username: user.username,
      publicKey: user.publicKey
    });
  };
}
