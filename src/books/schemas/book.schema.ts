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

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ default: 0 })
  progress: number;

  @Prop()
  lastLocation: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;
}

// Configure JSON transformation
export const BookSchema = SchemaFactory.createForClass(Book);

BookSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
