import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteCommentUseCase } from './delete-comment.use-case';
import { CommentRepositoryPort } from '../../domain/ports/comment.repository.port';
import { Comment } from '../../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../../domain/value-objects';

describe('DeleteCommentUseCase', () => {
  let useCase: DeleteCommentUseCase;
  let commentRepository: jest.Mocked<CommentRepositoryPort>;

  const mockUserId = crypto.randomUUID();
  const mockCommentId = crypto.randomUUID();

  const createMockComment = (isDeleted = false, authorId = mockUserId) => {
    return Comment.reconstitute({
      id: Uuid.create(mockCommentId),
      articleId: Uuid.create(crypto.randomUUID()),
      authorId: Uuid.create(authorId),
      content: CommentContent.create('Excelente artigo! Muito esclarecedor.'),
      isDeleted,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCommentUseCase,
        {
          provide: CommentRepositoryPort,
          useValue: mockCommentRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteCommentUseCase>(DeleteCommentUseCase);
    commentRepository = module.get(CommentRepositoryPort);
  });

  describe('execute', () => {
    const validCommand = {
      id: mockCommentId,
      authorId: mockUserId,
    };

    describe('orquestração do fluxo de deleção', () => {
      it('deve deletar comentário com sucesso', async () => {
        const mockComment = createMockComment();
        commentRepository.findById.mockResolvedValue(mockComment);
        commentRepository.delete.mockResolvedValue();

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
        expect(commentRepository.findById).toHaveBeenCalledWith(
          expect.any(Uuid),
        );
        expect(commentRepository.delete).toHaveBeenCalledWith(expect.any(Uuid));
      });

      it('deve realizar soft delete (marca como deletado)', async () => {
        let capturedCommentId: Uuid;
        commentRepository.findById.mockResolvedValue(createMockComment());
        commentRepository.delete.mockImplementation((id: Uuid) => {
          capturedCommentId = id;
          return Promise.resolve();
        });

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
        expect(capturedCommentId!.getValue()).toBe(mockCommentId);
      });
    });

    describe('validação de autorização', () => {
      it('deve lançar ForbiddenException quando usuário não é o autor', async () => {
        const commandWithDifferentAuthor = {
          ...validCommand,
          authorId: crypto.randomUUID(),
        };
        commentRepository.findById.mockResolvedValue(createMockComment());

        await expect(
          useCase.execute(commandWithDifferentAuthor),
        ).rejects.toThrow(ForbiddenException);
        expect(commentRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('validação de existência do comentário', () => {
      it('deve lançar NotFoundException quando comentário não existe', async () => {
        commentRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(commentRepository.delete).not.toHaveBeenCalled();
      });

      it('deve lançar NotFoundException quando comentário está deletado', async () => {
        const deletedComment = createMockComment(true);
        commentRepository.findById.mockResolvedValue(deletedComment);

        await expect(useCase.execute(validCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(commentRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear erro de UUID inválido para NotFoundException', async () => {
        const invalidCommand = { id: 'invalid-uuid', authorId: mockUserId };
        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          NotFoundException,
        );
        expect(commentRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('fluxo de deleção e validação de UUID', () => {
      it('deve converter string UUID para objeto Uuid corretamente e usar o mesmo para findById e delete', async () => {
        let findByIdUuid: Uuid, deleteUuid: Uuid;
        commentRepository.findById.mockImplementation((uuid: Uuid) => {
          findByIdUuid = uuid;
          return Promise.resolve(createMockComment());
        });
        commentRepository.delete.mockImplementation((uuid: Uuid) => {
          deleteUuid = uuid;
          return Promise.resolve();
        });

        await useCase.execute(validCommand);

        expect(findByIdUuid!.getValue()).toBe(deleteUuid!.getValue());
        expect(findByIdUuid!.getValue()).toBe(mockCommentId);
      });
    });

    describe('diferentes cenários de comentários', () => {
      it('deve deletar comentário principal com sucesso', async () => {
        const mainComment = createMockComment();
        commentRepository.findById.mockResolvedValue(mainComment);
        commentRepository.delete.mockResolvedValue();

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
      });

      it('deve deletar resposta com sucesso', async () => {
        const replyComment = Comment.reconstitute({
          id: Uuid.create(mockCommentId),
          articleId: Uuid.create(crypto.randomUUID()),
          parentId: Uuid.create(crypto.randomUUID()),
          authorId: Uuid.create(mockUserId),
          content: CommentContent.create('Concordo com o comentário anterior!'),
          isDeleted: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        });

        commentRepository.findById.mockResolvedValue(replyComment);
        commentRepository.delete.mockResolvedValue();

        const result = await useCase.execute(validCommand);

        expect(result).toEqual({ success: true });
      });
    });

    describe('fluxo de deleção', () => {
      it('deve seguir ordem correta: buscar -> validar -> deletar', async () => {
        const callOrder: string[] = [];
        commentRepository.findById.mockImplementation(() => {
          callOrder.push('findById');
          return Promise.resolve(createMockComment());
        });
        commentRepository.delete.mockImplementation(() => {
          callOrder.push('delete');
          return Promise.resolve();
        });

        await useCase.execute(validCommand);

        expect(callOrder).toEqual(['findById', 'delete']);
      });

      it('deve parar no primeiro erro (comentário não encontrado)', async () => {
        const callOrder: string[] = [];
        commentRepository.findById.mockImplementation(() => {
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
          authorId: crypto.randomUUID(),
        };
        const callOrder: string[] = [];
        commentRepository.findById.mockImplementation(() => {
          callOrder.push('findById');
          return Promise.resolve(createMockComment());
        });

        await expect(
          useCase.execute(commandWithDifferentAuthor),
        ).rejects.toThrow(ForbiddenException);
        expect(callOrder).toEqual(['findById']);
      });
    });
  });
});
