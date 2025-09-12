import { Test, TestingModule } from '@nestjs/testing';
import { ListTagsUseCase } from './list-tags.use-case';
import { TagRepositoryPort } from '../../domain/ports/tag.repository.port';
import { Tag } from '../../domain/entities/tag.entity';
import { TagName, TagSlug } from '../../domain/value-objects';

describe('ListTagsUseCase', () => {
  let useCase: ListTagsUseCase;
  let tagRepository: jest.Mocked<TagRepositoryPort>;

  const createMockTag = (
    overrides: Partial<{
      slug: string;
      name: string;
      active: boolean;
      createdAt: Date;
    }> = {},
  ) => {
    const defaults = {
      slug: 'react',
      name: 'React',
      active: true,
      createdAt: new Date('2023-01-01'),
    };

    const props = { ...defaults, ...overrides };

    return Tag.reconstitute({
      slug: TagSlug.create(props.slug),
      name: TagName.create(props.name),
      active: props.active,
      createdAt: props.createdAt,
    });
  };

  beforeEach(async () => {
    const mockTagRepository = {
      findMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListTagsUseCase,
        {
          provide: TagRepositoryPort,
          useValue: mockTagRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListTagsUseCase>(ListTagsUseCase);
    tagRepository = module.get(TagRepositoryPort);
  });

  describe('execute', () => {
    it('deve retornar lista de tags com sucesso', async () => {
      // Arrange
      const mockTags = [
        createMockTag({
          slug: 'react',
          name: 'React',
          active: true,
          createdAt: new Date('2023-01-01'),
        }),
        createMockTag({
          slug: 'vue-js',
          name: 'Vue.js',
          active: true,
          createdAt: new Date('2023-01-02'),
        }),
        createMockTag({
          slug: 'angular',
          name: 'Angular',
          active: true,
          createdAt: new Date('2023-01-03'),
        }),
      ];

      const mockResult = {
        tags: mockTags,
        total: 3,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual({
        tags: mockTags,
        total: 3,
      });
      expect(tagRepository.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista vazia quando não há tags', async () => {
      // Arrange
      const mockResult = {
        tags: [],
        total: 0,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual({
        tags: [],
        total: 0,
      });
      expect(tagRepository.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista com uma tag', async () => {
      // Arrange
      const mockTag = createMockTag({
        slug: 'typescript',
        name: 'TypeScript',
        active: true,
        createdAt: new Date('2023-01-01'),
      });

      const mockResult = {
        tags: [mockTag],
        total: 1,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual({
        tags: [mockTag],
        total: 1,
      });
      expect(tagRepository.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista com muitas tags', async () => {
      // Arrange
      const mockTags = Array.from({ length: 50 }, (_, index) =>
        createMockTag({
          slug: `tech-${index}`,
          name: `Tech ${index}`,
          active: true,
          createdAt: new Date(`2023-01-${String(index + 1).padStart(2, '0')}`),
        }),
      );

      const mockResult = {
        tags: mockTags,
        total: 50,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual({
        tags: mockTags,
        total: 50,
      });
      expect(tagRepository.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      tagRepository.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(
        'Database connection failed',
      );
      expect(tagRepository.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro de timeout do repositório', async () => {
      // Arrange
      const error = new Error('Request timeout');
      tagRepository.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Request timeout');
      expect(tagRepository.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('casos de uso reais', () => {
    it('deve retornar tags de tecnologias frontend', async () => {
      // Arrange
      const frontendTags = [
        { slug: 'react', name: 'React' },
        { slug: 'vue-js', name: 'Vue.js' },
        { slug: 'angular', name: 'Angular' },
        { slug: 'typescript', name: 'TypeScript' },
        { slug: 'javascript', name: 'JavaScript' },
        { slug: 'html5', name: 'HTML5' },
        { slug: 'css3', name: 'CSS3' },
        { slug: 'sass', name: 'Sass' },
        { slug: 'tailwind-css', name: 'Tailwind CSS' },
      ];

      const mockTags = frontendTags.map(({ slug, name }) =>
        createMockTag({ slug, name }),
      );

      const mockResult = {
        tags: mockTags,
        total: frontendTags.length,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.tags).toHaveLength(frontendTags.length);
      expect(result.total).toBe(frontendTags.length);

      frontendTags.forEach(({ slug, name }, index) => {
        expect(result.tags[index].getSlug().getValue()).toBe(slug);
        expect(result.tags[index].getName().getValue()).toBe(name);
      });
    });

    it('deve retornar tags de tecnologias backend', async () => {
      // Arrange
      const backendTags = [
        { slug: 'node-js', name: 'Node.js' },
        { slug: 'express', name: 'Express' },
        { slug: 'nestjs', name: 'NestJS' },
        { slug: 'python', name: 'Python' },
        { slug: 'django', name: 'Django' },
        { slug: 'fastapi', name: 'FastAPI' },
        { slug: 'java', name: 'Java' },
        { slug: 'spring-boot', name: 'Spring Boot' },
        { slug: 'c-sharp', name: 'C#' },
        { slug: 'dotnet', name: '.NET' },
      ];

      const mockTags = backendTags.map(({ slug, name }) =>
        createMockTag({ slug, name }),
      );

      const mockResult = {
        tags: mockTags,
        total: backendTags.length,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.tags).toHaveLength(backendTags.length);
      expect(result.total).toBe(backendTags.length);

      backendTags.forEach(({ slug, name }, index) => {
        expect(result.tags[index].getSlug().getValue()).toBe(slug);
        expect(result.tags[index].getName().getValue()).toBe(name);
      });
    });

    it('deve retornar tags de conceitos de programação', async () => {
      // Arrange
      const conceptTags = [
        { slug: 'clean-code', name: 'Clean Code' },
        { slug: 'solid', name: 'SOLID' },
        { slug: 'design-patterns', name: 'Design Patterns' },
        { slug: 'tdd', name: 'TDD' },
        { slug: 'bdd', name: 'BDD' },
        { slug: 'agile', name: 'Agile' },
        { slug: 'scrum', name: 'Scrum' },
        { slug: 'devops', name: 'DevOps' },
        { slug: 'microservices', name: 'Microservices' },
        { slug: 'api-rest', name: 'API REST' },
      ];

      const mockTags = conceptTags.map(({ slug, name }) =>
        createMockTag({ slug, name }),
      );

      const mockResult = {
        tags: mockTags,
        total: conceptTags.length,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.tags).toHaveLength(conceptTags.length);
      expect(result.total).toBe(conceptTags.length);

      conceptTags.forEach(({ slug, name }, index) => {
        expect(result.tags[index].getSlug().getValue()).toBe(slug);
        expect(result.tags[index].getName().getValue()).toBe(name);
      });
    });

    it('deve manter ordem das tags retornadas pelo repositório', async () => {
      // Arrange
      const orderedTags = [
        { slug: 'first', name: 'First' },
        { slug: 'second', name: 'Second' },
        { slug: 'third', name: 'Third' },
      ];

      const mockTags = orderedTags.map(({ slug, name }) =>
        createMockTag({ slug, name }),
      );

      const mockResult = {
        tags: mockTags,
        total: orderedTags.length,
      };

      tagRepository.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.tags[0].getSlug().getValue()).toBe('first');
      expect(result.tags[1].getSlug().getValue()).toBe('second');
      expect(result.tags[2].getSlug().getValue()).toBe('third');
    });
  });
});
