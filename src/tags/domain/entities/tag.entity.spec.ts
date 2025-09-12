import { Tag } from './tag.entity';
import { TagName, TagSlug } from '../value-objects';

describe('Tag Entity', () => {
  const createValidTagProps = () => ({
    name: TagName.create('Frontend'),
    active: true,
  });

  describe('create', () => {
    it('deve criar tag com dados válidos', () => {
      // Arrange
      const props = createValidTagProps();

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getName().getValue()).toBe('Frontend');
      expect(tag.isActive()).toBe(true);
      expect(tag.getSlug()).toBeDefined();
      expect(tag.getSlug().getValue()).toBe('frontend');
      expect(tag.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('deve criar tag com slug customizado', () => {
      // Arrange
      const props = {
        ...createValidTagProps(),
        slug: TagSlug.create('custom-slug'),
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('custom-slug');
    });

    it('deve gerar slug automaticamente baseado no nome', () => {
      // Arrange
      const props = {
        name: TagName.create('React Native'),
        active: true,
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('react-native');
    });

    it('deve gerar slug correto para nomes com acentos', () => {
      // Arrange
      const props = {
        name: TagName.create('Desenvolvimento'),
        active: true,
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('desenvolvimento');
    });

    it('deve gerar slug correto para nomes com caracteres especiais', () => {
      // Arrange
      const props = {
        name: TagName.create('C# & .NET'),
        active: true,
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('c-net');
    });

    it('deve gerar slug correto para nomes com múltiplos espaços', () => {
      // Arrange
      const props = {
        name: TagName.create('  Node.js   Express  '),
        active: true,
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('node-js-express');
    });

    it('deve gerar slug correto para nomes com números', () => {
      // Arrange
      const props = {
        name: TagName.create('React 18'),
        active: true,
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('react-18');
    });

    it('deve criar tag inativa', () => {
      // Arrange
      const props = {
        ...createValidTagProps(),
        active: false,
      };

      // Act
      const tag = Tag.create(props);

      // Assert
      expect(tag.isActive()).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('deve reconstituir tag com todos os dados', () => {
      // Arrange
      const props = {
        slug: TagSlug.create('react-native'),
        name: TagName.create('React Native'),
        active: true,
        createdAt: new Date('2023-01-01'),
      };

      // Act
      const tag = Tag.reconstitute(props);

      // Assert
      expect(tag.getSlug().getValue()).toBe('react-native');
      expect(tag.getName().getValue()).toBe('React Native');
      expect(tag.isActive()).toBe(true);
      expect(tag.getCreatedAt()).toEqual(new Date('2023-01-01'));
    });

    it('deve reconstituir tag inativa', () => {
      // Arrange
      const props = {
        slug: TagSlug.create('old-technology'),
        name: TagName.create('Old Technology'),
        active: false,
        createdAt: new Date('2020-01-01'),
      };

      // Act
      const tag = Tag.reconstitute(props);

      // Assert
      expect(tag.isActive()).toBe(false);
    });
  });

  describe('business methods', () => {
    let tag: Tag;

    beforeEach(() => {
      tag = Tag.create(createValidTagProps());
    });

    describe('activate', () => {
      it('deve ativar tag inativa', () => {
        // Arrange
        const inactiveTag = Tag.create({
          ...createValidTagProps(),
          active: false,
        });

        // Act
        inactiveTag.activate();

        // Assert
        expect(inactiveTag.isActive()).toBe(true);
      });

      it('deve manter tag ativa quando já está ativa', () => {
        // Arrange
        const activeTag = Tag.create(createValidTagProps());

        // Act
        activeTag.activate();

        // Assert
        expect(activeTag.isActive()).toBe(true);
      });
    });

    describe('deactivate', () => {
      it('deve desativar tag ativa', () => {
        // Arrange
        const activeTag = Tag.create(createValidTagProps());

        // Act
        activeTag.deactivate();

        // Assert
        expect(activeTag.isActive()).toBe(false);
      });

      it('deve manter tag inativa quando já está inativa', () => {
        // Arrange
        const inactiveTag = Tag.create({
          ...createValidTagProps(),
          active: false,
        });

        // Act
        inactiveTag.deactivate();

        // Assert
        expect(inactiveTag.isActive()).toBe(false);
      });
    });
  });

  describe('toPlainObject', () => {
    it('deve converter para objeto plano com formato correto', () => {
      // Arrange
      const tag = Tag.reconstitute({
        slug: TagSlug.create('react-native'),
        name: TagName.create('React Native'),
        active: true,
        createdAt: new Date('2023-01-01'),
      });

      // Act
      const plainObject = tag.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        slug: 'react-native',
        name: 'React Native',
        active: true,
        created_at: new Date('2023-01-01'),
      });
    });

    it('deve converter tag inativa para objeto plano', () => {
      // Arrange
      const tag = Tag.reconstitute({
        slug: TagSlug.create('old-tech'),
        name: TagName.create('Old Tech'),
        active: false,
        createdAt: new Date('2020-01-01'),
      });

      // Act
      const plainObject = tag.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        slug: 'old-tech',
        name: 'Old Tech',
        active: false,
        created_at: new Date('2020-01-01'),
      });
    });
  });

  describe('casos de uso reais', () => {
    it('deve criar tags para tecnologias frontend', () => {
      const frontendTechs = [
        'React',
        'Vue.js',
        'Angular',
        'TypeScript',
        'JavaScript',
        'HTML5',
        'CSS3',
        'Sass',
        'Tailwind CSS',
        'Next.js',
        'Nuxt.js',
        'Gatsby',
      ];

      frontendTechs.forEach((tech) => {
        const tag = Tag.create({
          name: TagName.create(tech),
          active: true,
        });

        expect(tag.getName().getValue()).toBe(tech);
        expect(tag.isActive()).toBe(true);
        expect(tag.getSlug()).toBeDefined();
      });
    });

    it('deve criar tags para tecnologias backend', () => {
      const backendTechs = [
        'Node.js',
        'Express',
        'NestJS',
        'Python',
        'Django',
        'FastAPI',
        'Java',
        'Spring Boot',
        'C#',
        '.NET',
        'PHP',
        'Laravel',
        'Ruby',
        'Rails',
        'Go',
        'Gin',
      ];

      backendTechs.forEach((tech) => {
        const tag = Tag.create({
          name: TagName.create(tech),
          active: true,
        });

        expect(tag.getName().getValue()).toBe(tech);
        expect(tag.isActive()).toBe(true);
        expect(tag.getSlug()).toBeDefined();
      });
    });

    it('deve criar tags para conceitos de programação', () => {
      const concepts = [
        'Clean Code',
        'SOLID',
        'Design Patterns',
        'TDD',
        'BDD',
        'Agile',
        'Scrum',
        'DevOps',
        'Microservices',
        'API REST',
        'GraphQL',
        'Docker',
        'Kubernetes',
        'AWS',
        'Azure',
        'GCP',
      ];

      concepts.forEach((concept) => {
        const tag = Tag.create({
          name: TagName.create(concept),
          active: true,
        });

        expect(tag.getName().getValue()).toBe(concept);
        expect(tag.isActive()).toBe(true);
        expect(tag.getSlug()).toBeDefined();
      });
    });

    it('deve gerar slugs únicos para nomes similares', () => {
      const similarNames = [
        'React',
        'React Native',
        'React Router',
        'React Query',
        'React Hook Form',
      ];

      const tags = similarNames.map((name) =>
        Tag.create({
          name: TagName.create(name),
          active: true,
        }),
      );

      const slugs = tags.map((tag) => tag.getSlug().getValue());
      const uniqueSlugs = new Set(slugs);

      expect(uniqueSlugs.size).toBe(slugs.length);
      expect(slugs).toEqual([
        'react',
        'react-native',
        'react-router',
        'react-query',
        'react-hook-form',
      ]);
    });
  });
});
