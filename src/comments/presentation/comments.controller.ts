import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/presentation/guards/auth.guard';
import { CreateCommentUseCase } from '../application/use-cases/create-comment.use-case';
import { DeleteCommentUseCase } from '../application/use-cases/delete-comment.use-case';
import { ListCommentsByArticleUseCase } from '../application/use-cases/list-comments-by-article.use-case';
import { ListRepliesUseCase } from '../application/use-cases/list-replies.use-case';
import { CommentMapper } from '../application/mappers/comment.mapper';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  CommentResponseDto,
} from './dto/comment-response.dto';
import {
  ListCommentsDto,
  ListCommentsResponseDto,
} from './dto/list-comments.dto';
import { ListRepliesDto, ListRepliesResponseDto } from './dto/list-replies.dto';
import { DeleteCommentResponseDto } from './dto/delete-comment.dto';

@ApiTags('comments')
@Controller('comments')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class CommentsController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly listCommentsByArticleUseCase: ListCommentsByArticleUseCase,
    private readonly listRepliesUseCase: ListRepliesUseCase,
  ) {}

  @Get('article/:articleId')
  @ApiOperation({
    summary: 'Listar comentários de um artigo com paginação por cursor',
  })
  @ApiParam({
    name: 'articleId',
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentários retornada com sucesso',
    type: ListCommentsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async listCommentsByArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query() query: ListCommentsDto,
  ): Promise<ListCommentsResponseDto> {
    const result = await this.listCommentsByArticleUseCase.execute({
      articleId,
      size: query.size,
      after: query.after,
    });

    const comments = CommentMapper.toListWithRepliesResponse(result.data);

    return new ListCommentsResponseDto(comments, result.meta);
  }

  @Get(':commentId/replies')
  @ApiOperation({
    summary: 'Listar respostas de um comentário com paginação por cursor',
  })
  @ApiParam({
    name: 'commentId',
    description: 'ID do comentário pai',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de respostas retornada com sucesso',
    type: ListRepliesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async listReplies(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query() query: ListRepliesDto,
  ): Promise<ListRepliesResponseDto> {
    const result = await this.listRepliesUseCase.execute({
      parentId: commentId,
      size: query.size,
      after: query.after,
    });

    const replies = CommentMapper.toListResponse(result.data);

    return new ListRepliesResponseDto(replies, result.meta);
  }

  @Post('article/:articleId')
  @ApiOperation({ summary: 'Criar novo comentário em um artigo' })
  @ApiParam({
    name: 'articleId',
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Comentário criado com sucesso',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async createComment(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CommentResponseDto> {
    const result = await this.createCommentUseCase.execute({
      articleId,
      authorId: req.user!.id,
      content: dto.content,
      parentId: dto.parentId,
    });

    const comment = CommentMapper.toResponse(result.comment);
    return new CommentResponseDto(comment);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar comentário' })
  @ApiParam({
    name: 'id',
    description: 'ID do comentário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Comentário deletado com sucesso',
    type: DeleteCommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar este comentário',
  })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  async deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteCommentResponseDto> {
    await this.deleteCommentUseCase.execute({
      id,
      authorId: req.user!.id,
    });

    return new DeleteCommentResponseDto({
      success: true,
      message: 'Comentário deletado com sucesso',
    });
  }
}
