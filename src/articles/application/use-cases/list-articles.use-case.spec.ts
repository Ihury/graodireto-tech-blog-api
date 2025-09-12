import { Test, TestingModule } from '@nestjs/testing';
import { ListArticlesUseCase } from './list-articles.use-case';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../../domain/value-objects';
import { slugify } from '@/common/utils/slug.util';

// Mock do slugify
jest.mock('@/common/utils/slug.util', () => ({
  slugify: jest.fn(),
}));

describe('ListArticlesUseCase', () => {
  let useCase: ListArticlesUseCase;
  let articleRepository: jest.Mocked<ArticleRepositoryPort>;
  let mockSlugify: jest.MockedFunction<typeof slugify>;

  const mockUserId = '3c1b4ab9-6965-4237-9847-e7d9dd83325f';
  const mockArticleId = '346e9870-8248-41e5-89d4-c73725905d8d';

  // Função centralizada para criar artigos
  const createMockArticle = (title: string, id = mockArticleId) => {
    return Article.reconstitute({
      id: Uuid.create(id),
      authorId: Uuid.create(mockUserId),
      title: ArticleTitle.create(title),
      slug: ArticleSlug.create('artigo-valido'),
      summary: ArticleSummary.create(`Resumo de ${title}`),
      content: ArticleContent.create(
        `Conteúdo de ${title} com pelo menos 50 caracteres para satisfazer a validação.`,
      ),
      coverImageUrl: 'https://exemplo.com/imagem.jpg',
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: [
        { slug: 'grao-direto', name: 'Grão Direto' },
        { slug: 'tecnologia', name: 'tecnologia' },
      ],
    });
  };

  const mockArticles = [
    createMockArticle('A Revolução da Grão Direto no Agronegócio'),
    createMockArticle('Implementando CI/CD em Ambientes Ágeis'),
    createMockArticle(
      'A Importância de Bancos de Dados NoSQL em Sistemas Escaláveis',
    ),
  ];

  beforeEach(async () => {
    const mockArticleRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListArticlesUseCase,
        {
          provide: ArticleRepositoryPort,
          useValue: mockArticleRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListArticlesUseCase>(ListArticlesUseCase);
    articleRepository = module.get(ArticleRepositoryPort);
    mockSlugify = slugify as jest.MockedFunction<typeof slugify>;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockRepositoryResult = {
      articles: mockArticles,
      total: 3,
    };

    describe('paginação básica', () => {
      it('deve listar artigos com paginação padrão', async () => {
        const command = {};
        articleRepository.findMany.mockResolvedValue(mockRepositoryResult);

        const result = await useCase.execute(command);

        expect(result).toBeDefined();
        expect(result.data).toHaveLength(3);
        expect(result.meta.page).toBe(1);
        expect(result.meta.size).toBe(10);
        expect(result.meta.total).toBe(3);
        expect(result.meta.totalPages).toBe(1);
        expect(result.meta.hasNext).toBe(false);

        expect(articleRepository.findMany).toHaveBeenCalledWith(
          {},
          { limit: 10, offset: 0 },
        );
      });

      it('deve listar artigos com paginação personalizada', async () => {
        const command = { page: 2, size: 5 };
        articleRepository.findMany.mockResolvedValue(mockRepositoryResult);

        const result = await useCase.execute(command);

        expect(result.meta.page).toBe(2);
        expect(result.meta.size).toBe(5);
        expect(result.meta.totalPages).toBe(1);
        expect(articleRepository.findMany).toHaveBeenCalledWith(
          {},
          { limit: 5, offset: 5 },
        );
      });

      it('deve limitar size máximo a 50', async () => {
        const command = { page: 1, size: 100 };
        articleRepository.findMany.mockResolvedValue(mockRepositoryResult);

        const result = await useCase.execute(command);

        expect(result.meta.size).toBe(50);
        expect(articleRepository.findMany).toHaveBeenCalledWith(
          {},
          { limit: 50, offset: 0 },
        );
      });
    });

    describe('filtros de busca', () => {
      it('deve filtrar por termo de busca', async () => {
        const command = { search: 'Grão Direto' };
        mockSlugify.mockReturnValue('grao-direto');
        articleRepository.findMany.mockResolvedValue(mockRepositoryResult);

        const result = await useCase.execute(command);

        expect(result).toBeDefined();
        expect(mockSlugify).toHaveBeenCalledWith('Grão Direto');
        expect(articleRepository.findMany).toHaveBeenCalledWith(
          { slugSearch: 'grao-direto' },
          { limit: 10, offset: 0 },
        );
      });

      it('deve filtrar por tags', async () => {
        const command = { tags: ['grao-direto', 'tecnologia'] };
        articleRepository.findMany.mockResolvedValue(mockRepositoryResult);

        const result = await useCase.execute(command);

        expect(result).toBeDefined();
        expect(articleRepository.findMany).toHaveBeenCalledWith(
          { tagSlugs: ['grao-direto', 'tecnologia'] },
          { limit: 10, offset: 0 },
        );
      });

      it('deve combinar filtros de busca e tags', async () => {
        const command = {
          search: 'Grão Direto',
          tags: ['grao-direto', 'tecnologia'],
        };
        mockSlugify.mockReturnValue('grao-direto');
        articleRepository.findMany.mockResolvedValue(mockRepositoryResult);

        const result = await useCase.execute(command);

        expect(result).toBeDefined();
        expect(articleRepository.findMany).toHaveBeenCalledWith(
          {
            slugSearch: 'grao-direto',
            tagSlugs: ['grao-direto', 'tecnologia'],
          },
          { limit: 10, offset: 0 },
        );
      });
    });

    describe('diferentes cenários de resultado', () => {
      it('deve lidar com resultado vazio', async () => {
        const command = {};
        const emptyResult = { articles: [], total: 0 };
        articleRepository.findMany.mockResolvedValue(emptyResult);

        const result = await useCase.execute(command);

        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
        expect(result.meta.totalPages).toBe(0);
        expect(result.meta.hasNext).toBe(false);
      });

      it('deve calcular paginação corretamente para múltiplas páginas', async () => {
        const command = { page: 3, size: 2 };
        const largeResult = { articles: mockArticles.slice(0, 2), total: 10 };
        articleRepository.findMany.mockResolvedValue(largeResult);

        const result = await useCase.execute(command);

        expect(result.meta.page).toBe(3);
        expect(result.meta.size).toBe(2);
        expect(result.meta.total).toBe(10);
        expect(result.meta.totalPages).toBe(5);
        expect(result.meta.hasNext).toBe(true);
      });
    });

    describe('propagação de erros', () => {
      it('deve propagar erros do repositório', async () => {
        const command = {};
        const repositoryError = new Error('Erro do repositório');
        articleRepository.findMany.mockRejectedValue(repositoryError);

        await expect(useCase.execute(command)).rejects.toThrow(
          'Erro do repositório',
        );
      });
    });
  });
});
