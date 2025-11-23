import { ec as EC } from 'elliptic';
import { UserRepository } from '@/modules/user/user.repository';
import { MessageRepository } from './message.repository';
import { SendMessageRequest } from './message.schemas';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/shared/exceptions/api-error';

const ec = new EC('secp256k1');

export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private userRepository: UserRepository
  ) {}

  public async sendMessage(senderId: number, payload: SendMessageRequest) {
    // Check sender & receiver
    const sender = await this.userRepository.findById(senderId);
    if (!sender || sender.username !== payload.sender_username) {
      throw new UnauthorizedError("Sender identity mismatch");
    }

    const receiver = await this.userRepository.findByUsername(payload.receiver_username);
    if (!receiver) {
      throw new NotFoundError(`Receiver '${payload.receiver_username}' not found`);
    }

    // Verify Digital Signature
    try {
      const key = ec.keyFromPublic(sender.publicKey, 'hex');
      const isValid = key.verify(payload.message_hash, payload.signature);

      if (!isValid) {
        throw new BadRequestError("Invalid Digital Signature! Integrity check failed.");
      }
    } catch (error) {
      throw new BadRequestError("Cryptographic verification error");
    }

    // Save message
    return await this.messageRepository.create({
      senderId: sender.id,
      receiverId: receiver.id,
      encryptedMessage: payload.encrypted_message,
      messageHash: payload.message_hash,
      signatureR: payload.signature.r,
      signatureS: payload.signature.s,
      messageTimestamp: new Date(payload.timestamp),
    });
  }

  public async getMessages(userId: number, partnerUsername: string, since?: string) {
    const partner = await this.userRepository.findByUsername(partnerUsername);
    if (!partner) throw new NotFoundError("Partner not found");
    
    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) throw new UnauthorizedError("User not found");

    const sinceDate = since ? new Date(since) : undefined;
    const messages = await this.messageRepository.getConversation(userId, partner.id, sinceDate);

    return messages.map(msg => ({
      id: msg.id,
      sender_username: msg.senderId === userId ? currentUser.username : partnerUsername,
      receiver_username: msg.receiverId === userId ? currentUser.username : partnerUsername,
      encrypted_message: msg.encryptedMessage,
      message_hash: msg.messageHash,
      signature: { r: msg.signatureR, s: msg.signatureS },
      timestamp: msg.messageTimestamp.toISOString()
    }));
  }
}