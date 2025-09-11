import { ApiProperty } from '@nestjs/swagger';
import { CommentWithRepliesResponseDto } from './comment-response.dto';
import {
  CursorPaginatedResponseDto,
  CursorPaginationRequestDto,
} from '@/common/pagination';

export class ListCommentsDto extends CursorPaginationRequestDto {}

export class ListCommentsResponseDto extends CursorPaginatedResponseDto<CommentWithRepliesResponseDto> {
  @ApiProperty({
    description: 'Lista de comentários com preview de respostas',
    type: [CommentWithRepliesResponseDto],
  })
  declare data: CommentWithRepliesResponseDto[];
}
