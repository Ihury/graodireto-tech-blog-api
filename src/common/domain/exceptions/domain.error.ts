export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidValueObjectError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(message: string = 'Credenciais inválidas') {
    super(message);
  }
}

export class InvalidTokenError extends DomainError {
  constructor(message: string = 'Token inválido') {
    super(message);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(message: string = 'Usuário não encontrado') {
    super(message);
  }
}

export class InactiveUserError extends DomainError {
  constructor(message: string = 'Usuário inativo') {
    super(message);
  }
}
