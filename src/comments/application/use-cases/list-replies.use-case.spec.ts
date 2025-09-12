import { Test, TestingModule } from '@nestjs/testing';
import { ListRepliesUseCase } from './list-replies.use-case';
import { CommentRepositoryPort } from '../../domain/ports/comment.repository.port';
import { Comment } from '../../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../../domain/value-objects';

describe('ListRepliesUseCase', () => {
  let useCase: ListRepliesUseCase;
  let commentRepository: jest.Mocked<CommentRepositoryPort>;

  const mockParentId = crypto.randomUUID();
  const mockUserId = crypto.randomUUID();

  // Função para criar uma resposta mock
  const createMockReply = (id: string) => {
    return Comment.reconstitute({
      id: Uuid.create(id),
      articleId: Uuid.create(crypto.randomUUID()),
      parentId: Uuid.create(mockParentId),
      authorId: Uuid.create(mockUserId),
      content: CommentContent.create(`Resposta ${id}`),
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  const mockReplies = [
    createMockReply(crypto.randomUUID()),
    createMockReply(crypto.randomUUID()),
    createMockReply(crypto.randomUUID()),
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
        ListRepliesUseCase,
        {
          provide: CommentRepositoryPort,
          useValue: mockCommentRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListRepliesUseCase>(ListRepliesUseCase);
    commentRepository = module.get(CommentRepositoryPort);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockRepositoryResult = {
      data: mockReplies,
      meta: {
        size: 3,
        nextCursor: 'next-page-cursor',
      },
    };

    // Testes de Paginação
    describe('Paginação básica', () => {
      it('deve listar respostas com paginação padrão', async () => {
        const command = { parentId: mockParentId };
        commentRepository.findRepliesByParentId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(result).toBeDefined();
        expect(result.data).toHaveLength(3);
        expect(result.meta.size).toBe(3);
        expect(result.meta.nextCursor).toBe('next-page-cursor');
        expect(commentRepository.findRepliesByParentId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 10, after: undefined },
        );
      });

      it('deve listar respostas com paginação personalizada', async () => {
        const command = {
          parentId: mockParentId,
          size: 5,
          after: 'cursor-123',
        };
        commentRepository.findRepliesByParentId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(result.meta.size).toBe(3);
        expect(commentRepository.findRepliesByParentId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 5, after: 'cursor-123' },
        );
      });

      it('deve limitar size máximo a 50', async () => {
        const command = { parentId: mockParentId, size: 100 };
        commentRepository.findRepliesByParentId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(commentRepository.findRepliesByParentId).toHaveBeenCalledWith(
          expect.any(Uuid),
          { size: 50, after: undefined },
        );
      });
    });

    // Testes de Resultado Vazio e Ordenação
    describe('Cenários de resultado', () => {
      it('deve lidar com resultado vazio', async () => {
        const command = { parentId: mockParentId };
        const emptyResult = {
          data: [],
          meta: { size: 0, nextCursor: undefined },
        };
        commentRepository.findRepliesByParentId.mockResolvedValue(emptyResult);

        const result = await useCase.execute(command);

        expect(result.data).toHaveLength(0);
        expect(result.meta.size).toBe(0);
        expect(result.meta.nextCursor).toBeUndefined();
      });

      it('deve retornar respostas ordenadas por data de criação', async () => {
        const command = { parentId: mockParentId };
        commentRepository.findRepliesByParentId.mockResolvedValue(
          mockRepositoryResult,
        );

        const result = await useCase.execute(command);

        expect(result.data).toHaveLength(3);
        result.data.forEach((reply, index) => {
          expect(reply.getId().getValue()).toBeDefined();
        });
      });

      it('deve indicar quando há mais respostas disponíveis', async () => {
        const command = { parentId: mockParentId };
        const resultWithMoreReplies = {
          data: mockReplies.slice(0, 2),
          meta: { size: 2, nextCursor: 'next-cursor' },
        };
        commentRepository.findRepliesByParentId.mockResolvedValue(
          resultWithMoreReplies,
        );

        const result = await useCase.execute(command);

        expect(result.data).toHaveLength(2);
        expect(result.meta.nextCursor).toBe('next-cursor');
      });
    });

    // Testes de Validação de UUID
    describe('Validação de UUID', () => {
      it('deve converter string UUID para objeto Uuid corretamente', async () => {
        let capturedUuid: Uuid | undefined;
        commentRepository.findRepliesByParentId.mockImplementation(
          (uuid: Uuid) => {
            capturedUuid = uuid;
            return Promise.resolve(mockRepositoryResult);
          },
        );

        await useCase.execute({ parentId: mockParentId });

        expect(capturedUuid).toBeDefined();
        expect(capturedUuid?.getValue()).toBe(mockParentId);
      });

      it('deve lançar erro para UUID inválido', async () => {
        const command = { parentId: 'invalid-uuid' };

        await expect(useCase.execute(command)).rejects.toThrow();
        expect(commentRepository.findRepliesByParentId).not.toHaveBeenCalled();
      });
    });

    // Testes de Propagação de Erros
    describe('Propagação de erros', () => {
      it('deve propagar erros do repositório', async () => {
        const command = { parentId: mockParentId };
        const repositoryError = new Error('Erro do repositório');
        commentRepository.findRepliesByParentId.mockRejectedValue(
          repositoryError,
        );

        await expect(useCase.execute(command)).rejects.toThrow(
          'Erro do repositório',
        );
      });
    });
  });
});
