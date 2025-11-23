import { Hono } from "hono";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { validate } from "@/shared/middlewares/validation.middleware";
import { SendMessageRequestSchema } from "./message.schemas";
import { messageController } from "@/container";

const messageRouter = new Hono();

messageRouter.use("*", authMiddleware);

// Send Message
messageRouter.post("/", validate(SendMessageRequestSchema), messageController.sendMessage);

// Get Messages
messageRouter.get("/", messageController.getMessages);
messageRouter.get("/poll", messageController.getMessages);

export default messageRouter;