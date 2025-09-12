import { Test, TestingModule } from '@nestjs/testing';
import { ListCommentsByArticleUseCase } from './list-comments-by-article.use-case';
import { CommentRepositoryPort } from '../../domain/ports/comment.repository.port';
import { Comment } from '../../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../../domain/value-objects';

describe('ListCommentsByArticleUseCase', () => {
  let useCase: ListCommentsByArticleUseCase;
  let commentRepository: jest.Mocked<CommentRepositoryPort>;

  const mockArticleId = crypto.randomUUID();
  const mockUserId = crypto.randomUUID();

  // Função centralizada para criar comentários
  const createMockComment = (id: string, isReply = false) => {
    return Comment.reconstitute({
      id: Uuid.create(id),
      articleId: Uuid.create(mockArticleId),
      authorId: Uuid.create(mockUserId),
      parentId: isReply ? Uuid.create(crypto.randomUUID()) : undefined,
      content: CommentContent.create(`Comentário ${id}`),
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  const createMockCommentWithReplies = (
    commentId: string,
    repliesCount = 2,
  ) => {
    const mainComment = createMockComment(commentId, false);
    const replies = Array.from({ length: repliesCount }, (_, i) =>
      createMockComment(crypto.randomUUID(), true),
    );

    return {
      comment: mainComment,
      replies: {
        data: replies,
        meta: {
          size: replies.length,
          nextCursor: replies.length > 0 ? 'next-cursor' : undefined,
        },
      },
    };
  };

  const mockCommentsWithReplies = [
    createMockCommentWithReplies(crypto.randomUUID(), 2),
    createMockCommentWithReplies(crypto.randomUUID(), 1),
    createMockCommentWithReplies(crypto.randomUUID(), 0),
  ];

  beforeEach(async () => {
    const mockCommentRepository = {
      findById: jest.fn(),
      findByArticleId: jest.fn(),
      findRepliesByParentId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCommentsByArticleUseCase,
        {
          provide: CommentRepositoryPort,
          useValue: mockCommentRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListCommentsByArticleUseCase>(
      ListCommentsByArticleUseCase,
    );
    commentRepository = module.get(CommentRepositoryPort);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockRepositoryResult = {
      data: mockCommentsWithReplies,
      meta: {
        size: 3,
        nextCursor: 'next-page-cursor',
      },
    };

    describe('paginação básica', () => {
      it('deve listar comentários com paginação padrão', async () => {
        const command = { articleId: mockArticleId };
        commentRepository.findByArticleId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(result).toBeDefined();
        expect(result.data).toHaveLength(3);
        expect(result.meta.size).toBe(3);
        expect(result.meta.nextCursor).toBe('next-page-cursor');

        expect(commentRepository.findByArticleId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 10, after: undefined },
        );
      });

      it('deve listar comentários com paginação personalizada', async () => {
        const command = {
          articleId: mockArticleId,
          size: 5,
          after: 'cursor-123',
        };
        commentRepository.findByArticleId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(result.meta.size).toBe(3);
        expect(commentRepository.findByArticleId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 5, after: 'cursor-123' },
        );
      });

      it('deve limitar size máximo a 50', async () => {
        const command = { articleId: mockArticleId, size: 100 };
        commentRepository.findByArticleId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(commentRepository.findByArticleId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 50, after: undefined },
        );
      });
    });

    describe('diferentes cenários de resultado', () => {
      it('deve lidar com resultado vazio', async () => {
        const command = { articleId: mockArticleId };
        const emptyResult = {
          data: [],
          meta: { size: 0, nextCursor: undefined },
        };
        commentRepository.findByArticleId.mockResolvedValue(emptyResult);

        const result = await useCase.execute(command);

        expect(result.data).toHaveLength(0);
        expect(result.meta.size).toBe(0);
        expect(result.meta.nextCursor).toBeUndefined();
      });

      it('deve retornar comentários com preview de respostas', async () => {
        const command = { articleId: mockArticleId };
        commentRepository.findByArticleId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(result.data).toHaveLength(3);
        expect(result.data[0].comment).toBeDefined();
        expect(result.data[0].replies).toBeDefined();
        expect(result.data[0].replies.data).toHaveLength(2);
        expect(result.data[0].replies.meta.size).toBe(2);
      });

      it('deve indicar quando há mais respostas disponíveis', async () => {
        const command = { articleId: mockArticleId };
        const resultWithMoreReplies = {
          data: [createMockCommentWithReplies(crypto.randomUUID(), 3)],
          meta: { size: 1, nextCursor: 'next-cursor' },
        };
        commentRepository.findByArticleId.mockResolvedValue(
          resultWithMoreReplies,
        );

        const result = await useCase.execute(command);

        expect(result.data[0].replies.meta.nextCursor).toBe('next-cursor');
      });
    });

    describe('validação de UUID', () => {
      it('deve converter string UUID para objeto Uuid corretamente', async () => {
        let capturedUuid: Uuid | undefined;
        commentRepository.findByArticleId.mockImplementation((uuid: Uuid) => {
          capturedUuid = uuid;
          return Promise.resolve(mockRepositoryResult);
        });

        await useCase.execute({ articleId: mockArticleId });

        expect(capturedUuid).toBeDefined();
        expect(capturedUuid?.getValue()).toBe(mockArticleId);
      });

      it('deve lançar erro para UUID inválido', async () => {
        const command = { articleId: 'invalid-uuid' };

        await expect(useCase.execute(command)).rejects.toThrow();
        expect(commentRepository.findByArticleId).not.toHaveBeenCalled();
      });
    });

    describe('propagação de erros', () => {
      it('deve propagar erros do repositório', async () => {
        const command = { articleId: mockArticleId };
        const repositoryError = new Error('Erro do repositório');
        commentRepository.findByArticleId.mockRejectedValue(repositoryError);

        await expect(useCase.execute(command)).rejects.toThrow(
          'Erro do repositório',
        );
      });
    });

    describe('diferentes cenários de paginação', () => {
      it('deve lidar com cursor de paginação', async () => {
        const command = {
          articleId: mockArticleId,
          size: 2,
          after:
            'eyJpZCI6ImNvbW1lbnQtMSIsImNyZWF0ZWRBdCI6IjIwMjMtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
        };
        commentRepository.findByArticleId.mockResolvedValue(
          mockRepositoryResult,
        );

        await useCase.execute(command);

        expect(commentRepository.findByArticleId).toHaveBeenCalledWith(
          expect.any(Uuid),
          {
            size: 2,
            after:
              'eyJpZCI6ImNvbW1lbnQtMSIsImNyZWF0ZWRBdCI6IjIwMjMtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
          },
        );
      });

      it('deve usar valores padrão quando parâmetros não fornecidos', async () => {
        const command = { articleId: mockArticleId };
        commentRepository.findByArticleId.mockResolvedValue(
          mockRepositoryResult,
        );

        await useCase.execute(command);

        expect(commentRepository.findByArticleId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 10, after: undefined },
        );
      });
    });
  });
});
