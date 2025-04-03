import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image as RNImage,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Tag,
  Package,
  Clock,
  Edit,
  ShoppingCart,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  AlertCircle,
} from "lucide-react-native";
import { getProductById, updateProduct } from "../../services/productService";
import { supabase } from "../../lib/supabase";
import { debugImageData } from "../../utils/imageUtils";
import SafeImage from "../../components/SafeImage";
import OptimizedImage from "../../components/OptimizedImage";
import LazyImageCarousel from "../../components/LazyImageCarousel";

import Header from "../../components/Header";
import Notification from "../../components/Notification";

interface Image {
  base64?: string;
  uri?: string;
}

export default function ProductViewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  
  // Image carousel state
  const [images, setImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Status management
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable">("Available");
  const [currentCustomer, setCurrentCustomer] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info" | "warning"
  });

  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [isRentalHistoryLoading, setIsRentalHistoryLoading] = useState(true);

  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const productData = await getProductById(id);
      
      if (!productData) {
        setError("Product not found");
        return;
      }
      
      setProduct(productData);
      setCurrentStatus(productData.status as "Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable");
      
      // Set customer details if product is rented or sold
      if ((productData.status === "Rented" || productData.status === "Sold") && productData.customer_name) {
        setCurrentCustomer(productData.customer_name);
        setCustomerEmail(productData.customer_email || "");
        setCustomerPhone(productData.customer_phone || "");
      }
      
      // Debug product image data
      console.log('Primary image URL:', debugImageData(productData.primary_image_url));
      if (productData.image_urls && Array.isArray(productData.image_urls)) {
        console.log(`Product has ${productData.image_urls.length} additional images`);
        productData.image_urls.forEach((url: string, index: number) => {
          console.log(`Image ${index + 1}:`, debugImageData(url));
        });
      }
      
      // Parse images from JSON string
      try {
        // Use type assertion to access potentially non-existent property
        const anyProductData = productData as any;
        if (anyProductData.images) {
          const parsedImages = JSON.parse(anyProductData.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            // Ensure all images have valid base64 data
            const validImages = parsedImages.filter(img => img && img.base64);
            setImages(validImages);
          } else {
            setImages([]);
          }
        } else if (productData.primary_image_url) {
          // Handle modern image storage format with primary_image_url
          const images: Image[] = [];
          
          // Check if it's a base64 data URL or a regular URL
          if (productData.primary_image_url.startsWith('data:image')) {
            const match = productData.primary_image_url.match(/base64,(.+)/);
            if (match && match[1]) {
              images.push({ base64: match[1] });
            }
          } else {
            // It's a regular URL
            images.push({ uri: productData.primary_image_url });
          }
          
          // Add additional images if available (skipping the primary image)
          if (productData.image_urls && Array.isArray(productData.image_urls)) {
            // Skip first image if it matches the primary_image_url to avoid duplicates
            const additionalImages = productData.image_urls.filter(url => url !== productData.primary_image_url);
            
            additionalImages.forEach((url: string) => {
              if (url.startsWith('data:image')) {
                const match = url.match(/base64,(.+)/);
                if (match && match[1]) {
                  images.push({ base64: match[1] });
                }
              } else {
                // It's a regular URL
                images.push({ uri: url });
              }
            });
          }
          
          setImages(images);
        } else {
          setImages([]);
        }
      } catch (err) {
        console.error("Error parsing images:", err);
        setImages([]);
      }
      
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalHistory = async () => {
    if (!id) return;
    
    try {
      setIsRentalHistoryLoading(true);
      // Fetch rental history for this product from orders table
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          start_date,
          end_date,
          return_date,
          total_amount,
          status,
          payment_status,
          created_at
        `)
        .ilike('items', `%${id}%`)
        .eq('order_type', 'rental')
        .order('created_at', { ascending: false })
        .limit(3); // Limit to 3 most recent rentals
      
      if (error) {
        console.error("Error fetching rental history:", error);
        return;
      }
      
      setRentalHistory(data || []);
    } catch (err) {
      console.error("Error in rental history fetch:", err);
    } finally {
      setIsRentalHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchRentalHistory();
  }, [id]);

  // Add useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will run when the screen is focused (including after navigating back)
      fetchProduct();
      fetchRentalHistory();
      return () => {
        // Optional cleanup
      };
    }, [id])
  );

  const handleEditProduct = () => {
    if (id) {
      router.push(`/products/add?id=${id}`);
    }
  };

  const handleRentProduct = () => {
    if (!product) return;
    router.push(`/orders/add?productId=${product.id}&type=rental`);
  };
  
  const handleSellProduct = () => {
    if (!product) return;
    router.push(`/orders/add?productId=${product.id}&type=sale`);
  };

  const updateProductStatus = async (newStatus: "Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable") => {
    try {
      // Only update the status field, not trying to update customer fields
      const updates = { status: newStatus };
      
      // Update the status in the database
      const updatedProduct = await updateProduct(id as string, updates);
      
      if (updatedProduct) {
        // Update local state immediately
        setCurrentStatus(newStatus);
        setProduct({
          ...product, 
          status: newStatus
        });
        setShowStatusModal(false);
        
        // Optionally show a success notification
        setNotification({
          visible: true,
          message: `Product status updated to ${newStatus}`,
          type: "success"
        });
        
        // Refresh data after status change
        setTimeout(() => {
          fetchProduct();
        }, 300);
      } else {
        setNotification({
          visible: true,
          message: "Failed to update product status",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      setNotification({
        visible: true,
        message: `Failed to update product status: ${error instanceof Error ? error.message : String(error)}`,
        type: "error"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Rented":
        return "bg-blue-100 text-blue-800";
      case "Sold":
        return "bg-purple-100 text-purple-800";
      case "Maintenance":
        return "bg-orange-100 text-orange-800";
      case "Unavailable":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Replace the rental history section with this improved version
  const renderRentalHistory = () => {
    if (isRentalHistoryLoading) {
      return (
        <View className="items-center justify-center py-4">
          <ActivityIndicator size="small" color="#0000ff" />
          <Text className="text-gray-500 mt-2">Loading rental history...</Text>
        </View>
      );
    }

    if (!rentalHistory || rentalHistory.length === 0) {
      return (
        <View className="items-center justify-center py-6 bg-gray-50 rounded-lg">
          <Calendar size={30} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">No rental history available</Text>
        </View>
      );
    }

    return (
      <View>
        {rentalHistory.map((rental, index) => {
          // Format dates for display
          const startDate = rental.start_date ? formatDate(rental.start_date) : 'N/A';
          const endDate = rental.end_date ? formatDate(rental.end_date) : 'N/A';
          
          return (
            <TouchableOpacity
              key={rental.id}
              className="mb-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100"
              onPress={() => router.push(`/orders/view?id=${rental.id}`)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-2">
                <User size={16} color="#6B7280" className="mr-2" />
                <Text className="font-medium text-gray-900 flex-1" numberOfLines={1} ellipsizeMode="tail">
                  {rental.customer_name}
                </Text>
                <View className={`px-2 py-1 rounded-full ${
                  rental.status === 'Active' ? 'bg-green-100 text-green-800' : 
                  rental.status === 'Returned' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  <Text className="text-xs font-medium">{rental.status}</Text>
                  </View>
              </View>
              
              <View className="flex-row items-center mb-1">
                <Calendar size={14} color="#6B7280" className="mr-2" />
                <Text className="text-gray-700 text-sm">
                  {startDate} - {endDate}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center mt-2">
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500">
                    {new Date(rental.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <ChevronRight size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // When opening the status modal, set initial values based on current product state
  const handleOpenStatusModal = () => {
    if (product) {
      setCurrentStatus(product.status as "Available" | "Rented" | "Sold" | "Maintenance" | "Unavailable");
      
      if ((product.status === "Rented" || product.status === "Sold") && product.customer_name) {
        setCurrentCustomer(product.customer_name);
        setCustomerEmail(product.customer_email || "");
        setCustomerPhone(product.customer_phone || "");
      } else {
        // Reset customer fields if product is not rented or sold
        setCurrentCustomer("");
        setCustomerEmail("");
        setCustomerPhone("");
      }
    }
    
    setShowStatusModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Loading product details...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <AlertCircle size={48} color="#EF4444" />
        <Text className="mt-4 text-red-500">{error || "Product not found"}</Text>
        <TouchableOpacity 
          className="mt-6 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse specifications if present
  const specifications = product.specifications ? 
    JSON.parse(product.specifications) : 
    [];

  // Format rental and sales information
  const isForRent = product.product_type === 'rental' || product.product_type === 'both';
  const isForSale = product.product_type === 'sale' || product.product_type === 'both';

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Product Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Product Image Carousel */}
          <View className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden">
            {images.length > 0 ? (
              <LazyImageCarousel
                images={images}
                height={256}
                showIndicators={true}
                onImageChange={(index) => setCurrentImageIndex(index)}
                  resizeMode="cover"
                />
            ) : (
              <View className="w-full h-64 bg-gray-200 items-center justify-center">
                <Package size={64} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">No image available</Text>
              </View>
            )}
          </View>

          {/* Product Info Card */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {product.name}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Package size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">{product.category}</Text>
                </View>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${getStatusColor(product.status)}`}
              >
                <Text className="text-xs font-medium">{product.status}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-4">
              {isForRent && (
              <View className="items-center flex-1 bg-blue-50 p-3 rounded-xl mr-2">
                <Text className="text-gray-600 text-sm mb-1 font-medium">
                  Rental Price
                </Text>
                <Text className="text-xl font-bold text-blue-600">
                    ₹{product.rental_price}/day
                  </Text>
                </View>
              )}
              
              {isForSale && (
                <View className="items-center flex-1 bg-purple-50 p-3 rounded-xl mr-2">
                  <Text className="text-gray-600 text-sm mb-1 font-medium">
                    Selling Price
                  </Text>
                  <Text className="text-xl font-bold text-purple-600">
                    ₹{product.selling_price}
                </Text>
              </View>
              )}
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-row items-center bg-blue-50 px-4 py-2.5 rounded-xl w-full"
                onPress={handleEditProduct}
              >
                <Edit size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-5">
            {(product.status === "Available" && isForRent) && (
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center mr-2"
                onPress={handleRentProduct}
              >
                <ShoppingCart size={20} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">Rent Now</Text>
              </TouchableOpacity>
            )}
            
            {(product.status === "Available" && isForSale) && (
              <TouchableOpacity
                className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center mr-2"
                onPress={handleSellProduct}
              >
                <ShoppingBag size={20} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">Buy Now</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              className="flex-1 bg-amber-500 py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => handleOpenStatusModal()}
              activeOpacity={0.7}
            >
              <Clock size={20} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Change Status</Text>
            </TouchableOpacity>
          </View>

          {/* Status Change Modal */}
          {showStatusModal && (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-50 items-center justify-center">
              <View className="bg-white p-5 rounded-xl w-4/5 shadow-lg">
                <Text className="text-xl font-bold mb-4 text-center">
                  Change Status
                </Text>

                <TouchableOpacity
                  className={`p-3 rounded-lg mb-2 ${currentStatus === "Available" ? "bg-green-100 border border-green-500" : "bg-gray-100"}`}
                  onPress={() => setCurrentStatus("Available")}
                >
                  <Text
                    className={`font-medium ${currentStatus === "Available" ? "text-green-800" : "text-gray-800"}`}
                  >
                    Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`p-3 rounded-lg mb-2 ${currentStatus === "Unavailable" ? "bg-gray-100 border border-gray-500" : "bg-gray-100"}`}
                  onPress={() => setCurrentStatus("Unavailable")}
                >
                  <Text
                    className={`font-medium ${currentStatus === "Unavailable" ? "text-gray-800" : "text-gray-600"}`}
                  >
                    Unavailable
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-end">
                  <TouchableOpacity
                    className="bg-gray-200 px-4 py-2 rounded-lg mr-2"
                    onPress={() => setShowStatusModal(false)}
                  >
                    <Text className="font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                    onPress={() => updateProductStatus(currentStatus)}
                  >
                    <Text className="font-medium text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Product Description */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-2 text-gray-900">
              Description
            </Text>
            <Text className="text-gray-600">
              {product.description || "No description available."}
            </Text>
          </View>

          {/* Product Specifications */}
          {specifications.length > 0 && (
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Specifications
            </Text>
              {specifications.map((spec: string, index: number) => (
              <View
                key={index}
                className="flex-row items-center mb-2 bg-gray-50 p-2 rounded-lg"
              >
                <View className="h-2 w-2 rounded-full bg-indigo-500 mr-3" />
                <Text className="text-gray-700">{spec}</Text>
              </View>
            ))}
          </View>
          )}

          {/* Purchase Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Purchase Information
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Purchase Date:</Text>
              <Text className="font-medium text-gray-800">
                {product.purchase_date || "Not specified"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Purchase Price:</Text>
              <Text className="font-medium text-gray-800">
                ₹{product.purchase_price || "0"}
              </Text>
            </View>
          </View>

          {/* Rental History - this would come from a separate rental records table */}
          {isForRent && (
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Rental History
            </Text>
            {renderRentalHistory()}
          </View>
          )}

          {/* Product Details - Add customer information display */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Status Information
            </Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-700 font-medium w-1/3">Current Status:</Text>
              <View className={`px-2 py-1 rounded-full ${getStatusColor(product.status)}`}>
                <Text className="text-xs font-medium">{product.status}</Text>
              </View>
            </View>
            
            {(product.status === "Rented" || product.status === "Sold") && product.customer_name && (
              <>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-700 font-medium w-1/3">Customer:</Text>
                  <Text className="text-gray-800">{product.customer_name}</Text>
                </View>
                
                {product.customer_email && (
                  <View className="flex-row items-center mb-2">
                    <Text className="text-gray-700 font-medium w-1/3">Email:</Text>
                    <Text className="text-gray-800">{product.customer_email}</Text>
                  </View>
                )}
                
                {product.customer_phone && (
                  <View className="flex-row items-center mb-2">
                    <Text className="text-gray-700 font-medium w-1/3">Phone:</Text>
                    <Text className="text-gray-800">{product.customer_phone}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Notification */}
        <Notification
          visible={notification.visible}
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(prev => ({ ...prev, visible: false }))}
          autoClose={3000}
        />
      </SafeAreaView>
    </PageTransition>
  );
}
