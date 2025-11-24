import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { UserRepository } from '@/modules/user/user.repository';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { MessageRepository } from '@/modules/message/message.repository';
import { MessageService } from '@/modules/message/message.service';
import { MessageController } from '@/modules/message/message.controller';
import { ContactRepository } from '@/modules/contact/contact.repository';
import { ContactService } from '@/modules/contact/contact.service';
import { ContactController } from '@/modules/contact/contact.controller';

/**
 * @file Dependency Injection (DI) Container.
 *
 * This file is responsible for instantiating and wiring up all the application's
 * services, repositories, and controllers. It follows a manual DI pattern
 * to ensure that dependencies are explicitly managed and provided to the
 * components that need them. This promotes loose coupling and testability.
 */

// Create instances of repositories
const userRepository = new UserRepository();

// Dependency Injection for AuthService and AuthController
const authService = new AuthService(userRepository);
export const authController = new AuthController(authService);

// Dependency Injection for UserService and UserController
const userService = new UserService(userRepository);
export const userController = new UserController(userService);

// Dependency Injection for MessageService and MessageController
const messageRepository = new MessageRepository();
const messageService = new MessageService(messageRepository, userRepository);
export const messageController = new MessageController(messageService);

// Dependency Injection for Contact modules
const contactRepository = new ContactRepository();
const contactService = new ContactService(contactRepository, userRepository);
export const contactController = new ContactController(contactService);
