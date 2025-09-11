import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  NotFoundException,
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
import { ListArticlesUseCase } from '../application/use-cases/list-articles.use-case';
import { GetArticleByIdUseCase } from '../application/use-cases/get-article-by-id.use-case';
import { CreateArticleUseCase } from '../application/use-cases/create-article.use-case';
import { UpdateArticleUseCase } from '../application/use-cases/update-article.use-case';
import { DeleteArticleUseCase } from '../application/use-cases/delete-article.use-case';
import { ArticleMapper } from '../application/mappers/article.mapper';
import { ArticleRepositoryPort } from '../domain/ports/article.repository.port';
import { ArticleSlug } from '../domain/value-objects';
import {
  ListArticlesDto,
  ListArticlesResponseDto,
} from './dto/list-articles.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  ArticleResponseDto,
} from './dto/article-response.dto';
import { DeleteArticleResponseDto } from './dto/delete-article.dto';

@ApiTags('articles')
@Controller('articles')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArticlesController {
  constructor(
    private readonly listArticlesUseCase: ListArticlesUseCase,
    private readonly getArticleByIdUseCase: GetArticleByIdUseCase,
    private readonly createArticleUseCase: CreateArticleUseCase,
    private readonly updateArticleUseCase: UpdateArticleUseCase,
    private readonly deleteArticleUseCase: DeleteArticleUseCase,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar artigos com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artigos retornada com sucesso',
    type: ListArticlesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async listArticles(
    @Query() query: ListArticlesDto,
  ): Promise<ListArticlesResponseDto> {
    const result = await this.listArticlesUseCase.execute({
      page: query.page,
      size: query.size,
      search: query.search,
      tags: query.tags,
    });

    const articles = ArticleMapper.toListResponse(result.data);

    return new ListArticlesResponseDto(articles, result.meta);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter artigo por slug' })
  @ApiParam({
    name: 'slug',
    description: 'Slug do artigo',
    example: 'como-implementar-clean-architecture-no-nestjs',
  })
  @ApiResponse({
    status: 200,
    description: 'Artigo encontrado com sucesso',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async getArticleBySlug(
    @Param('slug') slug: string,
  ): Promise<ArticleResponseDto> {
    const articleSlug = ArticleSlug.create(slug);
    const article = await this.articleRepository.findBySlug(articleSlug);

    if (!article || article.isArticleDeleted()) {
      throw new NotFoundException('Artigo não encontrado');
    }

    const articleResponse = ArticleMapper.toResponse(article);
    return new ArticleResponseDto(articleResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter artigo por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Artigo encontrado com sucesso',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async getArticleById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ArticleResponseDto> {
    const result = await this.getArticleByIdUseCase.execute({ id });
    const article = ArticleMapper.toResponse(result.article);

    return new ArticleResponseDto(article);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo artigo' })
  @ApiResponse({
    status: 201,
    description: 'Artigo criado com sucesso',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async createArticle(
    @Body() dto: CreateArticleDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ArticleResponseDto> {
    const result = await this.createArticleUseCase.execute({
      authorId: req.user!.id,
      title: dto.title,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
      tags: dto.tags,
    });

    const article = ArticleMapper.toResponse(result.article);
    return new ArticleResponseDto(article);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar artigo' })
  @ApiParam({
    name: 'id',
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Artigo atualizado com sucesso',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este artigo',
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async updateArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ArticleResponseDto> {
    const result = await this.updateArticleUseCase.execute({
      id,
      authorId: req.user!.id,
      title: dto.title,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
      tags: dto.tags,
    });

    const article = ArticleMapper.toResponse(result.article);
    return new ArticleResponseDto(article);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar artigo' })
  @ApiParam({
    name: 'id',
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Artigo deletado com sucesso',
    type: DeleteArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar este artigo',
  })
  @ApiResponse({ status: 404, description: 'Artigo não encontrado' })
  async deleteArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DeleteArticleResponseDto> {
    await this.deleteArticleUseCase.execute({
      id,
      authorId: req.user!.id,
    });

    return new DeleteArticleResponseDto({
      success: true,
      message: 'Artigo deletado com sucesso',
    });
  }
}
