import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteArticleUseCase } from './delete-article.use-case';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../../domain/value-objects';

describe('DeleteArticleUseCase', () => {
  let useCase: DeleteArticleUseCase;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;

  const mockUserId = '3c1b4ab9-6965-4237-9847-e7d9dd83325f';
  const mockArticleId = '346e9870-8248-41e5-89d4-c73725905d8d';

  const createMockArticle = (isDeleted = false) => {
    return Article.reconstitute({
      id: Uuid.create(mockArticleId),
      authorId: Uuid.create(mockUserId),
      title: ArticleTitle.create(
        'Como implementar Clean Architecture no NestJS',
      ),
      slug: ArticleSlug.create('como-implementar-clean-architecture-no-nestjs'),
      summary: ArticleSummary.create(
        'Um guia completo sobre como aplicar os princípios da Clean Architecture.',
      ),
      content: ArticleContent.create(
        'Clean Architecture é um padrão arquitetural que...',
      ),
      coverImageUrl: 'https://exemplo.com/imagem.jpg',
      isDeleted,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: [
        { slug: 'nestjs', name: 'NestJS' },
        { slug: 'clean-architecture', name: 'Clean Architecture' },
      ],
    });
  };

  beforeEach(async () => {
    const mockArticleRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteArticleUseCase,
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteArticleUseCase>(DeleteArticleUseCase);
    articleRepository = module.get(ArticleRepositoryPort);
  });

  describe('execute', () => {
    const validCommand = {
      id: mockArticleId,
      authorId: mockUserId,
    };

    describe('orquestração do fluxo de deleção', () => {
      it('deve deletar artigo com sucesso', async () => {
        const mockArticle = createMockArticle();
        articleRepository.findById.mockResolvedValue(mockArticle);
        articleRepository.delete.mockResolvedValue();

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
        expect(articleRepository.findById).toHaveBeenCalledWith(
          expect.any(Uuid),
        );
        expect(articleRepository.delete).toHaveBeenCalledWith(expect.any(Uuid));
      });

      it('deve realizar soft delete (marca como deletado)', async () => {
        let capturedArticleId: Uuid;
        articleRepository.findById.mockResolvedValue(createMockArticle());
        articleRepository.delete.mockImplementation((id: Uuid) => {
          capturedArticleId = id;
          return Promise.resolve();
        });

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
        expect(capturedArticleId!.getValue()).toBe(mockArticleId);
      });
    });

    describe('validação de autorização', () => {
      it('deve lançar ForbiddenException quando usuário não é o autor', async () => {
        const commandWithDifferentAuthor = {
          ...validCommand,
          authorId: '1b4509e5-5212-4f7c-af04-244fcdac6580',
        };
        articleRepository.findById.mockResolvedValue(createMockArticle());

        await expect(
          useCase.execute(commandWithDifferentAuthor),
        ).rejects.toThrow(ForbiddenException);
        expect(articleRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('validação de existência do artigo', () => {
      it('deve lançar NotFoundException quando artigo não existe', async () => {
        articleRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(articleRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear erro de UUID inválido para NotFoundException', async () => {
        const invalidCommand = { id: 'invalid-uuid', authorId: mockUserId };
        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(articleRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('fluxo de deleção e validação de UUID', () => {
      it('deve converter string UUID para objeto Uuid corretamente e usar o mesmo para findById e delete', async () => {
        let findByIdUuid: Uuid, deleteUuid: Uuid;
        articleRepository.findById.mockImplementation((uuid: Uuid) => {
          findByIdUuid = uuid;
          return Promise.resolve(createMockArticle());
        });
        articleRepository.delete.mockImplementation((uuid: Uuid) => {
          deleteUuid = uuid;
          return Promise.resolve();
        });

        await useCase.execute(validCommand);

        expect(findByIdUuid!.getValue()).toBe(deleteUuid!.getValue());
        expect(findByIdUuid!.getValue()).toBe(mockArticleId);
      });
    });

    describe('diferentes cenários de artigos', () => {
      it('deve deletar artigo com todos os campos preenchidos', async () => {
        const completeArticle = createMockArticle();
        articleRepository.findById.mockResolvedValue(completeArticle);
        articleRepository.delete.mockResolvedValue();

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
      });
    });

    describe('fluxo de deleção', () => {
      it('deve seguir ordem correta: buscar -> validar -> deletar', async () => {
        const callOrder: string[] = [];
        articleRepository.findById.mockImplementation(() => {
          callOrder.push('findById');
          return Promise.resolve(createMockArticle());
        });
        articleRepository.delete.mockImplementation(() => {
          callOrder.push('delete');
          return Promise.resolve();
        });

        await useCase.execute(validCommand);

        expect(callOrder).toEqual(['findById', 'delete']);
      });

      it('deve parar no primeiro erro (artigo não encontrado)', async () => {
        const callOrder: string[] = [];
        articleRepository.findById.mockImplementation(() => {
          callOrder.push('findById');
          return Promise.resolve(null);
        });

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(callOrder).toEqual(['findById']);
      });

      it('deve parar no segundo erro (sem permissão)', async () => {
        const commandWithDifferentAuthor = {
          ...validCommand,
          authorId: '1b4509e5-5212-4f7c-af04-244fcdac6580',
        };
        const callOrder: string[] = [];
        articleRepository.findById.mockImplementation(() => {
          callOrder.push('findById');
          return Promise.resolve(createMockArticle());
        });

        await expect(
          useCase.execute(commandWithDifferentAuthor),
        ).rejects.toThrow(ForbiddenException);
        expect(callOrder).toEqual(['findById']);
      });
    });
  });
});
