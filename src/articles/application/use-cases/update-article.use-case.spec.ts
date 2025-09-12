import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UpdateArticleUseCase } from './update-article.use-case';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../../domain/value-objects';
import { InvalidValueObjectError } from '@/common';

describe('UpdateArticleUseCase', () => {
  let useCase: UpdateArticleUseCase;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;

  const mockUserId = '3c1b4ab9-6965-4237-9847-e7d9dd83325f';
  const mockArticleId = '346e9870-8248-41e5-89d4-c73725905d8d';

  const mockArticle = Article.reconstitute({
    id: Uuid.create(mockArticleId),
    authorId: Uuid.create(mockUserId),
    title: ArticleTitle.create('Como implementar Clean Architecture no NestJS'),
    slug: ArticleSlug.create('como-implementar-clean-architecture-no-nestjs'),
    summary: ArticleSummary.create(
      'Um guia completo sobre como aplicar os princípios da Clean Architecture.',
    ),
    content: ArticleContent.create(
      'Clean Architecture é um padrão arquitetural que...',
    ),
    coverImageUrl: 'https://exemplo.com/imagem.jpg',
    isDeleted: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    tags: [
      { slug: 'nestjs', name: 'NestJS' },
      { slug: 'clean-architecture', name: 'Clean Architecture' },
    ],
  });

  beforeEach(async () => {
    const mockArticleRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateArticleUseCase,
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateArticleUseCase>(UpdateArticleUseCase);
    articleRepository = module.get(ArticleRepositoryPort);
  });

  describe('execute', () => {
    const validCommand = {
      id: mockArticleId,
      authorId: mockUserId,
      title: 'Título Atualizado',
      content:
        'Conteúdo atualizado com pelo menos 50 caracteres para satisfazer a validação.',
    };

    describe('orquestração do fluxo de atualização', () => {
      const executeTest = async (command: any) => {
        articleRepository.findById.mockResolvedValue(mockArticle);
        articleRepository.save.mockResolvedValue(mockArticle);

        return await useCase.execute(command);
      };

      const assertSaveCalledWith = (article: Article) => {
        expect(articleRepository.save).toHaveBeenCalledWith(expect.any(Article));
        expect(articleRepository.findById).toHaveBeenCalledWith(expect.any(Uuid));
      };

      it('deve atualizar artigo com sucesso', async () => {
        const result = await executeTest(validCommand);

        expect(result).toEqual({ article: mockArticle });
        assertSaveCalledWith(mockArticle);
      });

      it('deve atualizar apenas título quando fornecido', async () => {
        const commandWithTitleOnly = {
          id: mockArticleId,
          authorId: mockUserId,
          title: 'Novo Título',
        };
        const result = await executeTest(commandWithTitleOnly);

        expect(result).toEqual({ article: mockArticle });
        assertSaveCalledWith(mockArticle);
      });

      it('deve atualizar apenas conteúdo quando fornecido', async () => {
        const commandWithContentOnly = {
          id: mockArticleId,
          authorId: mockUserId,
          content:
            'Novo conteúdo com pelo menos 50 caracteres para satisfazer a validação.',
        };
        const result = await executeTest(commandWithContentOnly);

        expect(result).toEqual({ article: mockArticle });
        assertSaveCalledWith(mockArticle);
      });

      it('deve atualizar apenas coverImageUrl quando fornecido', async () => {
        const commandWithImageOnly = {
          id: mockArticleId,
          authorId: mockUserId,
          coverImageUrl: 'https://exemplo.com/nova-imagem.jpg',
        };
        const result = await executeTest(commandWithImageOnly);

        expect(result).toEqual({ article: mockArticle });
        assertSaveCalledWith(mockArticle);
      });

      it('deve atualizar apenas tags quando fornecidas', async () => {
        const commandWithTagsOnly = {
          id: mockArticleId,
          authorId: mockUserId,
          tags: ['nestjs', 'typescript', 'clean-architecture'],
        };
        const result = await executeTest(commandWithTagsOnly);

        expect(result).toEqual({ article: mockArticle });
        assertSaveCalledWith(mockArticle);
      });

      it('deve atualizar coverImageUrl para undefined quando string vazia', async () => {
        const commandWithEmptyImage = {
          id: mockArticleId,
          authorId: mockUserId,
          coverImageUrl: '',
        };
        const result = await executeTest(commandWithEmptyImage);

        expect(result).toEqual({ article: mockArticle });
        expect(articleRepository.save).toHaveBeenCalledWith(expect.any(Article));
      });
    });

    describe('validação de autorização', () => {
      it('deve lançar ForbiddenException quando usuário não é o autor', async () => {
        const differentUserId = '6952684d-f352-47ed-a433-0cf351c6b826';
        const commandWithDifferentAuthor = {
          ...validCommand,
          authorId: differentUserId,
        };
        articleRepository.findById.mockResolvedValue(mockArticle);

        await expect(
          useCase.execute(commandWithDifferentAuthor),
        ).rejects.toThrow(ForbiddenException);

        expect(articleRepository.findById).toHaveBeenCalledWith(expect.any(Uuid));
        expect(articleRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('validação de existência do artigo', () => {
      it('deve lançar NotFoundException quando artigo não existe', async () => {
        articleRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );

        expect(articleRepository.findById).toHaveBeenCalledWith(expect.any(Uuid));
        expect(articleRepository.save).not.toHaveBeenCalled();
      });

      it('deve lançar NotFoundException quando artigo está deletado', async () => {
        const deletedArticle = Article.reconstitute({
          id: Uuid.create(mockArticleId),
          title: ArticleTitle.create(mockArticle.getTitle().getValue()),
          slug: ArticleSlug.create(mockArticle.getSlug().getValue()),
          summary: ArticleSummary.create(mockArticle.getSummary()?.getValue()),
          content: ArticleContent.create(mockArticle.getContent().getValue()),
          coverImageUrl: mockArticle.getCoverImageUrl(),
          authorId: Uuid.create(mockUserId),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          isDeleted: true,
        });
        articleRepository.findById.mockResolvedValue(deletedArticle);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );

        expect(articleRepository.findById).toHaveBeenCalledWith(expect.any(Uuid));
        expect(articleRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear InvalidValueObjectError para BadRequestException', async () => {
        const invalidCommand = {
          id: 'invalid-uuid',
          authorId: mockUserId,
          title: 'Título Atualizado',
        };

        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          BadRequestException,
        );

        expect(articleRepository.findById).not.toHaveBeenCalled();
      });

      it('deve mapear erro de título muito curto para BadRequestException', async () => {
        const commandWithShortTitle = {
          ...validCommand,
          title: 'Oi',
        };
        articleRepository.findById.mockResolvedValue(mockArticle);

        await expect(useCase.execute(commandWithShortTitle)).rejects.toThrow(
          BadRequestException,
        );

        expect(articleRepository.save).not.toHaveBeenCalled();
      });

      it('deve mapear erro de conteúdo muito curto para BadRequestException', async () => {
        const commandWithShortContent = {
          ...validCommand,
          content: 'Pouco',
        };
        articleRepository.findById.mockResolvedValue(mockArticle);

        await expect(useCase.execute(commandWithShortContent)).rejects.toThrow(
          BadRequestException,
        );

        expect(articleRepository.save).not.toHaveBeenCalled();
      });

      it('deve propagar ConflictException do repositório', async () => {
        articleRepository.findById.mockResolvedValue(mockArticle);
        articleRepository.save.mockRejectedValue(
          new ConflictException('Já existe um artigo com este título'),
        );

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('atualização de objetos de domínio', () => {
      it('deve atualizar título e gerar novo slug automaticamente', async () => {
        let capturedArticle: Article;
        articleRepository.findById.mockResolvedValue(mockArticle);
        articleRepository.save.mockImplementation((article: Article) => {
          capturedArticle = article;
          return Promise.resolve(mockArticle);
        });

        await useCase.execute({
          id: mockArticleId,
          authorId: mockUserId,
          title: 'Novo Título Específico',
        });

        expect(capturedArticle!.getTitle().getValue()).toBe(
          'Novo Título Específico',
        );
        expect(capturedArticle!.getSlug().getValue()).toBe(
          'novo-titulo-especifico',
        );
      });

      it('deve atualizar conteúdo e gerar novo summary automaticamente', async () => {
        let capturedArticle: Article;
        articleRepository.findById.mockResolvedValue(mockArticle);
        articleRepository.save.mockImplementation((article: Article) => {
          capturedArticle = article;
          return Promise.resolve(mockArticle);
        });

        await useCase.execute({
          id: mockArticleId,
          authorId: mockUserId,
          content:
            'Novo conteúdo com pelo menos 50 caracteres para satisfazer a validação e gerar um novo resumo.',
        });

        expect(capturedArticle!.getContent().getValue()).toBe(
          'Novo conteúdo com pelo menos 50 caracteres para satisfazer a validação e gerar um novo resumo.',
        );
        expect(capturedArticle!.getSummary()).toBeDefined();
        expect(capturedArticle!.getSummary()?.getValue()?.length).toBeLessThanOrEqual(280);
      });

      it('deve atualizar tags corretamente', async () => {
        let capturedArticle: Article;
        articleRepository.findById.mockResolvedValue(mockArticle);
        articleRepository.save.mockImplementation((article: Article) => {
          capturedArticle = article;
          return Promise.resolve(mockArticle);
        });

        await useCase.execute({
          id: mockArticleId,
          authorId: mockUserId,
          tags: ['nestjs', 'typescript', 'clean-architecture'],
        });

        expect(capturedArticle!.getTags()).toEqual([
          { slug: 'nestjs', name: 'nestjs' },
          { slug: 'typescript', name: 'typescript' },
          { slug: 'clean-architecture', name: 'clean-architecture' },
        ]);
      });
    });
  });
});
