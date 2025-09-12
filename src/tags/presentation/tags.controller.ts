import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListTagsUseCase } from '../application/use-cases/list-tags.use-case';
import { TagMapper } from '../application/mappers/tag.mapper';
import { ListTagsResponseDto } from './dto/tag-response.dto';
import { AuthGuard } from '@/auth';

@ApiTags('tags')
@Controller('tags')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class TagsController {
  constructor(private readonly listTagsUseCase: ListTagsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as tags disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tags retornada com sucesso',
    type: ListTagsResponseDto,
  })
  async listTags(): Promise<ListTagsResponseDto> {
    const result = await this.listTagsUseCase.execute();

    const tags = TagMapper.toListResponse(result.tags);

    return new ListTagsResponseDto({
      tags,
      total: result.total,
    });
  }
}
