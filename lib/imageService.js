import { storage, BUCKET_ID, ID, account } from './appwrite'
import config from './config'

export const imageService = {
    /**
     * Upload a single image to Appwrite storage using fetch (React Native compatible)
     * @param {string} imageUri - Local URI of the image
     * @returns {Promise<{url: string, fileId: string}>} - URL and file ID
     */
    async uploadImage(imageUri) {
        const fileName = `listing_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
        const fileId = ID.unique()

        // Get JWT for authentication — required for upload
        let jwt = null
        try {
            const jwtResponse = await account.createJWT()
            jwt = jwtResponse.jwt
        } catch (jwtError) {
            console.error('JWT creation failed:', jwtError.message)
            throw new Error('Authentication required to upload images. Please log in again.')
        }

        // Create FormData with the file
        const formData = new FormData()
        formData.append('fileId', fileId)
        formData.append('file', {
            uri: imageUri,
            name: fileName,
            type: 'image/jpeg',
        })
        // Allow anyone to read the file (listings are public)
        formData.append('permissions[]', 'read("any")')

        // Get the Appwrite endpoint and project ID from config
        const endpoint = config.appwrite.endpoint
        const projectId = config.appwrite.projectId

        console.log('Uploading file:', fileName, 'to bucket:', BUCKET_ID)

        // Upload using fetch directly (React Native compatible)
        const response = await fetch(
            `${endpoint}/storage/buckets/${BUCKET_ID}/files`,
            {
                method: 'POST',
                headers: {
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-JWT': jwt,
                },
                body: formData,
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Upload response error:', response.status, errorText)
            let errorMessage = `Upload failed with status ${response.status}`
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.message || errorMessage
            } catch {
                // Use default error message
            }
            throw new Error(errorMessage)
        }

        const uploadedFile = await response.json()
        console.log('Upload successful:', uploadedFile.$id)

        // Get the file view URL
        const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id)

        return {
            url: fileUrl.toString(),
            fileId: uploadedFile.$id
        }
    },

    /**
     * Upload multiple images
     * @param {string[]} imageUris - Array of local image URIs
     * @param {function} onProgress - Progress callback (current, total)
     * @returns {Promise<{urls: string[], fileIds: string[]}>}
     */
    async uploadMultipleImages(imageUris, onProgress = null) {
        const results = {
            urls: [],
            fileIds: []
        }

        const errors = []

        for (let i = 0; i < imageUris.length; i++) {
            try {
                const result = await this.uploadImage(imageUris[i])
                results.urls.push(result.url)
                results.fileIds.push(result.fileId)

                if (onProgress) {
                    onProgress(i + 1, imageUris.length)
                }
            } catch (error) {
                console.error(`Failed to upload image ${i + 1}:`, error)
                errors.push(error)
            }
        }

        // If ALL uploads failed, throw so the caller knows
        if (errors.length > 0 && results.urls.length === 0) {
            throw new Error(errors[0].message || 'All image uploads failed')
        }

        return results
    },

    /**
     * Delete an image from storage
     * @param {string} fileId - The file ID to delete
     */
    async deleteImage(fileId) {
        try {
            await storage.deleteFile(BUCKET_ID, fileId)
            return true
        } catch (error) {
            console.error('Error deleting image:', error)
            throw error
        }
    },

    /**
     * Delete multiple images
     * @param {string[]} fileIds - Array of file IDs to delete
     */
    async deleteMultipleImages(fileIds) {
        const results = {
            deleted: [],
            failed: []
        }

        for (const fileId of fileIds) {
            try {
                await this.deleteImage(fileId)
                results.deleted.push(fileId)
            } catch (error) {
                results.failed.push(fileId)
            }
        }

        return results
    },

    /**
     * Get a file preview URL with specific dimensions
     * @param {string} fileId - The file ID
     * @param {number} width - Desired width
     * @param {number} height - Desired height
     */
    getPreviewUrl(fileId, width = 400, height = 400) {
        try {
            const previewUrl = storage.getFilePreview(
                BUCKET_ID,
                fileId,
                width,
                height
            )
            return previewUrl.toString()
        } catch (error) {
            console.error('Error getting preview URL:', error)
            return null
        }
    },

    /**
     * Extract file ID from Appwrite URL
     * @param {string} url - Full Appwrite file URL
     * @returns {string|null} - File ID or null
     */
    extractFileIdFromUrl(url) {
        try {
            // Appwrite URLs look like: .../files/{fileId}/view
            const matches = url.match(/\/files\/([^/]+)\//)
            return matches ? matches[1] : null
        } catch (error) {
            return null
        }
    }
}