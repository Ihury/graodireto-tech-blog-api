import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCommentUseCase } from './create-comment.use-case';
import { CommentRepositoryPort } from '../../domain/ports/comment.repository.port';
import { ArticleRepositoryPort } from '@/articles/domain/ports/article.repository.port';
import { Comment } from '../../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../../domain/value-objects';
import { Article } from '@/articles/domain/entities/article.entity';
import { ArticleTitle, ArticleContent } from '@/articles/domain/value-objects';

describe('CreateCommentUseCase', () => {
  let useCase: CreateCommentUseCase;
  let commentRepository: jest.Mocked<CommentRepositoryPort>;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;

  const mockUserId = crypto.randomUUID();
  const mockArticleId = crypto.randomUUID();
  const mockCommentId = crypto.randomUUID();
  const mockParentId = crypto.randomUUID();

  // Função para criar artigo mock
  const createMockArticle = () => {
    return Article.reconstitute({
      id: Uuid.create(mockArticleId),
      authorId: Uuid.create(crypto.randomUUID()),
      title: ArticleTitle.create('A Revolução da Grão Direto no Agronegócio'),
      slug: {
        getValue: () => 'a-revolucao-da-grao-direto-no-agronegocio',
      } as any,
      summary: { getValue: () => 'Resumo do artigo' } as any,
      content: ArticleContent.create(
        'Conteúdo do artigo válido com pelo menos 50 caracteres',
      ),
      coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: [],
    });
  };

  // Função para criar comentário mock
  const createMockComment = (isReply = false) => {
    return Comment.reconstitute({
      id: Uuid.create(mockCommentId),
      articleId: Uuid.create(mockArticleId),
      authorId: Uuid.create(mockUserId),
      parentId: isReply ? Uuid.create(mockParentId) : undefined,
      content: CommentContent.create('Excelente artigo! Muito esclarecedor.'),
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  beforeEach(async () => {
    const mockCommentRepository = {
      findById: jest.fn(),
      findByArticleId: jest.fn(),
      findRepliesByParentId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockArticleRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCommentUseCase,
        {
          provide: CommentRepositoryPort,
          useValue: mockCommentRepository,
        },
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCommentUseCase>(CreateCommentUseCase);
    commentRepository = module.get(CommentRepositoryPort);
    articleRepository = module.get(ArticleRepositoryPort);
  });

  describe('execute', () => {
    const validCommand = {
      articleId: mockArticleId,
      authorId: mockUserId,
      content: 'Excelente artigo! Muito esclarecedor sobre Clean Architecture.',
    };

    // Teste do fluxo de criação de comentário
    describe('Orquestração do fluxo de criação', () => {
      it('deve criar comentário principal com sucesso', async () => {
        const mockArticle = createMockArticle();
        const mockComment = createMockComment();
        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.save.mockResolvedValue(mockComment);

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ comment: mockComment });
        expect(commentRepository.save).toHaveBeenCalledWith(
          expect.any(Comment),
        );
        expect(commentRepository.save).toHaveBeenCalledTimes(1);
      });

      it('deve criar resposta com sucesso', async () => {
        const commandWithParent = { ...validCommand, parentId: mockParentId };
        const mockArticle = createMockArticle();
        const mockParentComment = createMockComment(false);
        const mockReply = createMockComment(true);

        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.findById.mockResolvedValue(mockParentComment);
        commentRepository.save.mockResolvedValue(mockReply);

        const result = await useCase.execute(commandWithParent);

        expect(result).toEqual({ comment: mockReply });
        expect(commentRepository.findById).toHaveBeenCalledWith(
          expect.any(Uuid),
        );
        expect(commentRepository.save).toHaveBeenCalledWith(
          expect.any(Comment),
        );
      });
    });

    // Teste de validação de existência do artigo
    describe('Validação de existência do artigo', () => {
      it('deve lançar NotFoundException quando artigo não existe', async () => {
        articleRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });
    });

    // Teste de validação de comentário pai
    describe('Validação de comentário pai', () => {
      it('deve lançar NotFoundException quando comentário pai não existe', async () => {
        const commandWithParent = { ...validCommand, parentId: mockParentId };
        const mockArticle = createMockArticle();
        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(commandWithParent)).rejects.toThrow(
          NotFoundException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });

      it('deve lançar BadRequestException quando tentando responder a uma resposta', async () => {
        const commandWithParent = { ...validCommand, parentId: mockParentId };
        const mockArticle = createMockArticle();
        const mockParentComment = createMockComment(true); // Comentário é uma resposta

        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.findById.mockResolvedValue(mockParentComment);

        await expect(useCase.execute(commandWithParent)).rejects.toThrow(
          BadRequestException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });

      it('deve lançar BadRequestException quando comentário pai pertence a artigo diferente', async () => {
        const commandWithParent = { ...validCommand, parentId: mockParentId };
        const mockArticle = createMockArticle();
        const mockParentComment = Comment.reconstitute({
          id: Uuid.create(mockParentId),
          articleId: Uuid.create(crypto.randomUUID()), // Artigo diferente
          authorId: Uuid.create(crypto.randomUUID()),
          content: CommentContent.create('Comentário de outro artigo'),
          isDeleted: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        });

        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.findById.mockResolvedValue(mockParentComment);

        await expect(useCase.execute(commandWithParent)).rejects.toThrow(
          BadRequestException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });
    });

    // Teste de mapeamento de erros de domínio para HTTP
    describe('Mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear InvalidValueObjectError para BadRequestException', async () => {
        const invalidCommand = {
          articleId: 'invalid-uuid',
          authorId: mockUserId,
          content: 'Comentário válido',
        };

        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          BadRequestException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });

      it('deve mapear erro de conteúdo muito curto para BadRequestException', async () => {
        const commandWithShortContent = { ...validCommand, content: '' };

        await expect(useCase.execute(commandWithShortContent)).rejects.toThrow(
          BadRequestException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });

      it('deve mapear erro de conteúdo muito longo para BadRequestException', async () => {
        const commandWithLongContent = {
          ...validCommand,
          content: 'a'.repeat(1001),
        }; // Mais de 1000 caracteres

        await expect(useCase.execute(commandWithLongContent)).rejects.toThrow(
          BadRequestException,
        );
        expect(commentRepository.save).not.toHaveBeenCalled();
      });
    });

    // Teste de criação de objetos de domínio
    describe('Criação de objetos de domínio', () => {
      it('deve criar Comment com dados corretos', async () => {
        let capturedComment: Comment | undefined;
        const mockArticle = createMockArticle();
        const mockComment = createMockComment();

        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.save.mockImplementation((comment: Comment) => {
          capturedComment = comment;
          return Promise.resolve(mockComment);
        });

        await useCase.execute(validCommand);

        expect(capturedComment).toBeDefined();
        expect(capturedComment!.getContent().getValue()).toBe(
          validCommand.content,
        );
        expect(capturedComment!.getArticleId().getValue()).toBe(
          validCommand.articleId,
        );
        expect(capturedComment!.getAuthorId().getValue()).toBe(
          validCommand.authorId,
        );
        expect(capturedComment!.isReply()).toBe(false);
      });

      it('deve criar Comment como resposta com dados corretos', async () => {
        let capturedComment: Comment | undefined;
        const commandWithParent = { ...validCommand, parentId: mockParentId };
        const mockArticle = createMockArticle();
        const mockParentComment = createMockComment(false);
        const mockReply = createMockComment(true);

        articleRepository.findById.mockResolvedValue(mockArticle);
        commentRepository.findById.mockResolvedValue(mockParentComment);
        commentRepository.save.mockImplementation((comment: Comment) => {
          capturedComment = comment;
          return Promise.resolve(mockReply);
        });

        await useCase.execute(commandWithParent);

        expect(capturedComment).toBeDefined();
        expect(capturedComment!.getContent().getValue()).toBe(
          commandWithParent.content,
        );
        expect(capturedComment!.getArticleId().getValue()).toBe(
          commandWithParent.articleId,
        );
        expect(capturedComment!.getAuthorId().getValue()).toBe(
          commandWithParent.authorId,
        );
        expect(capturedComment!.getParentId()?.getValue()).toBe(
          commandWithParent.parentId,
        );
        expect(capturedComment!.isReply()).toBe(true);
      });
    });
  });
});
