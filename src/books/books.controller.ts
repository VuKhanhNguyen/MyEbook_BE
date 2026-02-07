import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(epub|pdf|mobi|prc)$/)) {
          return cb(new Error('Only ebook files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(epub|pdf|mobi|prc)$/,
        })
        .addMaxSizeValidator({
          maxSize: 50 * 1024 * 1024, // 50MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body() createBookDto: CreateBookDto,
  ) {
    return this.booksService.create(file, createBookDto);
  }

  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
