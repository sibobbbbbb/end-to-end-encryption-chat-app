import { ec as EC } from 'elliptic';
import { sha3_256 } from 'js-sha3';
import {
  ConflictError,
  UnauthorizedError,
} from '@/shared/exceptions/api-error';
import { User } from '@/shared/models/user.model';
import {
  LoginVerifyRequest,
  ChallengeRequest,
  RegisterRequest,
} from '@/modules/auth/auth.schemas';
import { UserRepository } from '@/shared/repositories/user.repository';
import {
  generateTokens,
  TokenPayload,
} from './auth.token.helper';
import { NotFoundError } from '@/shared/exceptions/api-error';

// Elliptic Curve
const ec = new EC('secp256k1');

/**
 * @class AuthService
 * Contains the core business logic for authentication. This service
 * is responsible for user registration, password verification, token generation,
 * and handling the refresh token mechanism securely.
 */
export class AuthService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Registers a new user.
   */
  public async register(requestData: RegisterRequest): Promise<User> {
    const existingUser = await this.userRepository.findByUsername(
      requestData.username
    );
    if (existingUser) {
      throw new ConflictError('User with this username already exists');
    }

    const dataToInsert = {
      username: requestData.username,
      publicKey: requestData.publicKey,
    };

    const newUser = await this.userRepository.create(dataToInsert);

    return newUser;
  }

  /**
   * Creates a challenge for a user.
   */
  public async challenge(requestData: ChallengeRequest): Promise<string> {
    const user = await this.userRepository.findByUsername(requestData.username);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Random Nonce String
    const nonce =
      Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    await this.userRepository.updateNonce(user.id, nonce);

    return nonce;
  }

  /**
   * Login - Verify Signature
   */
  public async login(
    requestData: LoginVerifyRequest
  ): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findByUsername(requestData.username);
    if (!user || !user.nonce) {
      throw new UnauthorizedError('Invalid session or nonce expired');
    }

    // Load public key user
    const key = ec.keyFromPublic(user.publicKey, 'hex');

    // Hash nonce
    const nonceHash = sha3_256(user.nonce);

    // Verify signature
    const isValid = key.verify(nonceHash, requestData.signature);

    // Delete nonce
    await this.userRepository.updateNonce(user.id, null);

    if (!isValid) {
      throw new UnauthorizedError('Digital Signature verification failed');
    }

    const payload: TokenPayload = { sub: user.id, name: user.username };
    const { accessToken } = await generateTokens(payload);

    return { accessToken };
  }
}