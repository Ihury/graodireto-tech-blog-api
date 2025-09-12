import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateArticleUseCase } from './create-article.use-case';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSlug,
  ArticleSummary,
} from '../../domain/value-objects';
import { InvalidValueObjectError } from '@/common';

describe('CreateArticleUseCase', () => {
  let useCase: CreateArticleUseCase;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;

  const mockUserId = '3c1b4ab9-6965-4237-9847-e7d9dd83325f';
  const mockArticleId = '346e9870-8248-41e5-89d4-c73725905d8d';

  const createMockArticle = () => {
    return Article.reconstitute({
      id: Uuid.create(mockArticleId),
      authorId: Uuid.create(mockUserId),
      title: ArticleTitle.create('A Revolução da Grão Direto no Agronegócio'),
      slug: ArticleSlug.create('a-revolucao-da-grao-direto-no-agronegocio'),
      summary: ArticleSummary.create(
        'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta...',
      ),
      content: ArticleContent.create(
        'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta...',
      ),
      coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: [
        { slug: 'grao-direto', name: 'Grão Direto' },
        { slug: 'tecnologia', name: 'tecnologia' },
        { slug: 'agronegocio', name: 'agronegócio' },
      ],
    });
  };

  beforeEach(async () => {
    const mockArticleRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateArticleUseCase,
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateArticleUseCase>(CreateArticleUseCase);
    articleRepository = module.get(ArticleRepositoryPort);
  });

  describe('execute', () => {
    const validCommand = {
      authorId: mockUserId,
      title: 'A Revolução da Grão Direto no Agronegócio',
      content:
        'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta...',
      coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
      tags: ['grao-direto', 'tecnologia', 'agronegocio'],
    };

    describe('orquestração do fluxo de criação', () => {
      it('deve criar artigo com sucesso', async () => {
        const mockArticle = createMockArticle();
        articleRepository.save.mockResolvedValue(mockArticle);

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ article: mockArticle });
        expect(articleRepository.save).toHaveBeenCalledWith(
          expect.any(Article),
        );
        expect(articleRepository.save).toHaveBeenCalledTimes(1);
      });

      it('deve criar artigo sem tags quando não fornecidas', async () => {
        const commandWithoutTags = { ...validCommand, tags: undefined };
        const mockArticle = createMockArticle();
        articleRepository.save.mockResolvedValue(mockArticle);

        const result = await useCase.execute(commandWithoutTags);

        expect(result).toEqual({ article: mockArticle });
      });

      it('deve criar artigo sem coverImageUrl quando não fornecida', async () => {
        const commandWithoutImage = {
          ...validCommand,
          coverImageUrl: undefined,
        };
        const mockArticle = createMockArticle();
        articleRepository.save.mockResolvedValue(mockArticle);

        const result = await useCase.execute(commandWithoutImage);

        expect(result).toEqual({ article: mockArticle });
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear InvalidValueObjectError para BadRequestException', async () => {
        const invalidCommand = {
          authorId: 'invalid-uuid',
          title: 'Como implementar...',
          content: '...',
        };

        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          BadRequestException,
        );
        expect(articleRepository.save).not.toHaveBeenCalled();
      });

      it('deve mapear erro de título muito curto para BadRequestException', async () => {
        const commandWithShortTitle = { ...validCommand, title: 'Oi' };

        await expect(useCase.execute(commandWithShortTitle)).rejects.toThrow(
          BadRequestException,
        );
        expect(articleRepository.save).not.toHaveBeenCalled();
      });

      it('deve mapear erro de conteúdo muito curto para BadRequestException', async () => {
        const commandWithShortContent = { ...validCommand, content: 'Pouco' };

        await expect(useCase.execute(commandWithShortContent)).rejects.toThrow(
          BadRequestException,
        );
        expect(articleRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('criação de objetos de domínio', () => {
      it('deve criar Article com dados corretos', async () => {
        let capturedArticle: Article | undefined;
        articleRepository.save.mockImplementation((article: Article) => {
          capturedArticle = article;
          return Promise.resolve(createMockArticle());
        });

        await useCase.execute(validCommand);

        expect(capturedArticle).toBeDefined();
        expect(capturedArticle!.getTitle().getValue()).toBe(validCommand.title);
        expect(capturedArticle!.getContent().getValue()).toBe(
          validCommand.content,
        );
        expect(capturedArticle!.getAuthorId().getValue()).toBe(
          validCommand.authorId,
        );
        expect(capturedArticle!.getCoverImageUrl()).toBe(
          validCommand.coverImageUrl,
        );
      });
    });
  });
});
