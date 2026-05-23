import mongoose from 'mongoose'

const SavedPropertySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    propertyId: { type: Number, required: true },
  },
  { timestamps: { createdAt: 'savedAt', updatedAt: false } }
)

SavedPropertySchema.index({ userId: 1, propertyId: 1 }, { unique: true })

export default mongoose.model('SavedProperty', SavedPropertySchema)
