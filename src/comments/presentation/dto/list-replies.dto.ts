import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';
import {
  CursorPaginatedResponseDto,
  CursorPaginationRequestDto,
} from '@/common/pagination';

export class ListRepliesDto extends CursorPaginationRequestDto {}

export class ListRepliesResponseDto extends CursorPaginatedResponseDto<CommentResponseDto> {
  @ApiProperty({
    description: 'Lista de respostas do comentário',
    type: [CommentResponseDto],
  })
  declare data: CommentResponseDto[];
}
