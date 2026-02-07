import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  async create(
    file: Express.Multer.File,
    createBookDto: CreateBookDto,
  ): Promise<Book> {
    const newBook = new this.bookModel({
      title: createBookDto.title || file.originalname,
      originalName: file.originalname,
      path: file.filename, // Storing filename only, relative to uploads root
      mimeType: file.mimetype,
      format: this.detectFormat(file.originalname),
      size: file.size,
    });
    return newBook.save();
  }

  async findAll(): Promise<Book[]> {
    return this.bookModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);

    // 1. Remove from DB
    await this.bookModel.findByIdAndDelete(id).exec();

    // 2. Remove file from disk
    try {
      const filePath = join(__dirname, '..', '..', 'uploads', book.path);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file for book ${id}:`, error);
      // We don't throw here to ensure the API response is successful even if file cleanup fails (orphan file)
    }
  }

  private detectFormat(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || 'unknown';
  }
}
