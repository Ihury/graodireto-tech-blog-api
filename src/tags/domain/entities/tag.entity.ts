import { TagName, TagSlug } from '../value-objects';

export interface TagProps {
  slug: TagSlug;
  name: TagName;
  active: boolean;
  createdAt: Date;
}

export class Tag {
  private constructor(private readonly props: TagProps) {}

  static create(
    props: Omit<TagProps, 'slug' | 'createdAt'> & {
      slug?: TagSlug;
    },
  ): Tag {
    const now = new Date();

    // Se não foi fornecido um slug, gerar um baseado no nome
    const slug =
      props.slug ||
      TagSlug.create(
        props.name
          .getValue()
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
          .replace(/^-+|-+$/g, ''), // Remove hífens do início e fim
      );

    return new Tag({
      ...props,
      slug,
      createdAt: now,
    });
  }

  static reconstitute(props: TagProps): Tag {
    return new Tag(props);
  }

  // Getters
  getName(): TagName {
    return this.props.name;
  }

  getSlug(): TagSlug {
    return this.props.slug;
  }

  isActive(): boolean {
    return this.props.active;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
  activate(): void {
    this.props.active = true;
  }

  deactivate(): void {
    this.props.active = false;
  }

  toPlainObject() {
    return {
      slug: this.props.slug.getValue(),
      name: this.props.name.getValue(),
      active: this.props.active,
      created_at: this.props.createdAt,
    };
  }
}
