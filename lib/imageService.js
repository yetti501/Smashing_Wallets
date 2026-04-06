import { storage, BUCKET_ID, ID } from './appwrite'
import config from './config'

export const imageService = {
    /**
     * Upload a single image to Appwrite storage using the SDK
     * @param {string} imageUri - Local URI of the image
     * @returns {Promise<{url: string, fileId: string}>} - URL and file ID
     */
    async uploadImage(imageUri) {
        const fileName = `listing_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
        const fileId = ID.unique()

        // Create FormData with the file
        const formData = new FormData()
        formData.append('fileId', fileId)
        formData.append('file', {
            uri: imageUri,
            name: fileName,
            type: 'image/jpeg',
        })
        formData.append('permissions[]', 'read("any")')

        const endpoint = config.appwrite.endpoint
        const projectId = config.appwrite.projectId

        // Upload using fetch with cookie-based session auth (no JWT)
        const response = await fetch(
            `${endpoint}/storage/buckets/${BUCKET_ID}/files`,
            {
                method: 'POST',
                headers: {
                    'X-Appwrite-Project': projectId,
                },
                body: formData,
                credentials: 'include',
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `Upload failed with status ${response.status}`
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.message || errorMessage
            } catch {
                errorMessage = `Status ${response.status}: ${errorText.substring(0, 200)}`
            }
            throw new Error(errorMessage)
        }

        const uploadedFile = await response.json()

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