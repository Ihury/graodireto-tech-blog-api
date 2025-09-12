import { Article } from './article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../value-objects';

describe('Article Entity', () => {
  const createValidArticleProps = () => ({
    authorId: Uuid.create('3c1b4ab9-6965-4237-9847-e7d9dd83325f'),
    title: ArticleTitle.create('A Revolução da Grão Direto no Agronegócio'),
    content: ArticleContent.create(
      'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos. A plataforma utiliza algoritmos avançados para recomendar preços baseados em dados de mercado em tempo real.',
    ),
    coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
    tags: [
      { slug: 'grao-direto', name: 'Grão Direto' },
      { slug: 'tecnologia', name: 'tecnologia' },
      { slug: 'agronegocio', name: 'agronegócio' },
    ],
  });

  const createMockArticle = (
    title: string,
    id = '346e9870-8248-41e5-89d4-c73725905d8d',
  ) => {
    return Article.reconstitute({
      id: Uuid.create(id),
      authorId: Uuid.create('3c1b4ab9-6965-4237-9847-e7d9dd83325f'),
      title: ArticleTitle.create(title),
      slug: ArticleSlug.create('artigo-valido'),
      summary: ArticleSummary.create(`Resumo de ${title}`),
      content: ArticleContent.create(
        `Conteúdo de ${title} com pelo menos 50 caracteres para satisfazer a validação.`,
      ),
      coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: [
        { slug: 'grao-direto', name: 'Grão Direto' },
        { slug: 'tecnologia', name: 'tecnologia' },
      ],
    });
  };

  describe('create', () => {
    it('deve criar artigo com dados válidos', () => {
      const props = createValidArticleProps();

      const article = Article.create(props);

      expect(article.getTitle().getValue()).toBe(
        'A Revolução da Grão Direto no Agronegócio',
      );
      expect(article.getContent().getValue()).toContain(
        'A Grão Direto tem transformado',
      );
      expect(article.getAuthorId().getValue()).toBe(
        '3c1b4ab9-6965-4237-9847-e7d9dd83325f',
      );
      expect(article.getCoverImageUrl()).toBe(
        'https://exemplo.com/grao-direto.jpg',
      );
      expect(article.getId()).toBeDefined();
      expect(article.getCreatedAt()).toBeInstanceOf(Date);
      expect(article.getUpdatedAt()).toBeInstanceOf(Date);
      expect(article.isArticleDeleted()).toBe(false);
    });

    it('deve criar artigo sem campos opcionais', () => {
      const props = {
        authorId: Uuid.create('3c1b4ab9-6965-4237-9847-e7d9dd83325f'),
        title: ArticleTitle.create('Implementando CI/CD em Ambientes Ágeis'),
        content: ArticleContent.create(
          'A prática de integração contínua (CI) e entrega contínua (CD) tem se tornado essencial no desenvolvimento de software moderno.',
        ),
      };

      const article = Article.create(props);

      expect(article.getTitle().getValue()).toBe(
        'Implementando CI/CD em Ambientes Ágeis',
      );
      expect(article.getCoverImageUrl()).toBeUndefined();
      expect(article.getTags()).toEqual([]);
      expect(article.getSummary()).toBeDefined();
    });

    it('deve gerar slug automaticamente baseado no título', () => {
      const props = createValidArticleProps();

      const article = Article.create(props);

      expect(article.getSlug().getValue()).toBe(
        'a-revolucao-da-grao-direto-no-agronegocio',
      );
    });

    it('deve gerar summary automaticamente baseado no conteúdo', () => {
      const props = createValidArticleProps();

      const article = Article.create(props);

      expect(article.getSummary()).toBeDefined();
      expect(article.getSummary()?.getValue()?.length).toBeLessThanOrEqual(280);
      expect(article.getSummary()?.getValue()).toContain(
        'A Grão Direto tem transformado',
      );
    });

    it('deve usar slug customizado quando fornecido', () => {
      const props = {
        ...createValidArticleProps(),
        slug: ArticleSlug.create('slug-customizado'),
      };

      const article = Article.create(props);

      expect(article.getSlug().getValue()).toBe('slug-customizado');
    });

    it('deve usar summary customizado quando fornecido', () => {
      const props = {
        ...createValidArticleProps(),
        summary: ArticleSummary.create(
          'Resumo customizado do artigo sobre Grão Direto.',
        ),
      };

      const article = Article.create(props);

      expect(article.getSummary()!.getValue()).toBe(
        'Resumo customizado do artigo sobre Grão Direto.',
      );
    });
  });

  describe('reconstitute', () => {
    it('deve reconstituir artigo com todos os dados', () => {
      const props = {
        id: Uuid.create('346e9870-8248-41e5-89d4-c73725905d8d'),
        authorId: Uuid.create('3c1b4ab9-6965-4237-9847-e7d9dd83325f'),
        author: {
          id: '3c1b4ab9-6965-4237-9847-e7d9dd83325f',
          email: 'ihury@graodireto.com.br',
          displayName: 'Ihury Kewin',
          avatarUrl: 'https://exemplo.com/avatar.jpg',
        },
        title: ArticleTitle.create('A Revolução da Grão Direto no Agronegócio'),
        slug: ArticleSlug.create('a-revolucao-da-grao-direto-no-agronegocio'),
        summary: ArticleSummary.create(
          'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos.',
        ),
        content: ArticleContent.create(
          'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos. A plataforma utiliza algoritmos avançados para recomendar preços baseados em dados de mercado em tempo real.',
        ),
        coverImageUrl: 'https://exemplo.com/grao-direto.jpg',
        isDeleted: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        tags: [
          { slug: 'grao-direto', name: 'Grão Direto' },
          { slug: 'tecnologia', name: 'tecnologia' },
          { slug: 'agronegocio', name: 'agronegócio' },
        ],
      };

      const article = Article.reconstitute(props);

      expect(article.getId().getValue()).toBe(
        '346e9870-8248-41e5-89d4-c73725905d8d',
      );
      expect(article.getAuthorId().getValue()).toBe(
        '3c1b4ab9-6965-4237-9847-e7d9dd83325f',
      );
      expect(article.getAuthor()!.id).toBe(
        '3c1b4ab9-6965-4237-9847-e7d9dd83325f',
      );
      expect(article.getTitle().getValue()).toBe(
        'A Revolução da Grão Direto no Agronegócio',
      );
      expect(article.getSlug().getValue()).toBe(
        'a-revolucao-da-grao-direto-no-agronegocio',
      );
      expect(article.getSummary()!.getValue()).toBe(
        'A Grão Direto tem transformado o setor agrícola ao introduzir tecnologia de ponta para conectar produtores e compradores de grãos.',
      );
      expect(article.getContent().getValue()).toContain(
        'A Grão Direto tem transformado',
      );
      expect(article.getCoverImageUrl()).toBe(
        'https://exemplo.com/grao-direto.jpg',
      );
      expect(article.getTags()).toHaveLength(3);
      expect(article.isArticleDeleted()).toBe(false);
      expect(article.getCreatedAt()).toEqual(new Date('2023-01-01'));
      expect(article.getUpdatedAt()).toEqual(new Date('2023-01-01'));
    });
  });

  describe('business methods', () => {
    let article: Article;

    beforeEach(() => {
      article = Article.create(createValidArticleProps());
    });

    describe('updateTitle', () => {
      it('deve atualizar título e timestamp', async () => {
        const newTitle = ArticleTitle.create(
          'O Futuro do Agronegócio com a Grão Direto',
        );
        const originalUpdatedAt = article.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5));

        article.updateTitle(newTitle);

        expect(article.getTitle().getValue()).toBe(
          'O Futuro do Agronegócio com a Grão Direto',
        );
        expect(article.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('updateContent', () => {
      it('deve atualizar conteúdo e timestamp', async () => {
        const newContent = ArticleContent.create(
          'A Grão Direto continua a liderar a transformação digital no agronegócio brasileiro.',
        );
        const originalUpdatedAt = article.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5));

        article.updateContent(newContent);

        expect(article.getContent().getValue()).toContain(
          'A Grão Direto continua a liderar',
        );
        expect(article.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('updateSummary', () => {
      it('deve atualizar summary e timestamp', async () => {
        const newSummary = ArticleSummary.create(
          'A Grão Direto continua a liderar a transformação digital no agronegócio brasileiro.',
        );
        const originalUpdatedAt = article.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5));

        article.updateSummary(newSummary);

        expect(article.getSummary()!.getValue()).toBe(
          'A Grão Direto continua a liderar a transformação digital no agronegócio brasileiro.',
        );
        expect(article.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('updateCoverImage', () => {
      it('deve atualizar cover image e timestamp', async () => {
        const newImageUrl = 'https://exemplo.com/nova-imagem.jpg';
        const originalUpdatedAt = article.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5));

        article.updateCoverImage(newImageUrl);

        expect(article.getCoverImageUrl()).toBe(
          'https://exemplo.com/nova-imagem.jpg',
        );
        expect(article.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('updateTags', () => {
      it('deve atualizar tags e timestamp', async () => {
        const newTags = [
          { slug: 'grao-direto', name: 'Grão Direto' },
          { slug: 'inovacao', name: 'inovação' },
          { slug: 'agronegocio', name: 'agronegócio' },
        ];
        const originalUpdatedAt = article.getUpdatedAt();

        await new Promise((resolve) => setTimeout(resolve, 5));

        article.updateTags(newTags);

        expect(article.getTags()).toHaveLength(3);
        expect(article.getTags()).toEqual(newTags);
        expect(article.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });
  });
});
