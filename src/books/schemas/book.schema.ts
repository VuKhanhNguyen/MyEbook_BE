import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop()
  originalName: string;

  @Prop()
  path: string;

  @Prop()
  mimeType: string;

  @Prop({ enum: ['epub', 'pdf', 'mobi', 'prc'] })
  format: string;

  @Prop()
  size: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);
