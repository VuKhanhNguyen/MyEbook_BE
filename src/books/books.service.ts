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

  private fixUtf8(str: string): string {
    try {
      // Check if string is already valid UTF-8, if so return it.
      // This latin1->utf8 conversion is a heuristic for Multer/Busboy issues.
      return Buffer.from(str, 'latin1').toString('utf8');
    } catch (e) {
      return str;
    }
  }

  async create(
    file: Express.Multer.File,
    createBookDto: CreateBookDto,
    user: any,
  ): Promise<Book> {
    const originalName = this.fixUtf8(file.originalname);
    const title = createBookDto.title
      ? this.fixUtf8(createBookDto.title)
      : originalName;

    // Fallback: If title is empty/null, use originalName. If that's also empty (rare), use 'Untitled'
    const finalTitle =
      title && title.trim().length > 0 ? title : originalName || 'Untitled';

    const newBook = new this.bookModel({
      title: finalTitle,
      originalName,
      path: file.filename, // Storing filename only, relative to uploads root
      mimeType: file.mimetype,
      format: this.detectFormat(originalName),
      size: file.size,
      owner: user.userId,
    });
    return newBook.save();
  }

  async findAll(user: any): Promise<Book[]> {
    return this.bookModel
      .find({ owner: user.userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async remove(id: string, user: any): Promise<void> {
    const book = await this.findOne(id);

    if (book.owner?.toString() !== user.userId) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

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
