import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;
}

export const BookSchema = SchemaFactory.createForClass(Book);
