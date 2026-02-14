import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import * as fs from 'fs/promises';
import { join } from 'path';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  private fixUtf8(str: string): string {
    if (!str) return str;
    try {
      // First, check if it looks like mojibake (garbled text)
      // Common pattern for UTF-8 read as Latin-1: Ã followed by other chars, or lots of
      if (str.includes('Ã') || str.includes('ï¿½') || str.includes('')) {
        return Buffer.from(str, 'latin1').toString('utf8');
      }
      return str;
    } catch (e) {
      return str;
    }
  }

  async create(
    file: Express.Multer.File,
    createBookDto: CreateBookDto,
    user: any,
  ): Promise<Book> {
    // If title is provided, use it directly (NestJS DTOs usually handle UTF-8 well)
    // Only fix originalName if it comes from file header which might be latin1
    const originalName = this.fixUtf8(file.originalname);
    const title = createBookDto.title ? createBookDto.title : originalName;

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

  async findOne(id: string): Promise<BookDocument> {
    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async toggleFavorite(id: string, user: any): Promise<BookDocument> {
    const book = await this.findOne(id);
    if (book.owner?.toString() !== user.userId) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    book.isFavorite = !book.isFavorite;
    return book.save();
  }

  async updateProgress(
    id: string,
    updateProgressDto: UpdateProgressDto,
    user: any,
  ): Promise<BookDocument> {
    console.log(`Updating progress for book ${id}:`, updateProgressDto);
    const book = await this.findOne(id);
    if (book.owner?.toString() !== user.userId) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    book.progress = updateProgressDto.progress;
    book.lastLocation = updateProgressDto.lastLocation;
    return book.save();
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
