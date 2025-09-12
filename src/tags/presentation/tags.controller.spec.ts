import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { ListTagsUseCase } from '../application/use-cases/list-tags.use-case';
import { TagMapper } from '../application/mappers/tag.mapper';
import { Tag } from '../domain/entities/tag.entity';
import { TagName, TagSlug } from '../domain/value-objects';
import { ValidateTokenUseCase } from '@/auth';

describe('TagsController', () => {
  let controller: TagsController;
  let listTagsUseCase: jest.Mocked<ListTagsUseCase>;

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

  const mockListTagsResult = {
    tags: [
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
    ],
    total: 3,
  };

  beforeEach(async () => {
    const mockListTagsUseCase = {
      execute: jest.fn(),
    };

    const mockValidateTokenUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: ListTagsUseCase,
          useValue: mockListTagsUseCase,
        },
        {
          provide: ValidateTokenUseCase,
          useValue: mockValidateTokenUseCase,
        },
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
    listTagsUseCase = module.get(ListTagsUseCase);
  });

  describe('GET /tags', () => {
    it('deve retornar lista de tags com sucesso', async () => {
      // Arrange
      listTagsUseCase.execute.mockResolvedValue(mockListTagsResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result).toEqual({
        tags: [
          {
            slug: 'react',
            name: 'React',
            createdAt: new Date('2023-01-01'),
          },
          {
            slug: 'vue-js',
            name: 'Vue.js',
            createdAt: new Date('2023-01-02'),
          },
          {
            slug: 'angular',
            name: 'Angular',
            createdAt: new Date('2023-01-03'),
          },
        ],
        total: 3,
      });
      expect(listTagsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista vazia quando não há tags', async () => {
      // Arrange
      const emptyResult = {
        tags: [],
        total: 0,
      };
      listTagsUseCase.execute.mockResolvedValue(emptyResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result).toEqual({
        tags: [],
        total: 0,
      });
      expect(listTagsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista com uma tag', async () => {
      // Arrange
      const singleTagResult = {
        tags: [
          createMockTag({
            slug: 'typescript',
            name: 'TypeScript',
            active: true,
            createdAt: new Date('2023-01-01'),
          }),
        ],
        total: 1,
      };
      listTagsUseCase.execute.mockResolvedValue(singleTagResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result).toEqual({
        tags: [
          {
            slug: 'typescript',
            name: 'TypeScript',
            createdAt: new Date('2023-01-01'),
          },
        ],
        total: 1,
      });
      expect(listTagsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro do ListTagsUseCase', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      listTagsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.listTags()).rejects.toThrow(
        'Database connection failed',
      );
      expect(listTagsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro de timeout do ListTagsUseCase', async () => {
      // Arrange
      const error = new Error('Request timeout');
      listTagsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.listTags()).rejects.toThrow('Request timeout');
      expect(listTagsUseCase.execute).toHaveBeenCalledTimes(1);
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

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result.tags).toHaveLength(frontendTags.length);
      expect(result.total).toBe(frontendTags.length);

      frontendTags.forEach(({ slug, name }, index) => {
        expect(result.tags[index].slug).toBe(slug);
        expect(result.tags[index].name).toBe(name);
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

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result.tags).toHaveLength(backendTags.length);
      expect(result.total).toBe(backendTags.length);

      backendTags.forEach(({ slug, name }, index) => {
        expect(result.tags[index].slug).toBe(slug);
        expect(result.tags[index].name).toBe(name);
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

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result.tags).toHaveLength(conceptTags.length);
      expect(result.total).toBe(conceptTags.length);

      conceptTags.forEach(({ slug, name }, index) => {
        expect(result.tags[index].slug).toBe(slug);
        expect(result.tags[index].name).toBe(name);
      });
    });

    it('deve manter ordem das tags retornadas pelo use case', async () => {
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

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      expect(result.tags[0].slug).toBe('first');
      expect(result.tags[1].slug).toBe('second');
      expect(result.tags[2].slug).toBe('third');
    });

    it('deve retornar tags com datas de criação corretas', async () => {
      // Arrange
      const specificDates = [
        new Date('2023-01-01T10:00:00.000Z'),
        new Date('2023-01-02T11:30:00.000Z'),
        new Date('2023-01-03T14:45:00.000Z'),
      ];

      const mockTags = specificDates.map((date, index) =>
        createMockTag({
          slug: `tag-${index}`,
          name: `Tag ${index}`,
          createdAt: date,
        }),
      );

      const mockResult = {
        tags: mockTags,
        total: specificDates.length,
      };

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      specificDates.forEach((date, index) => {
        expect(result.tags[index].createdAt).toEqual(date);
      });
    });

    it('deve retornar tags com slugs complexos', async () => {
      // Arrange
      const complexSlugs = [
        {
          slug: 'node-js-express-typescript',
          name: 'Node.js Express TypeScript',
        },
        { slug: 'react-native-expo', name: 'React Native Expo' },
        { slug: 'c-sharp-dotnet-core', name: 'C# .NET Core' },
        {
          slug: 'python-django-rest-framework',
          name: 'Python Django REST Framework',
        },
      ];

      const mockTags = complexSlugs.map(({ slug, name }) =>
        createMockTag({ slug, name }),
      );

      const mockResult = {
        tags: mockTags,
        total: complexSlugs.length,
      };

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      complexSlugs.forEach(({ slug, name }, index) => {
        expect(result.tags[index].slug).toBe(slug);
        expect(result.tags[index].name).toBe(name);
      });
    });

    it('deve retornar tags com nomes contendo caracteres especiais', async () => {
      // Arrange
      const specialNames = [
        { slug: 'dotnet', name: '.NET' },
        { slug: 'c-plus-plus', name: 'C++' },
        { slug: 'f-sharp', name: 'F#' },
        { slug: 'r-sharp', name: 'R#' },
      ];

      const mockTags = specialNames.map(({ slug, name }) =>
        createMockTag({ slug, name }),
      );

      const mockResult = {
        tags: mockTags,
        total: specialNames.length,
      };

      listTagsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.listTags();

      // Assert
      specialNames.forEach(({ slug, name }, index) => {
        expect(result.tags[index].slug).toBe(slug);
        expect(result.tags[index].name).toBe(name);
      });
    });
  });
});
