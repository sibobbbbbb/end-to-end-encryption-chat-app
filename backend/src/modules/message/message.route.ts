import { Hono } from "hono";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { sendSuccess } from "@/shared/utils/api-response";

/**
 * @file Message router.
 *
 * This router handles the `/api/messages` endpoint used to post
 * encrypted chat messages from clients.  Messages are accepted and
 * optionally stored or forwarded.  For the purposes of this example
 * implementation, messages are simply acknowledged.
 */
const messageRouter = new Hono();

// Protect message endpoint using auth middleware so only authenticated
// users can send messages.
messageRouter.post("/", authMiddleware, async (c) => {
  const data = await c.req.json();
  // In a full implementation you would persist the encrypted message,
  // look up the recipient's connection and forward it via WebSocket or
  // other push mechanism.  Here we simply return a success response.
  return sendSuccess(c, 201, "Message received", data);
});

export default messageRouter;