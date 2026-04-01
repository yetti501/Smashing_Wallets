import { Client, Users, Databases, Storage, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    try {
        // The user's JWT or session is passed by Appwrite — get the userId from the request
        const userId = req.headers['x-appwrite-user-id'];

        if (!userId) {
            return res.json({ success: false, message: 'Unauthorized: no user session' }, 401);
        }

        // Initialize server-side client with API key
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const users = new Users(client);
        const databases = new Databases(client);
        const storage = new Storage(client);

        const databaseId = process.env.APPWRITE_DATABASE_ID;
        const listingsCollectionId = process.env.APPWRITE_COLLECTION_LISTINGS_ID;
        const savedEventsCollectionId = process.env.APPWRITE_COLLECTION_SAVED_EVENTS_ID;
        const bucketId = process.env.APPWRITE_BUCKET_ID;

        log(`Deleting account for user: ${userId}`);

        // 1. Delete user's listings and their associated images
        try {
            let offset = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
                const listings = await databases.listDocuments(databaseId, listingsCollectionId, [
                    Query.equal('userId', userId),
                    Query.limit(limit),
                    Query.offset(offset),
                ]);

                for (const listing of listings.documents) {
                    // Delete listing images from storage
                    const allImages = [...(listing.images || [])];
                    if (listing.image) allImages.push(listing.image);

                    for (const imageId of allImages) {
                        try {
                            await storage.deleteFile(bucketId, imageId);
                        } catch (e) {
                            log(`Could not delete image ${imageId}: ${e.message}`);
                        }
                    }

                    // Delete the listing document
                    await databases.deleteDocument(databaseId, listingsCollectionId, listing.$id);
                }

                hasMore = listings.documents.length === limit;
                offset += limit;
            }
            log(`Deleted user's listings`);
        } catch (e) {
            log(`Error deleting listings: ${e.message}`);
        }

        // 2. Delete user's saved events
        try {
            let offset = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
                const saved = await databases.listDocuments(databaseId, savedEventsCollectionId, [
                    Query.equal('userId', userId),
                    Query.limit(limit),
                    Query.offset(offset),
                ]);

                for (const doc of saved.documents) {
                    await databases.deleteDocument(databaseId, savedEventsCollectionId, doc.$id);
                }

                hasMore = saved.documents.length === limit;
                offset += limit;
            }
            log(`Deleted user's saved events`);
        } catch (e) {
            log(`Error deleting saved events: ${e.message}`);
        }

        // 3. Delete the user account
        await users.delete(userId);
        log(`User ${userId} deleted successfully`);

        return res.json({ success: true });
    } catch (err) {
        error(`Delete account failed: ${err.message}`);
        return res.json({ success: false, message: err.message }, 500);
    }
};
