import { storage, BUCKET_ID, ID } from './appwrite'

export const imageService = {
    async uploadImage(imageUri) {
        try {
            const fileName = `listing_${Date.now()}.jpg`
            
            // Fetch the image as a blob
            const response = await fetch(imageUri)
            const blob = await response.blob()
            
            // Create FormData
            const formData = new FormData()
            formData.append('fileId', ID.unique())
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: fileName,
            })
            
            // Upload using Appwrite's direct endpoint
            const uploadedFile = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                {
                    uri: imageUri,
                    type: 'image/jpeg', 
                    name: fileName,
                }
            )
            
            // Return the file view URL
            const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id)
            return fileUrl.toString()
        } catch (error) {
            console.error('Error uploading image:', error)
            throw error
        }
    },

    async deleteImage(fileId) {
        try {
            await storage.deleteFile(BUCKET_ID, fileId)
        } catch (error) {
            console.error('Error deleting image:', error)
            throw error
        }
    }
}