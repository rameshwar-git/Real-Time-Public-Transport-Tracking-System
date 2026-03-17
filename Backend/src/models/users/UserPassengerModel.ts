import {Schema, model} from 'mongoose';
import { users } from '@/models/interfaces/usersModel';

const passengerSchema = new Schema<users>({
    name: {type: String, required: true},
    dob: {type: Date, required: true},
    gender: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    phone: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    locationId: { type: Schema.Types.ObjectId, required: true },
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    status: {type: String, default:"OFFLINE"},
    lastSeen: { type: Date, default: Date.now},
});
const PassengerModel = model<users>('Passenger', passengerSchema);
export default PassengerModel;