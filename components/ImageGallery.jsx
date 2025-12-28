import { useState, useRef } from 'react'
import { 
    View, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    Dimensions,
    ScrollView,
    Text,
    Modal,
    StatusBar,
    ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '../constants/Colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

/**
 * ImageGallery - Swipeable image gallery with fullscreen modal
 * 
 * @param {Array} images - Array of image URLs
 * @param {string} placeholderIcon - Icon to show when no images (Ionicons name)
 * @param {number} height - Height of the gallery container
 */
const ImageGallery = ({ 
    images = [], 
    placeholderIcon = 'calendar-outline',
    height = 300 
}) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalIndex, setModalIndex] = useState(0)
    const [imageLoading, setImageLoading] = useState({})
    const scrollViewRef = useRef(null)
    const modalScrollRef = useRef(null)

    // Handle scroll end to update active index
    const handleScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x
        const index = Math.round(contentOffset / SCREEN_WIDTH)
        setActiveIndex(index)
    }

    // Handle modal scroll
    const handleModalScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x
        const index = Math.round(contentOffset / SCREEN_WIDTH)
        setModalIndex(index)
    }

    // Open fullscreen modal
    const openModal = (index) => {
        setModalIndex(index)
        setModalVisible(true)
        // Scroll to the correct image in modal after it opens
        setTimeout(() => {
            modalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false })
        }, 100)
    }

    // Close modal
    const closeModal = () => {
        setModalVisible(false)
    }

    // Track image loading state
    const handleImageLoadStart = (index) => {
        setImageLoading(prev => ({ ...prev, [index]: true }))
    }

    const handleImageLoadEnd = (index) => {
        setImageLoading(prev => ({ ...prev, [index]: false }))
    }

    // No images - show placeholder
    if (!images || images.length === 0) {
        return (
            <View style={[styles.container, { height }]}>
                <View style={styles.placeholder}>
                    <Ionicons 
                        name={placeholderIcon} 
                        size={80} 
                        color={COLORS.textTertiary} 
                    />
                </View>
            </View>
        )
    }

    // Single image - simple display
    if (images.length === 1) {
        return (
            <View style={[styles.container, { height }]}>
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => openModal(0)}
                    style={styles.imageWrapper}
                >
                    {imageLoading[0] && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator color={COLORS.primary} />
                        </View>
                    )}
                    <Image
                        source={{ uri: images[0] }}
                        style={styles.image}
                        resizeMode="cover"
                        onLoadStart={() => handleImageLoadStart(0)}
                        onLoadEnd={() => handleImageLoadEnd(0)}
                    />
                </TouchableOpacity>

                {/* Fullscreen Modal */}
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalContainer}>
                        <StatusBar barStyle="light-content" />
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={closeModal}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: images[0] }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                    </View>
                </Modal>
            </View>
        )
    }

    // Multiple images - swipeable gallery
    return (
        <View style={[styles.container, { height }]}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
            >
                {images.map((imageUrl, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.9}
                        onPress={() => openModal(index)}
                        style={[styles.imageWrapper, { width: SCREEN_WIDTH }]}
                    >
                        {imageLoading[index] && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator color={COLORS.primary} />
                            </View>
                        )}
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="cover"
                            onLoadStart={() => handleImageLoadStart(index)}
                            onLoadEnd={() => handleImageLoadEnd(index)}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {images.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            activeIndex === index && styles.dotActive
                        ]}
                    />
                ))}
            </View>

            {/* Image Counter */}
            <View style={styles.counter}>
                <Text style={styles.counterText}>
                    {activeIndex + 1} / {images.length}
                </Text>
            </View>

            {/* Fullscreen Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <StatusBar barStyle="light-content" />
                    
                    {/* Close Button */}
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={closeModal}
                    >
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Modal Counter */}
                    <View style={styles.modalCounter}>
                        <Text style={styles.modalCounterText}>
                            {modalIndex + 1} / {images.length}
                        </Text>
                    </View>

                    {/* Swipeable Images */}
                    <ScrollView
                        ref={modalScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleModalScroll}
                        style={styles.modalScrollView}
                    >
                        {images.map((imageUrl, index) => (
                            <View key={index} style={styles.modalImageWrapper}>
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    )
}

export default ImageGallery

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: COLORS.surfaceSecondary,
    },
    imageWrapper: {
        width: SCREEN_WIDTH,
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceSecondary,
        zIndex: 1,
    },
    pagination: {
        position: 'absolute',
        bottom: SPACING.lg,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    counter: {
        position: 'absolute',
        bottom: SPACING.lg,
        right: SPACING.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
    },
    counterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: SPACING.lg,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCounter: {
        position: 'absolute',
        top: 50,
        left: SPACING.lg,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.sm,
    },
    modalCounterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalScrollView: {
        flex: 1,
    },
    modalImageWrapper: {
        width: SCREEN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: SCREEN_WIDTH,
        height: '80%',
    },
})