import { Schema, model } from 'mongoose';
import { SavedPlace } from '@/models/interfaces/savedPlaceModel';

const savedPlaceSchema = new Schema<SavedPlace>({
    userId: { type: Schema.Types.ObjectId, ref: 'Passenger', required: true },
    label: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const SavedPlaceModel = model<SavedPlace>('SavedPlace', savedPlaceSchema);
export default SavedPlaceModel;
