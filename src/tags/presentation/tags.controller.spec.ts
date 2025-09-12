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
});
