import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../value-objects/comment-content.vo';
import { UserResponse } from '@/auth';

export interface CommentProps {
  id: Uuid;
  articleId: Uuid;
  parentId?: Uuid;
  authorId: Uuid;
  author?: UserResponse;
  content: CommentContent;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Comment {
  private constructor(private readonly props: CommentProps) {}

  static create(
    props: Omit<
      CommentProps,
      'id' | 'isDeleted' | 'createdAt' | 'updatedAt'
    > & {
      id?: Uuid;
    },
  ): Comment {
    const now = new Date();

    return new Comment({
      ...props,
      id: props.id || Uuid.create(crypto.randomUUID()),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CommentProps): Comment {
    return new Comment(props);
  }

  // Getters
  getId(): Uuid {
    return this.props.id;
  }

  getArticleId(): Uuid {
    return this.props.articleId;
  }

  getParentId(): Uuid | undefined {
    return this.props.parentId;
  }

  getAuthorId(): Uuid {
    return this.props.authorId;
  }

  getAuthor(): UserResponse | undefined {
    return this.props.author;
  }

  getContent(): CommentContent {
    return this.props.content;
  }

  isCommentDeleted(): boolean {
    return this.props.isDeleted;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isReply(): boolean {
    return this.props.parentId !== undefined;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.updateTimestamp();
  }

  restore(): void {
    this.props.isDeleted = false;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject() {
    return {
      id: this.props.id.getValue(),
      article_id: this.props.articleId.getValue(),
      parent_id: this.props.parentId?.getValue(),
      author_id: this.props.authorId.getValue(),
      content: this.props.content.getValue(),
      is_deleted: this.props.isDeleted,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
