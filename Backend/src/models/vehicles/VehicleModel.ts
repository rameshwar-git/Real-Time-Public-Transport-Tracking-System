import {Schema, model} from 'mongoose';

const vehicleSchema = new Schema({
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    vehicleType: { type: String},
    vehicleModel: { type: String},
    vehicleNumber: { type: String, unique: true },
    capacity: { type: Number },
    availableSeats: { type: Number },
    color: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const VehicleModel = model('Vehicle', vehicleSchema);
export default VehicleModel;
