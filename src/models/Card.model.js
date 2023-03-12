import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb';

// Define Board collection schema
const cardCollectionName = 'Cards';
const CardSchema = Joi.object({
   boardId: Joi.string().required(), // also ObjectId when create new
   columnId: Joi.string().required(), // also ObjectId when create new
   title: Joi.string().required().min(3).max(40).trim(),
   cover: Joi.string().default(''),
   createdAt: Joi.date().timestamp().default(Date.now()),
   updatedAt: Joi.date().timestamp().default(null),
   _destroy: Joi.boolean().default(false),
});

const validateSchema = async data => {
   return await CardSchema.validateAsync(data, { abortEarly: false }); // abortEarly: false to return all errors
};

const createNew = async data => {
   try {
      const value = await validateSchema(data);

      const newValue = {
         ...value,
         boardId: new ObjectId(value.boardId), // Chuyển đổi boardId từ String sang ObjectId
         columnId: new ObjectId(value.columnId), // Chuyển đổi columnId từ String sang ObjectId
      };
      const result = await getDB()
         .collection(cardCollectionName)
         .insertOne(newValue);

      if (result.acknowledged) {
         return await getDB()
            .collection(cardCollectionName)
            .findOne({ _id: result.insertedId });
      }
   } catch (err) {
      throw new Error(err);
   }
};

/**
 * @param {Array of string card id} ids
 */
const updateMany = async ids => {
   try {
      const transformIds = ids.map(id => new ObjectId(id));
      const result = await getDB()
         .collection(cardCollectionName)
         .updateMany(
            {
               _id: { $in: transformIds },
            },
            { $set: { _destroy: true } }
         );

      return result;
   } catch (err) {
      throw new Error(err);
   }
};

export const CardModel = { createNew, updateMany };
