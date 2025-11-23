import { Context } from "hono";
import { MessageService } from "./message.service";
import { SendMessageRequest } from "./message.schemas";
import { sendSuccess } from "@/shared/utils/api-response";
import { BadRequestError } from "@/shared/exceptions/api-error";

export class MessageController {
  constructor(private messageService: MessageService) {}

  public sendMessage = async (c: Context) => {
    const userId = c.get("jwtPayload").sub;
    const validatedData = c.get("validatedData") as SendMessageRequest;

    const message = await this.messageService.sendMessage(userId, validatedData);

    return sendSuccess(c, 201, "Message sent successfully", { id: message.id });
  };

  public getMessages = async (c: Context) => {
    const userId = c.get("jwtPayload").sub;
    const partner = c.req.query("partner");
    const since = c.req.query("since");

    if (!partner) throw new BadRequestError("Query param 'partner' is required");

    const messages = await this.messageService.getMessages(userId, partner, since);
    
    return sendSuccess(c, 200, "Messages retrieved", messages);
  };
}