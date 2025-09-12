import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CreateCommentUseCase } from '../application/use-cases/create-comment.use-case';
import { DeleteCommentUseCase } from '../application/use-cases/delete-comment.use-case';
import { ListCommentsByArticleUseCase } from '../application/use-cases/list-comments-by-article.use-case';
import { ListRepliesUseCase } from '../application/use-cases/list-replies.use-case';
import { ValidateTokenUseCase } from '../../auth/application/use-cases/validate-token.use-case';
import { Comment } from '../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../domain/value-objects';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { ListRepliesDto } from './dto/list-replies.dto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let createCommentUseCase: jest.Mocked<CreateCommentUseCase>;
  let deleteCommentUseCase: jest.Mocked<DeleteCommentUseCase>;
  let listCommentsByArticleUseCase: jest.Mocked<ListCommentsByArticleUseCase>;
  let listRepliesUseCase: jest.Mocked<ListRepliesUseCase>;

  const mockUserId = crypto.randomUUID();
  const mockArticleId = crypto.randomUUID();
  const mockCommentId = crypto.randomUUID();

  const mockUser = {
    id: mockUserId,
    email: 'usuario@exemplo.com',
    displayName: 'Usuário Teste',
    avatarUrl: undefined,
  };

  // Função para criar um comentário mock
  const createMockComment = (isReply = false) => {
    return Comment.reconstitute({
      id: Uuid.create(mockCommentId),
      articleId: Uuid.create(mockArticleId),
      authorId: Uuid.create(mockUserId),
      author: mockUser,
      content: CommentContent.create('Excelente artigo! Muito esclarecedor.'),
      parentId: isReply ? Uuid.create(crypto.randomUUID()) : undefined,
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  const mockComment = createMockComment();

  beforeEach(async () => {
    const mockCreateCommentUseCase = { execute: jest.fn() };
    const mockDeleteCommentUseCase = { execute: jest.fn() };
    const mockListCommentsByArticleUseCase = { execute: jest.fn() };
    const mockListRepliesUseCase = { execute: jest.fn() };
    const mockValidateTokenUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CreateCommentUseCase,
          useValue: mockCreateCommentUseCase,
        },
        {
          provide: DeleteCommentUseCase,
          useValue: mockDeleteCommentUseCase,
        },
        {
          provide: ListCommentsByArticleUseCase,
          useValue: mockListCommentsByArticleUseCase,
        },
        {
          provide: ListRepliesUseCase,
          useValue: mockListRepliesUseCase,
        },
        {
          provide: ValidateTokenUseCase,
          useValue: mockValidateTokenUseCase,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    createCommentUseCase = module.get(CreateCommentUseCase);
    deleteCommentUseCase = module.get(DeleteCommentUseCase);
    listCommentsByArticleUseCase = module.get(ListCommentsByArticleUseCase);
    listRepliesUseCase = module.get(ListRepliesUseCase);
  });

  describe('GET /articles/:articleId/comments', () => {
    const mockListResult = {
      data: [
        {
          comment: mockComment,
          replies: {
            data: [],
            meta: {
              size: 0,
              nextCursor: undefined,
            },
          },
        },
      ],
      meta: {
        size: 1,
        nextCursor: undefined,
      },
    };

    it('deve listar comentários de um artigo com sucesso', async () => {
      const query: ListCommentsDto = { size: 10 };
      listCommentsByArticleUseCase.execute.mockResolvedValue(mockListResult);

      const result = await controller.listCommentsByArticle(
        mockArticleId,
        query,
      );

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(listCommentsByArticleUseCase.execute).toHaveBeenCalledWith({
        articleId: mockArticleId,
        size: 10,
        after: undefined,
      });
    });

    it('deve listar comentários com paginação personalizada', async () => {
      const query: ListCommentsDto = {
        size: 5,
        after:
          'eyJpZCI6ImNvbW1lbnQtMSIsImNyZWF0ZWRBdCI6IjIwMjMtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
      };
      listCommentsByArticleUseCase.execute.mockResolvedValue(mockListResult);

      const result = await controller.listCommentsByArticle(
        mockArticleId,
        query,
      );

      expect(result).toBeDefined();
      expect(listCommentsByArticleUseCase.execute).toHaveBeenCalledWith({
        articleId: mockArticleId,
        size: 5,
        after:
          'eyJpZCI6ImNvbW1lbnQtMSIsImNyZWF0ZWRBdCI6IjIwMjMtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
      });
    });
  });

  describe('GET /comments/:commentId/replies', () => {
    const mockRepliesResult = {
      data: [createMockComment(true)],
      meta: {
        size: 1,
        nextCursor: undefined,
      },
    };

    it('deve listar respostas de um comentário com sucesso', async () => {
      const query: ListRepliesDto = { size: 10 };
      listRepliesUseCase.execute.mockResolvedValue(mockRepliesResult);

      const result = await controller.listReplies(mockCommentId, query);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(listRepliesUseCase.execute).toHaveBeenCalledWith({
        parentId: mockCommentId,
        size: 10,
        after: undefined,
      });
    });
  });

  describe('POST /articles/:articleId/comments', () => {
    const mockRequest = { user: mockUser } as any;

    it('deve criar comentário principal com sucesso', async () => {
      const dto: CreateCommentDto = {
        content:
          'Excelente artigo! Muito esclarecedor sobre Clean Architecture.',
      };
      createCommentUseCase.execute.mockResolvedValue({ comment: mockComment });

      const result = await controller.createComment(
        mockArticleId,
        dto,
        mockRequest,
      );

      expect(result).toBeDefined();
      expect(createCommentUseCase.execute).toHaveBeenCalledWith({
        articleId: mockArticleId,
        authorId: mockUserId,
        content:
          'Excelente artigo! Muito esclarecedor sobre Clean Architecture.',
        parentId: undefined,
      });
    });

    it('deve lançar BadRequestException para conteúdo inválido', async () => {
      const dto: CreateCommentDto = {
        content: '', // Conteúdo vazio
      };
      createCommentUseCase.execute.mockRejectedValue(
        new BadRequestException('Conteúdo do comentário não pode estar vazio'),
      );

      await expect(
        controller.createComment(mockArticleId, dto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DELETE /comments/:id', () => {
    const mockRequest = { user: mockUser } as any;

    it('deve deletar comentário com sucesso', async () => {
      deleteCommentUseCase.execute.mockResolvedValue({ success: true });

      const result = await controller.deleteComment(mockCommentId, mockRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Comentário deletado com sucesso');
      expect(deleteCommentUseCase.execute).toHaveBeenCalledWith({
        id: mockCommentId,
        authorId: mockUserId,
      });
    });
  });
});
