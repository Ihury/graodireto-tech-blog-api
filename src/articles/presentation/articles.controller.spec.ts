import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ListArticlesUseCase } from '../application/use-cases/list-articles.use-case';
import { GetArticleByIdUseCase } from '../application/use-cases/get-article-by-id.use-case';
import { CreateArticleUseCase } from '../application/use-cases/create-article.use-case';
import { UpdateArticleUseCase } from '../application/use-cases/update-article.use-case';
import { DeleteArticleUseCase } from '../application/use-cases/delete-article.use-case';
import { ArticleRepositoryPort } from '../domain/ports/article.repository.port';
import {
  ArticleContent,
  ArticleSlug,
  ArticleTitle,
} from '../domain/value-objects';
import { ListArticlesDto } from './dto/list-articles.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from '../domain/entities/article.entity';
import { Uuid } from '@/common';
import { ValidateTokenUseCase } from '@/auth';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let listArticlesUseCase: jest.Mocked<ListArticlesUseCase>;
  let getArticleByIdUseCase: jest.Mocked<GetArticleByIdUseCase>;
  let createArticleUseCase: jest.Mocked<CreateArticleUseCase>;
  let updateArticleUseCase: jest.Mocked<UpdateArticleUseCase>;
  let deleteArticleUseCase: jest.Mocked<DeleteArticleUseCase>;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;
  let validateTokenUseCase: jest.Mocked<ValidateTokenUseCase>;

  const mockUserId = '3c1b4ab9-6965-4237-9847-e7d9dd83325f';

  const mockUser = {
    id: mockUserId,
    email: 'ihury@graodireto.com.br',
    displayName: 'Ihury Kewin',
    avatarUrl: undefined,
  };

  // Usando a classe Article para garantir que seja uma instância válida
  const createMockArticle = () => {
    return Article.create({
      authorId: Uuid.create(mockUserId),
      author: mockUser,
      title: ArticleTitle.create('A Revolução da Grão Direto no Agronegócio'),
      content: ArticleContent.create(
        'Conteúdo do artigo com pelo menos 50 caracteres para satisfazer a validação.',
      ),
      coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
      tags: [{ slug: 'grao-direto', name: 'Grão Direto' }],
    });
  };

  const mockArticle = createMockArticle();

  beforeEach(async () => {
    const mockListArticlesUseCase = { execute: jest.fn() };
    const mockGetArticleByIdUseCase = { execute: jest.fn() };
    const mockCreateArticleUseCase = { execute: jest.fn() };
    const mockUpdateArticleUseCase = { execute: jest.fn() };
    const mockDeleteArticleUseCase = { execute: jest.fn() };
    const mockArticleRepository = { findBySlug: jest.fn() };
    const mockValidateTokenUseCase = { execute: jest.fn() }; // Mocking ValidateTokenUseCase

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ListArticlesUseCase,
          useValue: mockListArticlesUseCase,
        },
        {
          provide: GetArticleByIdUseCase,
          useValue: mockGetArticleByIdUseCase,
        },
        {
          provide: CreateArticleUseCase,
          useValue: mockCreateArticleUseCase,
        },
        {
          provide: UpdateArticleUseCase,
          useValue: mockUpdateArticleUseCase,
        },
        {
          provide: DeleteArticleUseCase,
          useValue: mockDeleteArticleUseCase,
        },
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
        {
          provide: ValidateTokenUseCase,
          useValue: mockValidateTokenUseCase,
        },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
    listArticlesUseCase = module.get(ListArticlesUseCase);
    getArticleByIdUseCase = module.get(GetArticleByIdUseCase);
    createArticleUseCase = module.get(CreateArticleUseCase);
    updateArticleUseCase = module.get(UpdateArticleUseCase);
    deleteArticleUseCase = module.get(DeleteArticleUseCase);
    articleRepository = module.get(ArticleRepositoryPort);
    validateTokenUseCase = module.get(ValidateTokenUseCase);
  });

  describe('GET /articles', () => {
    const mockListResult = {
      data: [mockArticle], // mockArticle agora é uma instância de Article
      meta: {
        page: 1,
        size: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    it('deve listar artigos com sucesso', async () => {
      const query: ListArticlesDto = { page: 1, size: 10 };
      listArticlesUseCase.execute.mockResolvedValue(mockListResult);

      const result = await controller.listArticles(query);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(listArticlesUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: undefined,
        tags: undefined,
      });
    });

    it('deve listar artigos com filtros de busca', async () => {
      const query: ListArticlesDto = {
        page: 1,
        size: 10,
        search: 'Grão Direto',
        tags: ['grao-direto', 'tecnologia', 'agronegocio'],
      };
      listArticlesUseCase.execute.mockResolvedValue(mockListResult);

      const result = await controller.listArticles(query);

      expect(result).toBeDefined();
      expect(listArticlesUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'Grão Direto',
        tags: ['grao-direto', 'tecnologia', 'agronegocio'],
      });
    });
  });

  describe('GET /articles/slug/:slug', () => {
    it('deve obter artigo por slug com sucesso', async () => {
      const slug = 'a-revolucao-da-grao-direto-no-agronegocio';
      articleRepository.findBySlug.mockResolvedValue(mockArticle);

      const result = await controller.getArticleBySlug(slug);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockArticle.getId().getValue());
      expect(result.title).toBe('A Revolução da Grão Direto no Agronegócio');
      expect(articleRepository.findBySlug).toHaveBeenCalledWith(
        expect.any(ArticleSlug),
      );
    });

    it('deve lançar NotFoundException quando artigo não existe', async () => {
      const slug = 'artigo-inexistente';
      articleRepository.findBySlug.mockResolvedValue(null);

      await expect(controller.getArticleBySlug(slug)).rejects.toThrow(
        NotFoundException,
      );
      expect(articleRepository.findBySlug).toHaveBeenCalledWith(
        expect.any(ArticleSlug),
      );
    });
  });

  describe('POST /articles', () => {
    const mockRequest = { user: mockUser } as any;

    it('deve criar artigo com sucesso', async () => {
      const dto: CreateArticleDto = {
        title: 'Implementando CI/CD em Ambientes Ágeis',
        content:
          'A prática de integração contínua (CI) e entrega contínua (CD) tem se tornado essencial...',
        coverImageUrl: 'https://exemplo.com/cicd.jpg',
        tags: ['ci-cd', 'devops', 'agilidade'],
      };
      createArticleUseCase.execute.mockResolvedValue({ article: mockArticle });

      const result = await controller.createArticle(dto, mockRequest);

      expect(result).toBeDefined();
      expect(createArticleUseCase.execute).toHaveBeenCalledWith({
        authorId: mockUserId,
        title: 'Implementando CI/CD em Ambientes Ágeis',
        content:
          'A prática de integração contínua (CI) e entrega contínua (CD) tem se tornado essencial...',
        coverImageUrl: 'https://exemplo.com/cicd.jpg',
        tags: ['ci-cd', 'devops', 'agilidade'],
      });
    });
  });

  describe('PUT /articles/:id', () => {
    const mockRequest = { user: mockUser } as any;

    it('deve atualizar artigo com sucesso', async () => {
      const dto: UpdateArticleDto = {
        title: 'O Futuro do Agronegócio com a Grão Direto',
        content:
          'A Grão Direto continua a liderar a transformação digital no agronegócio brasileiro...',
      };
      updateArticleUseCase.execute.mockResolvedValue({ article: mockArticle });

      const result = await controller.updateArticle(
        mockArticle.getId().getValue(),
        dto,
        mockRequest,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockArticle.getId().getValue());
    });
  });

  describe('DELETE /articles/:id', () => {
    const mockRequest = { user: mockUser } as any;

    it('deve deletar artigo com sucesso', async () => {
      deleteArticleUseCase.execute.mockResolvedValue({ success: true });

      const result = await controller.deleteArticle(mockArticle.getId().getValue(), mockRequest);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Artigo deletado com sucesso');
    });
  });
});
