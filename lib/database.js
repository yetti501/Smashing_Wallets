import {databases } from './appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_NOTES_ID

export const createNote = async (text, userId) => {
    try {
        const response = await databases.createDocument(
            DATABASE_ID, 
            COLLECTION_ID, 
            ID.unique(), 
            {
                text: text, 
                userId: userId
            }
        )
        return { success: true, data: response }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
