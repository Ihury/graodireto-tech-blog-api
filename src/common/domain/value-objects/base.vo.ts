import { validateSync, ValidationError } from 'class-validator';
import { InvalidValueObjectError } from '../exceptions';

/**
 * Classe base para Value Objects que usam class-validator
 */
export abstract class BaseValueObject<T> {
  protected constructor(protected readonly value: T) {
    this.validate(value);
  }

  protected abstract createValidator(value: T): object;

  private validate(value: T): void {
    const validator = this.createValidator(value);
    const errors = validateSync(validator);

    if (errors.length > 0) {
      const firstError = errors[0].constraints;
      const message = firstError
        ? Object.values(firstError)[0]
        : 'Valor inválido';
      throw new InvalidValueObjectError(message);
    }
  }

  getValue(): T {
    return this.value;
  }

  abstract equals(other: BaseValueObject<T>): boolean;

  toString(): string {
    return String(this.value);
  }
}
