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
});
