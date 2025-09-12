import { Comment } from './comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../value-objects/comment-content.vo';

describe('Comment Entity', () => {
  // Função centralizada para criar propriedades de comentário válidas
  const createValidCommentProps = () => {
    const articleId = crypto.randomUUID();
    const authorId = crypto.randomUUID();
    return {
      articleId: Uuid.create(articleId),
      authorId: Uuid.create(authorId),
      content: CommentContent.create(
        'Excelente artigo! Muito esclarecedor sobre Clean Architecture.',
      ),
    };
  };

  // Função para criar um comentário mock
  const createMockComment = (id = crypto.randomUUID(), isReply = false) => {
    return Comment.reconstitute({
      id: Uuid.create(id),
      articleId: Uuid.create(crypto.randomUUID()),
      authorId: Uuid.create(crypto.randomUUID()),
      author: {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        email: 'usuario@exemplo.com',
        displayName: 'Usuário Teste',
        avatarUrl: undefined,
      },
      content: CommentContent.create('Excelente artigo! Muito esclarecedor.'),
      parentId: isReply ? Uuid.create(crypto.randomUUID()) : undefined,
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  describe('create', () => {
    it('deve criar comentário com dados válidos', () => {
      const props = createValidCommentProps();
      const comment = Comment.create(props);

      expect(comment.getContent().getValue()).toBe(
        'Excelente artigo! Muito esclarecedor sobre Clean Architecture.',
      );
      expect(comment.getArticleId().getValue()).toBeDefined();
      expect(comment.getAuthorId().getValue()).toBeDefined();
      expect(comment.getId()).toBeDefined();
      expect(comment.getCreatedAt()).toBeInstanceOf(Date);
      expect(comment.getUpdatedAt()).toBeInstanceOf(Date);
      expect(comment.isCommentDeleted()).toBe(false);
      expect(comment.isReply()).toBe(false);
    });

    it('deve criar comentário como resposta quando parentId fornecido', () => {
      const parentId = crypto.randomUUID();
      const props = {
        ...createValidCommentProps(),
        parentId: Uuid.create(parentId),
      };

      const comment = Comment.create(props);

      expect(comment.getParentId()?.getValue()).toBe(parentId);
      expect(comment.isReply()).toBe(true);
    });

    it('deve criar comentário principal quando parentId não fornecido', () => {
      const props = createValidCommentProps();
      const comment = Comment.create(props);

      expect(comment.getParentId()).toBeUndefined();
      expect(comment.isReply()).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('deve reconstituir comentário com todos os dados', () => {
      const id = crypto.randomUUID();
      const articleId = crypto.randomUUID();
      const authorId = crypto.randomUUID();
      const props = {
        id: Uuid.create(id),
        articleId: Uuid.create(articleId),
        authorId: Uuid.create(authorId),
        author: {
          id: authorId,
          email: 'usuario@exemplo.com',
          displayName: 'Usuário Teste',
          avatarUrl: 'https://exemplo.com/avatar.jpg',
        },
        content: CommentContent.create('Excelente artigo! Muito esclarecedor.'),
        isDeleted: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      const comment = Comment.reconstitute(props);

      expect(comment.getId().getValue()).toBe(id);
      expect(comment.getArticleId().getValue()).toBe(articleId);
      expect(comment.getAuthorId().getValue()).toBe(authorId);
      expect(comment.getAuthor()!.id).toBe(authorId);
      expect(comment.getContent().getValue()).toBe(
        'Excelente artigo! Muito esclarecedor.',
      );
      expect(comment.isCommentDeleted()).toBe(false);
      expect(comment.getCreatedAt()).toEqual(new Date('2023-01-01'));
      expect(comment.getUpdatedAt()).toEqual(new Date('2023-01-01'));
    });

    it('deve reconstituir comentário como resposta', () => {
      const id = crypto.randomUUID();
      const articleId = crypto.randomUUID();
      const parentId = crypto.randomUUID();
      const authorId = crypto.randomUUID();
      const props = {
        id: Uuid.create(id),
        articleId: Uuid.create(articleId),
        parentId: Uuid.create(parentId),
        authorId: Uuid.create(authorId),
        content: CommentContent.create('Concordo com o comentário anterior!'),
        isDeleted: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      const comment = Comment.reconstitute(props);

      expect(comment.getParentId()?.getValue()).toBe(parentId);
      expect(comment.isReply()).toBe(true);
    });
  });

  describe('business methods', () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(createValidCommentProps());
    });

    describe('isReply', () => {
      it('deve retornar true quando comentário tem parentId', () => {
        const replyComment = Comment.create({
          ...createValidCommentProps(),
          parentId: Uuid.create(crypto.randomUUID()),
        });

        expect(replyComment.isReply()).toBe(true);
      });

      it('deve retornar false quando comentário não tem parentId', () => {
        expect(comment.isReply()).toBe(false);
      });
    });

    describe('softDelete', () => {
      it('deve marcar comentário como deletado e atualizar timestamp', async () => {
        const originalUpdatedAt = comment.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5)); // Simula um delay

        comment.softDelete();

        expect(comment.isCommentDeleted()).toBe(true);
        expect(comment.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('restore', () => {
      it('deve restaurar comentário deletado e atualizar timestamp', async () => {
        comment.softDelete();
        const originalUpdatedAt = comment.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5)); // Simula um delay

        comment.restore();

        expect(comment.isCommentDeleted()).toBe(false);
        expect(comment.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });
  });
});
