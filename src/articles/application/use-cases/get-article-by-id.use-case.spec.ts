import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetArticleByIdUseCase } from './get-article-by-id.use-case';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../../domain/value-objects';

describe('GetArticleByIdUseCase', () => {
  let useCase: GetArticleByIdUseCase;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;

  const mockUserId = '3c1b4ab9-6965-4237-9847-e7d9dd83325f';
  const mockArticleId = '346e9870-8248-41e5-89d4-c73725905d8d';

  const mockUser = {
    id: mockUserId,
    email: 'ihury@graodireto.com.br',
    displayName: 'Ihury Kewin',
    avatarUrl: undefined,
  };

  // Centralização da criação do artigo
  const createMockArticle = (isDeleted = false) => {
    return Article.reconstitute({
      id: Uuid.create(mockArticleId),
      authorId: Uuid.create(mockUserId),
      author: mockUser,
      title: ArticleTitle.create('A Revolução da Grão Direto no Agronegócio'),
      slug: ArticleSlug.create('a-revolucao-da-grao-direto-no-agronegocio'),
      summary: ArticleSummary.create(
        'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos.',
      ),
      content: ArticleContent.create(
        'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos. A plataforma utiliza algoritmos avançados para recomendar preços baseados em dados de mercado em tempo real.',
      ),
      coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
      isDeleted,
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
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetArticleByIdUseCase,
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetArticleByIdUseCase>(GetArticleByIdUseCase);
    articleRepository = module.get(ArticleRepositoryPort);
  });

  describe('execute', () => {
    const validCommand = {
      id: mockArticleId,
    };

    describe('orquestração do fluxo de busca', () => {
      it('deve buscar artigo por ID com sucesso', async () => {
        const mockArticle = createMockArticle();
        articleRepository.findById.mockResolvedValue(mockArticle);

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ article: mockArticle });
        expect(articleRepository.findById).toHaveBeenCalledWith(
          expect.any(Uuid),
        );
        expect(articleRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('deve lançar NotFoundException quando artigo não existe', async () => {
        articleRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(articleRepository.findById).toHaveBeenCalledWith(
          expect.any(Uuid),
        );
      });

      it('deve lançar NotFoundException quando artigo está deletado', async () => {
        const deletedArticle = createMockArticle(true);
        articleRepository.findById.mockResolvedValue(deletedArticle);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(articleRepository.findById).toHaveBeenCalledWith(
          expect.any(Uuid),
        );
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear erro de UUID inválido para NotFoundException', async () => {
        const invalidCommand = { id: 'invalid-uuid' };
        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(articleRepository.findById).not.toHaveBeenCalled();
      });
    });

    describe('validação de UUID', () => {
      it('deve converter string UUID para objeto Uuid corretamente', async () => {
        let capturedUuid: Uuid | undefined;
        articleRepository.findById.mockImplementation((uuid: Uuid) => {
          capturedUuid = uuid;
          return Promise.resolve(createMockArticle());
        });

        await useCase.execute(validCommand);

        expect(capturedUuid).toBeDefined();
        expect(capturedUuid?.getValue()).toBe(mockArticleId);
      });
    });

    describe('diferentes cenários de artigos', () => {
      it('deve retornar artigo com todos os campos preenchidos', async () => {
        const completeArticle = createMockArticle();
        articleRepository.findById.mockResolvedValue(completeArticle);

        const result = await useCase.execute(validCommand);

        expect(result.article).toEqual(completeArticle);
        expect(result.article.getId().getValue()).toBe(mockArticleId);
        expect(result.article.getTitle().getValue()).toBe(
          'A Revolução da Grão Direto no Agronegócio',
        );
        expect(result.article.getSummary()!.getValue()).toBe(
          'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos.',
        );
        expect(result.article.getTags()).toHaveLength(3);
      });

      it('deve retornar artigo sem campos opcionais', async () => {
        const minimalArticle = createMockArticle();
        minimalArticle.updateCoverImage(undefined);
        minimalArticle.updateTags([]);

        articleRepository.findById.mockResolvedValue(minimalArticle);

        const result = await useCase.execute(validCommand);

        expect(result.article).toEqual(minimalArticle);
        expect(result.article.getCoverImageUrl()).toBeUndefined();
        expect(result.article.getTags()).toEqual([]);
      });
    });
  });
});
