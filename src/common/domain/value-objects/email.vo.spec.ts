import { Email } from './email.vo';
import { InvalidValueObjectError } from '../exceptions/domain.error';

describe('Email Value Object', () => {
  describe('create', () => {
    it('deve criar email válido', () => {
      // Arrange & Act
      const email = Email.create('ihury@graodireto.com.br');

      // Assert
      expect(email.getValue()).toBe('ihury@graodireto.com.br');
    });

    it('deve aceitar emails complexos válidos', () => {
      const validEmails = [
        'ihury@graodireto.com.br',
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.com',
        'user123@domain-name.com',
        'contato@graodireto.com.br',
      ];

      validEmails.forEach((emailValue) => {
        const email = Email.create(emailValue);
        expect(email.getValue()).toBe(emailValue);
      });
    });

    it('deve rejeitar emails inválidos', () => {
      const invalidEmails = [
        '',
        'invalid',
        'invalid@',
        '@domain.com',
        'user@',
        'user space@domain.com',
        'user@domain',
        'user@@domain.com',
      ];

      invalidEmails.forEach((invalidEmail) => {
        expect(() => Email.create(invalidEmail)).toThrow(
          InvalidValueObjectError,
        );
      });
    });

    it('deve rejeitar email muito longo (> 320 caracteres)', () => {
      const longEmail = 'a'.repeat(310) + '@domain.com'; // 321 caracteres

      expect(() => Email.create(longEmail)).toThrow(InvalidValueObjectError);
    });

    it('deve rejeitar email vazio', () => {
      expect(() => Email.create('')).toThrow(InvalidValueObjectError);
    });
  });

  describe('equals', () => {
    it('deve considerar emails iguais independente de case', () => {
      // Arrange
      const email1 = Email.create('Ihury@GraoDireto.Com.Br');
      const email2 = Email.create('ihury@graodireto.com.br');

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
      expect(email2.equals(email1)).toBe(true);
    });

    it('deve considerar emails diferentes como diferentes', () => {
      // Arrange
      const email1 = Email.create('ihury@graodireto.com.br');
      const email2 = Email.create('contato@graodireto.com.br');

      // Act & Assert
      expect(email1.equals(email2)).toBe(false);
      expect(email2.equals(email1)).toBe(false);
    });

    it('deve considerar mesmo email como igual', () => {
      // Arrange
      const email1 = Email.create('ihury@graodireto.com.br');
      const email2 = Email.create('ihury@graodireto.com.br');

      // Act & Assert
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('deve retornar string do email', () => {
      // Arrange
      const email = Email.create('ihury@graodireto.com.br');

      // Act & Assert
      expect(email.toString()).toBe('ihury@graodireto.com.br');
    });
  });
});
